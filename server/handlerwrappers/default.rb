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
    @url = arguments[1]
    @handler_continue = continue
    @handler_endpoint = endpoint
    @handler_position = position
    @handler_passthrough = nil
    @handler_returnValue = nil
  end # }}}

  def activity_handle(passthrough, parameters) # {{{
    @controller.notify("running/activity_calling", :instance => "#{@url}/#{@controller.id}", :activity => @handler_position, :passthrough => passthrough, :endpoint => @handler_endpoint, :parameters => parameters)

    if passthrough.nil?
      params = []
      callback = Digest::MD5.hexdigest(Kernel::rand().to_s)
      (parameters[:parameters] || {}).each do |k,v|
        params <<  Riddl::Parameter::Simple.new("#{k}",CPEE::ValueHelper::generate(v))
      end
      params << Riddl::Header.new("CPEE_BASE",@url)
      params << Riddl::Header.new("CPEE_INSTANCE","#{@url}/#{@controller.id}")
      params << Riddl::Header.new("CPEE_CALLBACK",callback)

      type = parameters[:method] || 'post'
      client = Riddl::Client.new(@handler_endpoint)

      status, result, headers = client.request type => params
      raise "Could not #{parameters[:method] || 'post'} #{@handler_endpoint}" if status != 200

      if headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true'
        @controller.callbacks[callback] = CPEE::Callback.new("callback activity: #{@handler_position}",self,:callback,nil,nil,:http)
        @handler_passthrough = callback
        return
      end
    else
      @controller.callbacks[passthrough] = CPEE::Callback.new("callback activity: #{@handler_position}",self,:callback,nil,nil,:http)
      @handler_passthrough = passthrough
      return
    end

    @handler_returnValue = result
    @handler_continue.continue
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
    @controller.notify("running/activity_done", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position)
  end # }}}
  def inform_activity_manipulate # {{{
    @controller.notify("running/activity_manipulating", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position)
  end # }}}
  def inform_activity_failed(err) # {{{
    puts err.message
    puts err.backtrace
    @controller.notify("running/activity_failed", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position, :message => err.message, :line => err.backtrace[0].match(/(.*?):(\d+):/)[2], :where => err.backtrace[0].match(/(.*?):(\d+):/)[1])
  end # }}}

  def inform_syntax_error(err,code)# {{{
    puts err.message
    puts err.backtrace
    @controller.notify("properties/description/error", :instance => "#{@url}/#{@controller.id}", :message => err.message)
  end# }}}
  def inform_manipulate_change(status,dataelements,endpoints) # {{{
    unless status.nil?
      @controller.serialize_status!
      @controller.notify("properties/status/change", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position, :id => status.id, :message => status.message)
    end  
    unless dataelements.nil?
      @controller.serialize_dataelements!
      @controller.notify("properties/dataelements/change", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position, :changed => dataelements)
    end
    unless endpoints.nil?
      @controller.serialize_endpoints!
      @controller.notify("properties/endpoints/change", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position, :changed => endpoints)
    end  
  end # }}}
  def inform_position_change(ipc={}) # {{{
    @controller.serialize_positions!
    ipc[:instance] = "#{@url}/#{@controller.id}"
    @controller.notify("properties/position/change", ipc)
  end # }}}
  def inform_state_change(newstate) # {{{
    if @controller
      @controller.serialize_state!
      @controller.notify("properties/state/change", :instance => "#{@url}/#{@controller.id}", :state => newstate)
    end
  end # }}}

  def vote_sync_after # {{{
    @controller.call_vote("running/syncing_after", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position)
  end # }}}
  def vote_sync_before(parameters=nil) # {{{
    @controller.call_vote("running/syncing_before", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position)
  end # }}}

  def callback(result)
    @handler_returnValue = result
    @controller.callbacks.delete(@handler_passthrough)
    @handler_passthrough = nil
    @handler_continue.continue
  end

   def simulate(type,nesting,tid,parent,parameters={}) #{{{
    pp "#{type} - #{nesting} - #{tid} - #{parent} - #{parameters.inspect}"

    @controller.call_vote("simulating/step", 
      :endpoint => @handler_endpoint, 
      :instance => "#{@url}/#{@controller.id}", 
      :activity => tid, 
      :type => type, 
      :nesting => nesting,
      :parent => parent,
      :parameters => parameters
    )
  end #}}}
end
