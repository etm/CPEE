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

require 'opcua/client'

class DefaultHandlerWrapper < WEEL::HandlerWrapperBase
  def self::inform_state_change(arguments,newstate) # {{{
    controller = arguments[0]
		controller.serialize_state!
		controller.notify("state/change", :instance => controller.instance, :instance_uuid => controller.uuid, :state => newstate, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
		controller.finalize_if_finished
  end # }}}
  def self::inform_syntax_error(arguments,err,code)# {{{
    controller = arguments[0]
    controller.notify("description/error", :instance => controller.instance, :instance_uuid => controller.uuid, :message => err.message, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
  end# }}}
  def self::inform_handlerwrapper_error(arguments,err) # {{{
    controller = arguments[0]
    controller.notify("handlerwrapper/error", :instance => controller.instance, :instance_uuid => controller.uuid, :message => err.message, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
  end # }}}
  def self::inform_position_change(arguments,ipc={}) # {{{
    controller = arguments[0]
    controller.serialize_positions!
    ipc[:instance] = controller.instance
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
    @label = ''
  end # }}}

  def prepare(readonly, endpoints, parameters)
    @handler_endpoint = endpoints.is_a?(Array) ? endpoints.map{ |ep| readonly.endpoints[ep] }.compact : readonly.endpoints[endpoints]
    parameters[:arguments].each do |ele|
      if ele.value.is_a?(Proc)
        ele.value = readonly.instance_exec &ele.value
      end
    end
    parameters
  end

  def activity_handle(passthrough, parameters) # {{{
    raise "Wrong endpoint" if @handler_endpoint.nil? || @handler_endpoint.empty?
    @label = parameters[:label]
    @sensors = parameters[:sensors]
    @aggregators = parameters[:aggregators]
    @costs = parameters[:costs]
    @controller.notify("activity/calling", :instance => @controller.instance, :instance_uuid => @controller.uuid, :label => @label, :instance_name => @controller.info, :activity => @handler_position, :passthrough => passthrough, :endpoint => @handler_endpoint, :parameters => parameters, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
    if passthrough.to_s.empty?
      if @handler_endpoint.start_with?('opc.tcp')
        if @handler_endpoint =~ /^opc\.tcp-read:\/\/([^\/]+)\/(\d+)\/(.+)/
          nid = $3 == $3.to_i.to_s ? $3.to_i : $3
          ns  = $2
          url = 'opc.tcp://' + $1
          client = OPCUA::Client.new(url)
          if (node = client.get ns.to_i, nid)
            result = node.value
          else
            raise 'invalid nodeid'
          end
          client.disconnect
          callback [Riddl::Parameter::Simple.new('value',result)], {}
        elsif @handler_endpoint =~ /^opc\.tcp-write:\/\/([^\/]+)\/(\d+)\/([^\?]+)(\?value=(.*))?/
          nid = $3 == $3.to_i.to_s ? $3.to_i : $3
          ns  = $2
          par = $5
          url = 'opc.tcp://' + $1
          client = OPCUA::Client.new(url)
          if (node = client.get ns.to_i, nid)
            (parameters[:arguments] || [→(:name => 'value', :value => par)] || []).each do |ele|
              what = CPEE::ValueHelper::parse_extended(ele.value)
              node.value = what
              result = what
            end
          else
            raise 'invalid nodeid'
          end
          client.disconnect
          callback [Riddl::Parameter::Simple.new('value',result)], {}
        elsif @handler_endpoint =~ /^opc\.tcp-execute:\/\/([^\/]+)\/(\d+)\/([^\?]+)(\?value=(.*))?/
          nid = $3 == $3.to_i.to_s ? $3.to_i : $3
          ns  = $2
          par = $5
          url = 'opc.tcp://' + $1
          client = OPCUA::Client.new(url)
          if (node = client.get ns.to_i, nid)
            params = []
            (parameters[:arguments] || []).each do |ele|
              what = CPEE::ValueHelper::parse_extended(ele.value)
              params << what
            end
            result = node.call *params
          else
            raise 'invalid nodeid'
          end
          client.disconnect
          callback [Riddl::Parameter::Simple.new('value',result)], {}
        end
      else
        params = []
        callback = Digest::MD5.hexdigest(Kernel::rand().to_s)
        (parameters[:arguments] || []).each do |s|
          if s.respond_to?(:mimetype)
            params <<  Riddl::Parameter::Complex.new(s.name.to_s,v.mimetype,v.value)
          else
            if s.name.to_s =~ /__$/
              params <<  Riddl::Parameter::Simple.new(s.name.to_s.chop.chop,CPEE::ValueHelper::generate(s.value),:query)
            else
              params <<  Riddl::Parameter::Simple.new(s.name.to_s,CPEE::ValueHelper::generate(s.value))
            end
          end
        end

        params << Riddl::Header.new("CPEE-BASE",@controller.base_url)
        params << Riddl::Header.new("CPEE-INSTANCE",@controller.instance)
        params << Riddl::Header.new("CPEE-INSTANCE-URL",@controller.instance_url)
        params << Riddl::Header.new("CPEE-INSTANCE-UUID",@controller.uuid)
        params << Riddl::Header.new("CPEE-CALLBACK",@controller.instance_url + '/callbacks/' + callback)
        params << Riddl::Header.new("CPEE-CALLBACK-ID",callback)
        params << Riddl::Header.new("CPEE-ACTIVITY",@handler_position)
        params << Riddl::Header.new("CPEE-LABEL",parameters[:label]||'')
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
          callback([ Riddl::Parameter::Complex.new('error','application/json',StringIO.new(JSON::generate({ 'status' => status, 'error' => result[0].value.read }))) ], 'CPEE_SALVAGE' => true)
        else
          if headers['CPEE_INSTANTIATION']
            @controller.notify("task/instantiation", :instance => @controller.instance, :label => @label, :instance_name => @controller.info, :instance_uuid => @controller.uuid, :activity => @handler_position, :endpoint => @handler_endpoint, :received => CPEE::ValueHelper.parse(headers['CPEE_INSTANTIATION']), :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
          end
          if headers['CPEE_CALLBACK'] && headers['CPEE_CALLBACK'] == 'true' && result.any?
            headers['CPEE_UPDATE'] = true
            callback result, headers
          elsif headers['CPEE_CALLBACK'] && headers['CPEE_CALLBACK'] == 'true' && result.empty?
            # do nothing, later on things will happend
          else
            callback result
          end
        end
      end
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
    @controller.notify("activity/done", :endpoint => @handler_endpoint, :instance => @controller.instance, :label => @label, :instance_name => @controller.info, :instance_uuid => @controller.uuid, :activity => @handler_position, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
  end # }}}
  def inform_activity_manipulate # {{{
    @controller.notify("activity/manipulating", :endpoint => @handler_endpoint, :instance => @controller.instance, :label => @label, :instance_name => @controller.info, :instance_uuid => @controller.uuid, :activity => @handler_position, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
  end # }}}
  def inform_activity_failed(err) # {{{
    puts err.message
    puts err.backtrace
    @controller.notify("activity/failed", :endpoint => @handler_endpoint, :label => @label, :instance_name => @controller.info, :instance => @controller.instance, :instance_uuid => @controller.uuid, :activity => @handler_position, :message => err.message, :line => err.backtrace[0].match(/(.*?):(\d+):/)[2], :where => err.backtrace[0].match(/(.*?):(\d+):/)[1], :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
  end # }}}
  def inform_manipulate_change(status,changed_dataelements,changed_endpoints,dataelements,endpoints) # {{{
    unless status.nil?
      @controller.serialize_status!
      @controller.notify("status/change", :endpoint => @handler_endpoint, :label => @label, :instance_name => @controller.info, :instance => @controller.instance, :instance_uuid => @controller.uuid, :activity => @handler_position, :id => status.id, :message => status.message, :attributes => @controller.attributes_translated, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
    end
    unless changed_dataelements.nil?
      @controller.serialize_dataelements!
      @controller.notify("dataelements/change", :endpoint => @handler_endpoint, :label => @label, :instance_name => @controller.info, :instance => @controller.instance, :instance_uuid => @controller.uuid, :activity => @handler_position, :changed => changed_dataelements, :values => dataelements, :attributes => @controller.attributes_translated, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
    end
    unless changed_endpoints.nil?
      @controller.serialize_endpoints!
      @controller.notify("endpoints/change", :endpoint => @handler_endpoint, :label => @label, :instance_name => @controller.info, :instance => @controller.instance, :instance_uuid => @controller.uuid, :activity => @handler_position, :changed => changed_endpoints, :values => endpoints, :attributes => @controller.attributes_translated, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
    end
  end # }}}

  def vote_sync_after # {{{
    @controller.call_vote("activity/syncing_after", :endpoint => @handler_endpoint, :instance => @controller.instance, :instance_uuid => @controller.uuid, :activity => @handler_position, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
  end # }}}
  def vote_sync_before(parameters=nil) # {{{
    @controller.call_vote("activity/syncing_before", :endpoint => @handler_endpoint, :instance => @controller.instance, :instance_uuid => @controller.uuid, :activity => @handler_position, :parameters => parameters, :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"))
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
    @controller.notify("activity/receiving", :instance => @controller.instance, :label => @label, :instance_name => @controller.info, :instance_uuid => @controller.uuid, :activity => @handler_position, :endpoint => @handler_endpoint, :received => structurize_result(result), :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated, :sensors => @sensors, :aggregators => @aggregators, :costs => @costs)
    result = simplify_result(result)
    if options['CPEE_UPDATE']
      @handler_returnValue = result
      if options['CPEE_UPDATE_STATUS']
        @controller.notify("activity/status", :instance => @controller.instance, :instance_uuid => @controller.uuid, :activity => @handler_position, :endpoint => @handler_endpoint, :status => options['CPEE_UPDATE_STATUS'], :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
      end
      @handler_continue.continue WEEL::Signal::Again
    else
      @controller.callbacks.delete(@handler_passthrough)
      @handler_returnValue = result
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
    @controller.notify("condition/eval", :instance => @controller.instance, :instance_uuid => @controller.uuid, :code => code, :condition => (res ? "true" : "false"), :timestamp => Time.now.strftime("%Y-%m-%dT%H:%M:%S.%L%:z"), :attributes => @controller.attributes_translated)
    res
  end

  def simulate(type,nesting,tid,parent,parameters={}) #{{{
    pp "#{type} - #{nesting} - #{tid} - #{parent} - #{parameters.inspect}"

    @controller.call_vote("simulating/step",
      :endpoint => @handler_endpoint,
      :instance => @controller.instance,
      :instance_uuid => @controller.uuid,
      :activity => tid,
      :type => type,
      :nesting => nesting,
      :parent => parent,
      :parameters => parameters
    )
  end #}}}
end
