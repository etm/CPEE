# This file is part of CPEE.
#
# CPEE is free software: you can redistribute it and/or modify it under the terms
# of the GNU General Public License as published by the Free Software Foundation,
# either version 3 of the License, or (at your option) any later version.
#
# CPEE is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
# PARTICULAR PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along with
# CPEE (file COPYING in the main directory).  If not, see
# <http://www.gnu.org/licenses/>.

require 'charlock_holmes'
require 'mimemagic'
require 'base64'
require 'get_process_mem'
require 'cpee-eval-ruby/translation'

class ConnectionWrapper < WEEL::ConnectionWrapperBase
  def self::loop_guard(arguments,id,count) # {{{
    controller = arguments[0]
    return false if controller.attributes['nednoamol']
    tsn = Time.now
    tso = controller.loop_guard[id][:timestamp] rescue Time.now
    controller.loop_guard[id] = { :count => count, :timestamp => tsn }
    # if we have more than 100 loop iterations and the last one took less than 2 seconds, we slow the hell down
    tso + 2 > tsn && count > 100
  end # }}}

  def self::inform_state_change(arguments,newstate) # {{{
    controller = arguments[0]
		controller.notify("state/change", :state => newstate)
  end # }}}
  def self::inform_syntax_error(arguments,err,code)# {{{
    # TODO extract spot (code) where error happened for better error handling (ruby 3.1 only)
    # https://github.com/rails/rails/pull/45818/commits/3beb2aff3be712e44c34a588fbf35b79c0246ca5
    controller = arguments[0]
    begin
      controller.notify("description/error", :message => err.backtrace[0].match(/(.*?)(, Line |:)(\d+):\s(.*)/)[4] + err.message, :line => err.backtrace[0].match(/(.*?)(, Line |:)(\d+):/)[3], :where => err.backtrace[0].match(/(.*?)(, Line |:)(\d+):/)[1])
    rescue => e
      controller.notify("description/error", :message => err.message)
    end
  end# }}}
  def self::inform_connectionwrapper_error(arguments,err) # {{{
    controller = arguments[0]
    begin
      if err.backtrace[0] !~ /, Line/
        controller.notify("executionhandler/error", :message => err.backtrace[0].gsub(/(Activity a\d+)/,'\1:'), :line => -1, :where => err.backtrace[0].match(/Activity a\d+/)[0])
      else
        controller.notify("executionhandler/error", :message => err.backtrace[0].match(/(.*?)(, Line |:)(\d+):\s(.*)/)[4] + err.message, :line => err.backtrace[0].match(/(.*?)(, Line |:)(\d+):/)[3], :where => err.backtrace[0].match(/(.*?)(, Line |:)(\d+):/)[1])
      end
    rescue => e
      controller.notify("executionhandler/error", :message => err.message)
    end
  end # }}}
  def self::inform_position_change(arguments,ipc={}) # {{{
    controller = arguments[0]
    controller.notify("position/change", ipc)
  end # }}}
  def self::inform_activity_minimal(arguments,what,uuid,label,position) # {{{
    controller = arguments[0]
    controller.notify("activity/#{what}", :ecid => Thread.current.__id__, :'activity-uuid' => uuid, :label => label, :activity => position)
  end # }}}

  def initialize(arguments,position=nil,continue=nil) # {{{
    @controller = arguments[0]
    @handler_continue = continue
    @handler_position = position
    @handler_passthrough = nil
    @handler_returnValue = nil
    @handler_returnOptions = nil
    @handler_activity_uuid = Digest::MD5.hexdigest(Kernel::rand().to_s)
    @label = ''
    @guard_files = []
    @guard_items = []
  end # }}}

  def additional #{{{
    {
      :attributes => @controller.attributes,
      :cpee => {
        'base' => @controller.base_url,
        'instance' => @controller.instance_id,
        'instance_url' => @controller.instance_url,
        'instance_url_encoded' => Riddl::Protocols::Utils::escape(@controller.instance_url),
        'instance_uuid' => @controller.uuid
      },
      :task => {
        'label' => @label,
        'id' => @handler_position
      }
    }
  end #}}}

  def proto_curl(parameters) #{{{
    params = []
    callback = Digest::MD5.hexdigest(Kernel::rand().to_s)
    (parameters[:arguments] || []).each do |s|
      if s.respond_to?(:mimetype)
        params <<  Riddl::Parameter::Complex.new(s.name.to_s,v.mimetype,v.value)
      else
        if s.name.to_s =~ /^_Q_/
          params <<  Riddl::Parameter::Simple.new(s.name.to_s.sub(/^_Q_/,''),CPEE::ValueHelper::generate(s.value),:query)
        elsif s.name.to_s =~ /^_B_/
          params <<  Riddl::Parameter::Simple.new(s.name.to_s.sub(/^_B_/,''),CPEE::ValueHelper::generate(s.value),:body)
        elsif s.name.to_s =~ /^_H_/
          params <<  Riddl::Header.new(s.name.to_s.sub(/^_H_/,''),CPEE::ValueHelper::generate(s.value))
        elsif s.name.to_s =~ /^_C_/
          params <<  Riddl::Parameter::Complex.new(s.name.to_s.sub(/^_C_/,''),*CPEE::ValueHelper::generate(s.value).split(';',2))
        else
          params <<  Riddl::Parameter::Simple.new(s.name.to_s,CPEE::ValueHelper::generate(s.value))
        end
      end
    end

    params << Riddl::Header.new("CPEE-BASE",@controller.base_url)
    params << Riddl::Header.new("CPEE-INSTANCE",@controller.instance_id)
    params << Riddl::Header.new("CPEE-INSTANCE-URL",@controller.instance_url)
    params << Riddl::Header.new("CPEE-INSTANCE-UUID",@controller.uuid)
    params << Riddl::Header.new("CPEE-CALLBACK",File.join(@controller.instance_url,'callbacks',callback,'/'))
    params << Riddl::Header.new("CPEE-CALLBACK-ID",callback)
    params << Riddl::Header.new("CPEE-ACTIVITY",@handler_position)
    params << Riddl::Header.new("CPEE-LABEL",@label||'')
    params << Riddl::Header.new("CPEE-SIM-TARGET",@controller.attributes['sim_target']) if @controller.attributes['sim_target']
    @controller.attributes.each do |key,value|
      params << Riddl::Header.new("CPEE-ATTR-#{key.to_s.gsub(/_/,'-')}",value)
    end

    status = result = headers = nil
    begin
      tendpoint = @handler_endpoint.sub(/^http(s)?-(get|put|post|delete):/,'http\\1:')
      type = $2 || parameters[:method] || 'post'

      client = Riddl::Client.new(tendpoint)

      @handler_passthrough = callback
      @controller.callback(self,callback,:'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position)

      status, result, headers = client.request type => params
      @guard_files += result

      if status == 561
        if @controller.attributes['sim_translate']
          gettrans = Riddl::Client.new(@controller.attributes['sim_translate'])
          gtstatus, gtresult, gtheaders = gettrans.get
          if gtstatus >= 200 && gtstatus < 300
            transwhat = case headers['CPEE-SIM-TASKTYPE']
              when 'i'; 'instantiation'
              when 'ir'; 'ipc-receive'
              when 'is'; 'ipc-send'
              else
                'instantiation'
            end
            JSON::parse(gtresult.first.value.read).each do |e|
              if e['type'] == transwhat
                @handler_endpoint = e['endpoint'] if e['endpoint']
                e['arguments']&.each do |k,a|
                  if a.is_a? String
                    hname = a.gsub(/-/,'_')
                    a = headers[hname] if headers[hname]
                  elsif a.is_a? Hash
                    a.each do |k_ht, a_ht|
                      hname = a_ht.gsub(/-/,'_')
                      a[k_ht] = headers[hname] if headers[hname]
                    end
                  end
                  p = params.find{|p| p.name == k }
                  if p.nil?
                    p = Riddl::Parameter::Simple.new(k,'{}')
                    params << p
                  end

                  if a.is_a? String
                    p.value = a
                  elsif a.is_a? Hash
                    ohash = JSON::parse(p.value) rescue {}
                    ohash.merge!(a)
                    p.value = JSON.generate(ohash)
                  end
                end
              end
            end

            order = { 'behavior' => 1, 'url' => 2, 'init' => 3, 'endpoints' => 4, 'attributes' => 5, 'customization' => 6 }
            params.sort!{|a,b| order[a.name].to_i <=> order[b.name].to_i }
          end
        else
          @handler_endpoint = @handler_endpoint_orig
        end
        params.delete_if { |p| p.name == 'original_endpoint' }
      end
    end while status == 561

    if status < 200 || status >= 300
      headers['CPEE_SALVAGE'] = true
      c = result[0]&.value
      c = c.read if c.respond_to? :read
      callback([ Riddl::Parameter::Complex.new('error','application/json',StringIO.new(JSON::generate({ 'status' => status, 'error' => c }))) ], headers)
    else
      if headers['CPEE_CALLBACK'] && headers['CPEE_CALLBACK'] == 'true' && result.any?
        headers['CPEE_UPDATE'] = true
        callback result, headers
      elsif headers['CPEE_CALLBACK'] && headers['CPEE_CALLBACK'] == 'true' && result.empty?
        if headers['CPEE_INSTANTIATION']
          @controller.notify("task/instantiation", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :endpoint => @handler_endpoint, :received => CPEE::ValueHelper.parse(headers['CPEE_INSTANTIATION']))
        end
        if headers['CPEE_EVENT']
          @controller.notify("task/#{headers['CPEE_EVENT'].gsub(/[^\w_-]/,'')}", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :endpoint => @handler_endpoint)
        end
        # do nothing, later on things will happend
      else
        callback result, headers
      end
    end
  end #}}}

  def activity_handle(passthrough, parameters) # {{{
    raise "Wrong endpoint" if @handler_endpoint.nil? || @handler_endpoint.empty?
    @label = parameters[:label]
    @anno = parameters.delete(:annotations) rescue nil
    @controller.notify("status/resource_utilization", :mib => GetProcessMem.new.mb, **Process.times.to_h)
    @controller.notify("activity/calling", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :passthrough => passthrough, :endpoint => @handler_endpoint, :parameters => parameters)
    @controller.notify("activity/annotation", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :annotations => @anno)
    if passthrough.to_s.empty?
      proto_curl parameters
    else
      @controller.callback(self,passthrough,:'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position)
      @handler_passthrough = passthrough
    end
  end # }}}
  def activity_manipulate_handle(parameters) #{{{
    @label = parameters[:label]
    @anno = parameters.delete(:annotations) rescue nil
    @controller.notify("activity/annotation", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :annotations => @anno)
  end #}}}

  def activity_result_value # {{{
    @handler_returnValue
  end # }}}
  def activity_result_options # {{{
    @handler_returnOptions
  end # }}}

  def activity_stop # {{{
    unless @handler_passthrough.nil?
      @controller.cancel_callback(@handler_passthrough)
    end
  end # }}}
  def activity_passthrough_value # {{{
    @handler_passthrough
  end # }}}

  def activity_no_longer_necessary # {{{
    true
  end # }}}

  def activity_uuid #{{{
    @handler_activity_uuid
  end #}}}

  def inform_activity_done # {{{
    @controller.notify("activity/done", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :activity => @handler_position)
    @controller.notify("status/resource_utilization", :mib => GetProcessMem.new.mb, **Process.times.to_h)
  end # }}}
  def inform_activity_manipulate # {{{
    @controller.notify("activity/manipulating", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :activity => @handler_position)
  end # }}}
  def inform_activity_failed(err) # {{{
    @controller.notify("activity/failed", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :activity => @handler_position, :message => err.backtrace[0].match(/(.*?):(\d+):\s(.*)/)[3], :line => err.backtrace[0].match(/(.*?):(\d+):/)[2], :where => err.backtrace[0].match(/(.*?):(\d+):/)[1])
  end # }}}
  def inform_manipulate_change(status,changed_dataelements,changed_endpoints,dataelements,endpoints) # {{{
    unless status.nil?
      @controller.notify("status/change", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :activity => @handler_position, :data => { :id => status.id, :message => status.message } )
    end
    unless changed_dataelements.nil? || changed_dataelements.empty?
      de = dataelements.slice(*changed_dataelements).transform_values { |v| enc = CPEE::EvalRuby::Translation::detect_encoding(v); (enc == 'OTHER' ? v : (v.encode('UTF-8',enc) rescue CPEE::EvalRuby::Translation::convert_to_base64(v))) }
      @controller.notify("dataelements/change", :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :activity => @handler_position, :changed => changed_dataelements, :values => de)
    end
    unless changed_endpoints.nil? || changed_endpoints.empty?
      @controller.notify("endpoints/change", :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :activity => @handler_position, :changed => changed_endpoints, :values => endpoints.slice(*changed_endpoints))
    end
  end # }}}

  def vote_sync_after # {{{
    @controller.vote("activity/syncing_after", :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :activity => @handler_position, :label => @label)
  end # }}}
  def vote_sync_before(parameters=nil) # {{{
    @controller.vote("activity/syncing_before", :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :activity => @handler_position, :label => @label, :parameters => parameters)
  end # }}}

  def callback(result=nil,options={}) #{{{
    status, ret, headers = Riddl::Client.new(@controller.url_result_transformation).request 'put' => result
    recv = if status >= 200 && status < 300
      JSON::parse(ret[0].value.read)
    else
      nil
    end

    @controller.notify("activity/receiving", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :endpoint => @handler_endpoint, :received => recv)

    @guard_files += result
    @guard_files += ret

    if options['CPEE_INSTANTIATION']
      @controller.notify("task/instantiation", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :endpoint => @handler_endpoint, :received => CPEE::ValueHelper.parse(options['CPEE_INSTANTIATION']))
    end
    if options['CPEE_EVENT']
      @controller.notify("task/#{options['CPEE_EVENT'].gsub(/[^\w_-]/,'')}", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :endpoint => @handler_endpoint, :received => recv)
    end
    if options['CPEE_STATUS']
      @controller.notify("activity/status", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :endpoint => @handler_endpoint, :status => options['CPEE_STATUS'])
    end

    if options['CPEE_STATUS'] || options['CPEE_EVENT']
      @handler_returnValue = nil
      @handler_returnOptions = nil
    else
      @handler_returnValue = recv
      @handler_returnOptions = options
    end

    if options['CPEE_UPDATE']
      @handler_continue.continue WEEL::Signal::UpdateAgain
    else
      @controller.cancel_callback(@handler_passthrough)
      @handler_passthrough = nil
      if options['CPEE_SALVAGE']
        @handler_continue.continue WEEL::Signal::Salvage
      elsif options['CPEE_STOP']
        @handler_continue.continue WEEL::Signal::Stop
      else
        @handler_continue.continue
      end
    end
  end #}}}

  def mem_guard() #{{{
    @guard_files.delete_if do |p|
      if p&.respond_to?(:close)
        p.close
      elsif  p&.value&.respond_to?(:close)
        p.value.close
      end
      true
    end
    GC.start
  end #}}}

  def code_error_handling(ret,where,what=RuntimeError) #{{{
    sig = ret.find{|e| e.name == "signal" }.value
    sigt = ret.find{|e| e.name == "signal_text" }.value
    case sig
      when 'Signal::Again'; throw WEEL::Signal::Again
      when 'Signal::Error'; raise what, '', [where + ' ' + sigt]
      when 'Signal::Stop'; raise WEEL::Signal::Stop
      when 'Signal::SyntaxError'; raise SyntaxError, '', [where + ' ' + sigt]
      else
        raise 'something bad happened, but we dont know what.'
    end
  end #}}}

  def argument_transform_value(obj, struct)
    return nil unless obj.is_a?(Array) || obj.is_a?(Hash) || obj.is_a?(WEEL::ProcString)
    case obj
      when Hash
        obj.each { |k, v| ret = argument_transform_value(v, struct); obj[k] = ret unless ret.nil? }
        nil
      when Array
        obj.each_with_index { |v,i| ret = argument_transform_value(v, struct); obj[i] = ret unless ret.nil?  }
        nil
      when WEEL::ProcString
        argument_eval obj.code, struct
    end
  end

  def argument_eval(code,struct)
    send = []
    send.push Riddl::Parameter::Simple::new('code',code)
    send.push Riddl::Parameter::Complex::new('dataelements','application/json', JSON::generate(struct.data))
    send.push Riddl::Parameter::Complex::new('local','application/json', JSON::generate(struct.local)) if struct.local
    send.push Riddl::Parameter::Complex::new('endpoints','application/json', JSON::generate(struct.endpoints))
    send.push Riddl::Parameter::Complex::new('additional','application/json', JSON::generate(struct.additional))

    status, ret, headers = Riddl::Client.new(@controller.url_code).request 'put' => send
    recv = if status >= 200 && status < 300
      ret.empty? ? nil : JSON::parse(ret[0].value.read)
    else
      code_error_handling ret, 'Parameter ' + code
    end
    recv
  end

  def prepare(lock,dataelements,endpoints,status,local,additional,code,exec_endpoints,exec_parameters) #{{{
    struct = if code
      manipulate(true,lock,dataelements,endpoints,status,local,additional,code,'prepare')
    else
      WEEL::ReadStructure.new(dataelements,endpoints,local,additional)
    end
    @handler_endpoint = exec_endpoints.is_a?(Array) ? exec_endpoints.map{ |ep| struct.endpoints[ep] }.compact : struct.endpoints[exec_endpoints]
    if @controller.attributes['sim_engine']
      @handler_endpoint_orig = @handler_endpoint
      @handler_endpoint = @controller.attributes['sim_engine'].to_s + '?original_endpoint=' + Riddl::Protocols::Utils::escape(@handler_endpoint)
    end
    params = exec_parameters.dup
    params[:arguments] = params[:arguments].dup if params[:arguments]
    params[:arguments]&.map! do |ele|
      t = ele.dup
      if t.value.is_a?(WEEL::ProcString)
        t.value = argument_eval t.value.code, struct
      elsif t.value.is_a?(Array) || t.value.is_a?(Hash)
        argument_transform_value t.value, struct
      end
      t
    end
    params
  end #}}}
  def test_condition(dataelements,endpoints,local,additional,code,args={}) #{{{
    send = []
    send.push Riddl::Parameter::Simple::new('code',code)
    send.push Riddl::Parameter::Complex::new('dataelements','application/json', JSON::generate(dataelements))
    send.push Riddl::Parameter::Complex::new('local','application/json', JSON::generate(local)) if local
    send.push Riddl::Parameter::Complex::new('endpoints','application/json', JSON::generate(endpoints))
    send.push Riddl::Parameter::Complex::new('additional','application/json', JSON::generate(additional))

    status, ret, headers = Riddl::Client.new(@controller.url_code).request 'put' => send
    recv = if status >= 200 && status < 300
      ret.empty? ? nil : JSON::parse(ret[0].value.read)
    else
      code_error_handling ret, 'Condition ' + code, WEEL::Signal::Error
    end
    recv = 'false' unless recv
    recv = (recv == 'false' || recv == 'null' || recv == 'nil' || recv == false ? false : true)

    @controller.notify("gateway/decide", :ecid => Thread.current.__id__, :instance_uuid => @controller.uuid, :code => code, :condition => recv)
    @controller.notify("gateway/annotation", :ecid => Thread.current.__id__, :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :annotations => {})
    recv
  end #}}}
  def manipulate(readonly,lock,dataelements,endpoints,status,local,additional,code,where,result=nil,options=nil) #{{{
    lock.synchronize do
      send = []
      send.push  Riddl::Parameter::Simple::new('code',code)
      send.push  Riddl::Parameter::Complex::new('dataelements','application/json', JSON::generate(dataelements))
      send.push  Riddl::Parameter::Complex::new('local','application/json', JSON::generate(local)) if local
      send.push  Riddl::Parameter::Complex::new('endpoints','application/json', JSON::generate(endpoints))
      send.push  Riddl::Parameter::Complex::new('additional','application/json', JSON::generate(additional))
      send.push  Riddl::Parameter::Complex::new('status','application/json', JSON::generate(status)) if status
      send.push  Riddl::Parameter::Complex::new('call_result','application/json', JSON::generate(result))
      send.push  Riddl::Parameter::Complex::new('call_headers','application/json', JSON::generate(options))

      stat, ret, headers = Riddl::Client.new(@controller.url_code).request 'put' => send
      if stat >= 200 && stat < 300
        ret.shift # drop result
        signal = changed_status = nil
        changed_dataelements = changed_local = changed_endpoints = []
        signal = ret.shift.value if ret.any? && ret[0].name == 'signal'
        changed_dataelements = JSON::parse(ret.shift.value.read) if ret.any? && ret[0].name == 'changed_dataelements'
        changed_endpoints = JSON::parse(ret.shift.value.read) if ret.any? && ret[0].name == 'changed_endpoints'
        changed_status = JSON::parse(ret.shift.value.read) if ret.any? && ret[0].name == 'changed_status'

        struct = if readonly
          WEEL::ReadStructure.new(dataelements,endpoints,local,additional)
        else
          WEEL::ManipulateStructure.new(dataelements, endpoints, status, local, additional)
        end
        struct.update(changed_dataelements,changed_endpoints,changed_status)

        struct
      else
        code_error_handling ret, where
      end
    end
  end #}}}

  def split_branches(id, branches = []) # factual, so for inclusive or [[a],[b],[c,d,e]] {{{
    payload = { :instance_uuid => @controller.uuid, :ecid => id.to_s }
    payload[:branches] = branches.length if branches.length > 0
    @controller.notify("gateway/split", payload )
  end #}}}
  def join_branches(id, branches = []) # factual, so for inclusive or [[a],[b],[c,d,e]] {{{
    payload = { :instance_uuid => @controller.uuid, :ecid => id.to_s }
    payload[:branches] = branches if branches.length > 0
    payload[:branches_length] = branches.length if branches.length > 0
    @controller.notify("gateway/join", payload )
  end #}}}
end
