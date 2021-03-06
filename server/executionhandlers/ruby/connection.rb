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

class ConnectionWrapper < WEEL::ConnectionWrapperBase
  def self::loop_guard(arguments,id,count) # {{{
    controller = arguments[0]
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
    controller = arguments[0]
    controller.notify("description/error", :message => err.message)
  end# }}}
  def self::inform_connectionwrapper_error(arguments,err) # {{{
    controller = arguments[0]
    p err.message
    p err.backtrace
    controller.notify("executionhandler/error", :message => err.message)
  end # }}}
  def self::inform_position_change(arguments,ipc={}) # {{{
    controller = arguments[0]
    controller.notify("position/change", ipc)
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

  def prepare(readonly, endpoints, parameters, replay=false) #{{{
    if replay && @controller.attributes[:replayer]
      @handler_endpoint = @controller.attributes[:replayer]
    else
      @handler_endpoint = endpoints.is_a?(Array) ? endpoints.map{ |ep| readonly.endpoints[ep] }.compact : readonly.endpoints[endpoints]
    end
    params = parameters.dup
    params[:arguments] = params[:arguments].dup if params[:arguments]
    params[:arguments]&.map! do |ele|
      t = ele.dup
      if t.value.is_a?(Proc)
        t.value = readonly.instance_exec &t.value
      end
      t
    end
    params
  end #}}}

  def additional #{{{
    { :attributes => @controller.attributes }
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
    params << Riddl::Header.new("CPEE-CALLBACK",@controller.instance_url + '/callbacks/' + callback)
    params << Riddl::Header.new("CPEE-CALLBACK-ID",callback)
    params << Riddl::Header.new("CPEE-ACTIVITY",@handler_position)
    params << Riddl::Header.new("CPEE-LABEL",@label||'')
    params << Riddl::Header.new("CPEE-REPLAY",@controller.attributes['replayer_target']) if @controller.attributes[:replayer] && @controller.attributes['replayer_target']
    @controller.attributes.each do |key,value|
      params << Riddl::Header.new("CPEE-ATTR-#{key.to_s.gsub(/_/,'-')}",value)
    end

    tendpoint = @handler_endpoint.sub(/^http(s)?-(get|put|post|delete):/,'http\\1:')
    type = $2 || parameters[:method] || 'post'

    client = Riddl::Client.new(tendpoint)

    @handler_passthrough = callback
    @controller.callback(self,callback,:'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position)

    status, result, headers = client.request type => params
    if status < 200 || status >= 300
      headers['CPEE_SALVAGE'] = true
      c = result[0]&.value
      c = c.read if c.respond_to? :read
      callback([ Riddl::Parameter::Complex.new('error','application/json',StringIO.new(JSON::generate({ 'status' => status, 'error' => c }))) ], headers)
    else
      if headers['CPEE_INSTANTIATION']
        @controller.notify("task/instantiation", :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :endpoint => @handler_endpoint, :received => CPEE::ValueHelper.parse(headers['CPEE_INSTANTIATION']))
      end
      if headers['CPEE_EVENT']
        @controller.notify("task/#{headers['CPEE_EVENT'].gsub(/[^\w_-]/,'')}", :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :endpoint => @handler_endpoint)
      end
      if headers['CPEE_CALLBACK'] && headers['CPEE_CALLBACK'] == 'true' && result.any?
        headers['CPEE_UPDATE'] = true
        callback result, headers
      elsif headers['CPEE_CALLBACK'] && headers['CPEE_CALLBACK'] == 'true' && result.empty?
        # do nothing, later on things will happend
      else
        callback result, headers
      end
    end
  end #}}}

  def activity_handle(passthrough, parameters) # {{{
    raise "Wrong endpoint" if @handler_endpoint.nil? || @handler_endpoint.empty?
    @label = parameters[:label]
    @sensors = parameters.dig(:stream,:sensors)
    @aggregators = parameters.dig(:stream,:aggregators)
    @costs = parameters.dig(:stream,:costs)
    @controller.notify("activity/calling", :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :passthrough => passthrough, :endpoint => @handler_endpoint, :parameters => parameters)
    if passthrough.to_s.empty?
      proto_curl parameters
    else
      @controller.callback(self,passthrough,:'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position)
      @handler_passthrough = passthrough
    end
  end # }}}
  def activity_manipulate_handle(parameters) #{{{
    @label = parameters[:label]
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

  def inform_activity_done # {{{
    @controller.notify("activity/done", :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :activity => @handler_position)
  end # }}}
  def inform_activity_manipulate # {{{
    @controller.notify("activity/manipulating", :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :activity => @handler_position)
  end # }}}
  def inform_activity_failed(err) # {{{
    puts err.message
    puts err.backtrace
    @controller.notify("activity/failed", :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :activity => @handler_position, :message => err.message, :line => err.backtrace[0].match(/(.*?):(\d+):/)[2], :where => err.backtrace[0].match(/(.*?):(\d+):/)[1])
  end # }}}
  def inform_manipulate_change(status,changed_dataelements,changed_endpoints,dataelements,endpoints) # {{{
    unless status.nil?
      @controller.notify("status/change", :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :activity => @handler_position, :id => status.id, :message => status.message)
    end
    unless changed_dataelements.nil?
      @controller.notify("dataelements/change", :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :activity => @handler_position, :changed => changed_dataelements, :values => dataelements)
    end
    unless changed_endpoints.nil?
      @controller.notify("endpoints/change", :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :activity => @handler_position, :changed => changed_endpoints, :values => endpoints)
    end
  end # }}}

  def vote_sync_after # {{{
    @controller.vote("activity/syncing_after", :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :activity => @handler_position, :label => @label)
  end # }}}
  def vote_sync_before(parameters=nil) # {{{
    @controller.vote("activity/syncing_before", :'activity-uuid' => @handler_activity_uuid, :endpoint => @handler_endpoint, :activity => @handler_position, :label => @label, :parameters => parameters)
  end # }}}

  def simplify_result(result)
    if result.length == 1
      if result[0].is_a? Riddl::Parameter::Simple
        result = result[0].value
      elsif result[0].is_a? Riddl::Parameter::Complex
        if result[0].mimetype == 'application/json'
          result = JSON::parse(result[0].value.read) rescue nil
        elsif result[0].mimetype == 'application/xml' || result[0].mimetype == 'text/xml'
          result = XML::Smart::string(result[0].value.read) rescue nil
        elsif result[0].mimetype == 'text/plain'
          result = result[0].value.read
          if result.start_with?("<?xml version=")
            result = XML::Smart::string(result)
          else
            result = result.to_f if result == result.to_f.to_s
            result = result.to_i if result == result.to_i.to_s
          end
        elsif result[0].mimetype == 'text/html'
          result = result[0].value.read
          result = result.to_f if result == result.to_f.to_s
          result = result.to_i if result == result.to_i.to_s
        else
          result = result[0]
        end
      end
    end
    result
  end

  def structurize_result(result)
    result.map do |r|
      if r.is_a? Riddl::Parameter::Simple
        { 'name' => r.name, 'data' => r.value }
      elsif r.is_a? Riddl::Parameter::Complex
        res = if r.mimetype == 'application/json'
          JSON::parse(r.value.read) rescue nil
        elsif r.mimetype == 'text/plain' || r.mimetype == 'text/html'
          ttt = r.value.read
          ttt = ttt.to_f if ttt == ttt.to_f.to_s
          ttt = ttt.to_i if ttt == ttt.to_i.to_s
          ttt
        else
          r.value.read
        end
        tmp = {
          'name' => r.name == '' ? 'result' : r.name,
          'mimetype' => r.mimetype,
          'data' => res
        }
        r.value.rewind
        tmp
      end
    end
  end

  def callback(result=nil,options={})
    @controller.notify("activity/receiving", :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :endpoint => @handler_endpoint, :received => structurize_result(result), :sensors => @sensors, :aggregators => @aggregators, :costs => @costs)
    @guard_files += result
    @handler_returnValue = simplify_result(result)
    @handler_returnOptions = options
    if options['CPEE_UPDATE']
      if options['CPEE_UPDATE_STATUS']
        @controller.notify("activity/status", :'activity-uuid' => @handler_activity_uuid, :label => @label, :activity => @handler_position, :endpoint => @handler_endpoint, :status => options['CPEE_UPDATE_STATUS'])
      end
      @handler_continue.continue WEEL::Signal::Again
    else
      @controller.cancel_callback(@handler_passthrough)
      @handler_passthrough = nil
      if options['CPEE_SALVAGE']
        @handler_continue.continue WEEL::Signal::Salvage
      else
        @handler_continue.continue
      end
    end
  end

  def mem_guard() #{{{
    @guard_files.each do |p|
      if p&.respond_to?(:close)
        p.close
      elsif  p&.value&.respond_to?(:close)
        p.value.close
      end
    end
  end #}}}

  def test_condition(mr,code)
    res = mr.instance_eval(code)
    @controller.notify("condition/eval", :instance_uuid => @controller.uuid, :code => code, :condition => (res ? "true" : "false"))
    res
  end

  def simulate(type,nesting,tid,parent,parameters={}) #{{{
    pp "#{type} - #{nesting} - #{tid} - #{parent} - #{parameters.inspect}"

    @controller.vote("simulating/step",
      :'activity-uuid' => @handler_activity_uuid,
      :label => @label,
      :activity => tid,
      :endpoint => @handler_endpoint,
      :type => type,
      :nesting => nesting,
      :parent => parent,
      :parameters => parameters
    )
  end #}}}
end
