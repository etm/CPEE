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
  def initialize(arguments,endpoint=nil,position=nil,continue=nil) # {{{
    @controller = arguments[0]
    @handler_continue = continue
    @handler_endpoint = endpoint
    @handler_position = position
    @handler_passthrough = nil
    @handler_returnValue = nil
  end # }}}

  def activity_handle(passthrough, parameters) # {{{
    @controller.notify("activity/calling", :instance => @controller.instance, :activity => @handler_position, :passthrough => passthrough, :endpoint => @handler_endpoint, :parameters => parameters)

    result = []
    if passthrough.nil?
      params = []
      callback = Digest::MD5.hexdigest(Kernel::rand().to_s)
      (parameters[:parameters] || {}).each do |k,v|
        if v.is_a?(Struct) 
          if v.respond_to?(:mimetype)
            params <<  Riddl::Parameter::Complex.new("#{k}",v.mimetype,v.value)
          else  
            params <<  Riddl::Parameter::Simple.new("#{k}",CPEE::ValueHelper::generate(v.value))
          end  
        else
          params <<  Riddl::Parameter::Simple.new("#{k}",CPEE::ValueHelper::generate(v))
        end 
      end
      params << Riddl::Header.new("CPEE_BASE",@controller.base_url)
      params << Riddl::Header.new("CPEE_INSTANCE",@controller.instance_url)
      params << Riddl::Header.new("CPEE_CALLBACK",@controller.instance_url + '/callbacks/' + callback)
      params << Riddl::Header.new("CPEE_ACTIVITY",@handler_position)
      params << Riddl::Header.new("CPEE_LABEL",parameters[:label])
      @controller.attributes.each do |key,value|
        params << Riddl::Header.new("CPEE_ATTR_#{key}",value)
      end  

      type = parameters[:method] || 'post'
      client = Riddl::Client.new(@handler_endpoint)

      status, result, headers = client.request type => params
      raise "Could not #{parameters[:method] || 'post'} #{@handler_endpoint}" if status != 200

      if headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true'
        @controller.callbacks[callback] = CPEE::Callback.new("callback activity: #{@handler_position}",self,:callback,nil,nil,:http)
        @handler_passthrough = callback
      else
        callback result
      end
    else
      @controller.callbacks[passthrough] = CPEE::Callback.new("callback activity: #{@handler_position}",self,:callback,nil,nil,:http)
      @handler_passthrough = passthrough
    end
  end # }}}

  def activity_result_status # {{{
    WEEL::Status.new(1, "everything okay")
  end # }}}

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
    @controller.notify("activity/done", :endpoint => @handler_endpoint, :instance => @controller.instance, :activity => @handler_position)
  end # }}}
  def inform_activity_manipulate # {{{
    @controller.notify("activity/manipulating", :endpoint => @handler_endpoint, :instance => @controller.instance, :activity => @handler_position)
  end # }}}
  def inform_activity_failed(err) # {{{
    puts err.message
    puts err.backtrace
    @controller.notify("activity/failed", :endpoint => @handler_endpoint, :instance => @controller.instance, :activity => @handler_position, :message => err.message, :line => err.backtrace[0].match(/(.*?):(\d+):/)[2], :where => err.backtrace[0].match(/(.*?):(\d+):/)[1])
  end # }}}

  def inform_syntax_error(err,code)# {{{
    @controller.notify("description/error", :instance => @controller.instance, :message => err.message)
  end# }}}
  def inform_manipulate_change(status,changed_dataelements,changed_endpoints,dataelements,endpoints) # {{{
    unless status.nil?
      @controller.serialize_status!
      @controller.notify("status/change", :endpoint => @handler_endpoint, :instance => @controller.instance, :activity => @handler_position, :id => status.id, :message => status.message)
    end  
    unless dataelements.nil?
      @controller.serialize_dataelements!
      @controller.notify("dataelements/change", :endpoint => @handler_endpoint, :instance => @controller.instance, :activity => @handler_position, :changed => changed_dataelements)
    end
    unless endpoints.nil?
      @controller.serialize_endpoints!
      @controller.notify("endpoints/change", :endpoint => @handler_endpoint, :instance => @controller.instance, :activity => @handler_position, :changed => changed_endpoints)
    end  
  end # }}}
  def inform_position_change(ipc={}) # {{{
    @controller.serialize_positions!
    ipc[:instance] = @controller.instance
    @controller.notify("position/change", ipc)
  end # }}}
  def inform_state_change(newstate) # {{{
    if @controller
      @controller.serialize_state!
      @controller.notify("state/change", :instance => @controller.instance, :state => newstate)
    end
  end # }}}

  def vote_sync_after # {{{
    @controller.call_vote("activity/syncing_after", :endpoint => @handler_endpoint, :instance => @controller.instance, :activity => @handler_position)
  end # }}}
  def vote_sync_before(parameters=nil) # {{{
    @controller.call_vote("activity/syncing_before", :endpoint => @handler_endpoint, :instance => @controller.instance, :activity => @handler_position)
  end # }}}

  def simplify_result(result)
    if result.length == 1
      if result[0].is_a? Riddl::Parameter::Simple
        result = result[0]
      elsif result[0].is_a? Riddl::Parameter::Complex
        if result[0].mimetype == 'application/json' 
          result = JSON::parse(result[0].value.read)
        elsif result[0].mimetype == 'application/xml' || result[0].mimetype == 'text/xml'
          result = XML::Smart::string(result[0].value.read)
        elsif result[0].mimetype == 'text/plain'
          result = result[0].value.read
        else
          result = result[0]
        end
      end
    end  
    result
  end

  def callback(result=nil,options={})
    result = simplify_result(result)
    if options['CPEE_UPDATE'] 
      @handler_returnValue = result
      @handler_continue.continue WEEL::Signal::Again
    else
      @controller.callbacks.delete(@handler_passthrough)
      @handler_returnValue = result
      @handler_passthrough = nil
      @handler_continue.continue
    end
  end

   def simulate(type,nesting,tid,parent,parameters={}) #{{{
    pp "#{type} - #{nesting} - #{tid} - #{parent} - #{parameters.inspect}"

    @controller.call_vote("simulating/step", 
      :endpoint => @handler_endpoint, 
      :instance => @controller.instance, 
      :activity => tid, 
      :type => type, 
      :nesting => nesting,
      :parent => parent,
      :parameters => parameters
    )
  end #}}}
end
