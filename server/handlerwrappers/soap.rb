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

# require 'savon'

class SOAPHandlerWrapper < WEEL::HandlerWrapperBase
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
      callback = Digest::MD5.hexdigest(Kernel::rand().to_s)
      begin
        client = Savon.client do 
          wsdl @handler_endpoint
          log false
          log_level :info
          soap_header(
            "CPEE_BASE" => @url, 
            "CPEE_INSTANCE" => "#{@url}/#{@controller.id}", 
            "CPEE_CALLBACK" => callback
          )
        end 
        params = {}
        (parameters[:parameters] || {}).each do |h|
          if h.class == Hash
            h.each do |k,v|
              params[k] = JSON::generate(v)
            end  
          end  
        end
        response = client.call parameters[:method].to_sym, params
        result = response.body.first[1].first[1]
      rescue Savon::Error => error
        raise "Could not soap #{@handler_endpoint}->#{parameters[:method].to_sym}'s back: #{error.to_s}"
      end
      
      if response.http.headers["CPEE_CALLBACK"] && response.http.headers["CPEE_CALLBACK"] == 'true'
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
  def vote_sync_before # {{{
    @controller.call_vote("running/syncing_before", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position)
  end # }}}

  def callback(result=nil,options={})
    @handler_returnValue = result
    @controller.callbacks.delete(@handler_passthrough)
    @handler_passthrough = nil
    @handler_continue.continue
  end
end
