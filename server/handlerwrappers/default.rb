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

class DefaultHandlerWrapper < WEEL::HandlerWrapperBase
  def self::inform_state_change(arguments,newstate) # {{{
    controller = arguments[0]
		controller.serialize_state!
		controller.notify("state/change", :instance => controller.instance_url, :instance_uuid => controller.uuid, :state => newstate, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
		controller.finalize_if_finished
  end # }}}
  def self::inform_syntax_error(arguments,err,code)# {{{
    controller = arguments[0]
    controller.notify("description/error", :instance => controller.instance_url, :instance_uuid => controller.uuid, :message => err.message, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
  end# }}}
  def self::inform_handlerwrapper_error(arguments,err) # {{{
    controller = arguments[0]
    controller.notify("handlerwrapper/error", :instance => controller.instance_url, :instance_uuid => controller.uuid, :message => err.message, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
  end # }}}
  def self::inform_position_change(arguments,ipc={}) # {{{
    controller = arguments[0]
    controller.serialize_positions!
    ipc[:instance] = controller.instance_url
    ipc[:instance_uuid] = controller.uuid
    ipc[:timestamp] = Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z")
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
  end # }}}

  def prepare(readonly, endpoints, parameters, replay=false) #{{{
    if replay
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

  def additional
    { :attributes => @controller.attributes_translated } rescue {}
  end

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
    params << Riddl::Header.new("CPEE-INSTANCE-URL",@controller.instance_url)
    params << Riddl::Header.new("CPEE-INSTANCE-UUID",@controller.uuid)
    params << Riddl::Header.new("CPEE-CALLBACK",@controller.instance_url + '/callbacks/' + callback)
    params << Riddl::Header.new("CPEE-CALLBACK-ID",callback)
    params << Riddl::Header.new("CPEE-ACTIVITY",@handler_position)
    params << Riddl::Header.new("CPEE-LABEL",@label||'')
    params << Riddl::Header.new("CPEE-REPLAY",@controller.attributes['replayer_args'])
    @controller.attributes.each do |key,value|
      params << Riddl::Header.new("CPEE-ATTR-#{key.to_s.gsub(/_/,'-')}",value)
    end

    tendpoint = @handler_endpoint.sub(/^http(s)?-(get|put|post|delete):/,'http\\1:')
    type = $2 || parameters[:method] || 'post'

    client = Riddl::Client.new(tendpoint)

    @controller.callbacks[callback] = CPEE::Callback.new("callback activity: #{@handler_position}",self,:callback,nil,nil,:http)
    @handler_passthrough = callback

    status, result, headers = client.request type => params
    if status < 200 || status >= 300
      headers['CPEE_SALVAGE'] = true
      c = result[0]&.value
      c = c.read if c.respond_to? :read
      callback([ Riddl::Parameter::Complex.new('error','application/json',StringIO.new(JSON::generate({ 'status' => status, 'error' => c }))) ], headers)
    else
      if headers['CPEE_INSTANTIATION']
        @controller.notify("task/instantiation", :activity_uuid => @handler_activity_uuid, :instance => @controller.instance_url, :label => @label, :instance_name => @controller.info, :instance_uuid => @controller.uuid, :activity => @handler_position, :endpoint => @handler_endpoint, :received => CPEE::ValueHelper.parse(headers['CPEE_INSTANTIATION']), :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
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
    @controller.notify("activity/calling", :activity_uuid => @handler_activity_uuid, :instance => @controller.instance_url, :instance_uuid => @controller.uuid, :label => @label, :instance_name => @controller.info, :activity => @handler_position, :passthrough => passthrough, :endpoint => @handler_endpoint, :parameters => parameters, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
    if passthrough.to_s.empty?
      proto_curl parameters
    else
      @controller.callbacks[passthrough] = CPEE::Callback.new("callback activity: #{@handler_position}",self,:callback,nil,nil,:http)
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
      @controller.callbacks.delete(@handler_passthrough)
    end
  end # }}}
  def activity_passthrough_value # {{{
    @handler_passthrough
  end # }}}

  def activity_no_longer_necessary # {{{
    true
  end # }}}

  def inform_activity_done # {{{
    @controller.notify("activity/done", :activity_uuid => @handler_activity_uuid, :endpoint => @handler_endpoint, :instance => @controller.instance_url, :label => @label, :instance_name => @controller.info, :instance_uuid => @controller.uuid, :activity => @handler_position, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
  end # }}}
  def inform_activity_manipulate # {{{
    @controller.notify("activity/manipulating", :activity_uuid => @handler_activity_uuid, :endpoint => @handler_endpoint, :instance => @controller.instance_url, :label => @label, :instance_name => @controller.info, :instance_uuid => @controller.uuid, :activity => @handler_position, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
  end # }}}
  def inform_activity_failed(err) # {{{
    puts err.message
    puts err.backtrace
    @controller.notify("activity/failed", :activity_uuid => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :instance_name => @controller.info, :instance => @controller.instance_url, :instance_uuid => @controller.uuid, :activity => @handler_position, :message => err.message, :line => err.backtrace[0].match(/(.*?):(\d+):/)[2], :where => err.backtrace[0].match(/(.*?):(\d+):/)[1], :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
  end # }}}
  def inform_manipulate_change(status,changed_dataelements,changed_endpoints,dataelements,endpoints) # {{{
    unless status.nil?
      @controller.serialize_status!
      @controller.notify("status/change", :activity_uuid => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :instance_name => @controller.info, :instance => @controller.instance_url, :instance_uuid => @controller.uuid, :activity => @handler_position, :id => status.id, :message => status.message, :attributes => @controller.attributes_translated, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
    end
    unless changed_dataelements.nil?
      @controller.serialize_dataelements!
      @controller.notify("dataelements/change", :activity_uuid => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :instance_name => @controller.info, :instance => @controller.instance_url, :instance_uuid => @controller.uuid, :activity => @handler_position, :changed => changed_dataelements, :values => dataelements, :attributes => @controller.attributes_translated, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
    end
    unless changed_endpoints.nil?
      @controller.serialize_endpoints!
      @controller.notify("endpoints/change", :activity_uuid => @handler_activity_uuid, :endpoint => @handler_endpoint, :label => @label, :instance_name => @controller.info, :instance => @controller.instance_url, :instance_uuid => @controller.uuid, :activity => @handler_position, :changed => changed_endpoints, :values => endpoints, :attributes => @controller.attributes_translated, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
    end
  end # }}}

  def vote_sync_after # {{{
    @controller.call_vote("activity/syncing_after", :activity_uuid => @handler_activity_uuid, :endpoint => @handler_endpoint, :instance => @controller.instance_url, :instance_uuid => @controller.uuid, :activity => @handler_position, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
  end # }}}
  def vote_sync_before(parameters=nil) # {{{
    @controller.call_vote("activity/syncing_before", :activity_uuid => @handler_activity_uuid, :endpoint => @handler_endpoint, :instance => @controller.instance_url, :instance_uuid => @controller.uuid, :activity => @handler_position, :parameters => parameters, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
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
    @controller.notify("activity/receiving", :activity_uuid => @handler_activity_uuid, :instance => @controller.instance_url, :label => @label, :instance_name => @controller.info, :instance_uuid => @controller.uuid, :activity => @handler_position, :endpoint => @handler_endpoint, :received => structurize_result(result), :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated, :sensors => @sensors, :aggregators => @aggregators, :costs => @costs)
    result = simplify_result(result)
    @handler_returnValue = result
    @handler_returnOptions = options
    if options['CPEE_UPDATE']
      if options['CPEE_UPDATE_STATUS']
        @controller.notify("activity/status", :activity_uuid => @handler_activity_uuid, :instance => @controller.instance_url, :instance_uuid => @controller.uuid, :activity => @handler_position, :endpoint => @handler_endpoint, :status => options['CPEE_UPDATE_STATUS'], :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
      end
      @handler_continue.continue WEEL::Signal::Again
    else
      @controller.callbacks.delete(@handler_passthrough)
      @handler_passthrough = nil
      if options['CPEE_SALVAGE']
        @handler_continue.continue WEEL::Signal::Salvage
      else
        @handler_continue.continue
      end
    end
  end

  def test_condition(mr,code)
    res = mr.instance_eval(code)
    @controller.notify("condition/eval", :instance => @controller.instance_url, :instance_uuid => @controller.uuid, :code => code, :condition => (res ? "true" : "false"), :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
    res
  end

  def simulate(type,nesting,tid,parent,parameters={}) #{{{
    pp "#{type} - #{nesting} - #{tid} - #{parent} - #{parameters.inspect}"

    @controller.call_vote("simulating/step",
      :endpoint => @handler_endpoint,
      :instance => @controller.instance_url,
      :instance_uuid => @controller.uuid,
      :activity => tid,
      :type => type,
      :nesting => nesting,
      :parent => parent,
      :parameters => parameters
    )
  end #}}}
end
