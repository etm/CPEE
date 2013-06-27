<!--
  This file is part of CPEE.

  CPEE is free software: you can redistribute it and/or modify it under the terms
  of the GNU General Public License as published by the Free Software Foundation,
  either version 3 of the License, or (at your option) any later version.

  CPEE is distributed in the hope that it will be useful, but WITHOUT ANY
  WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
  PARTICULAR PURPOSE.  See the GNU General Public License for more details.

  You should have received a copy of the GNU General Public License along with
  CPEE (file COPYING in the main directory).  If not, see
  <http://www.gnu.org/licenses/>.
-->

require 'time'
require 'date'
require 'cgi'
require 'savon'

class RescueHash < Hash
  def self::new_from_obj(obj)
    RescueHash.new.merge(obj)
  end

  def value(key)
    results = []
    self.each do |k,v|
      results << v.value(key) if v.class == RescueHash
      results << v if k == key
    end
    results.length != 1 ? results.flatten : results[0]
  end
end

module Kernel
  def neq(value)
    self != value
  end
end

Result = Struct.new(:data, :status)

class RescueHandlerWrapper < WEEL::HandlerWrapperBase
  def initialize(arguments,endpoint=nil,position=nil,continue=nil)
    @controller = arguments[0]
    @url = arguments[1]
    @handler_stopped = false
    @handler_continue = continue
    @handler_endpoint = endpoint
    @handler_position = position
    @handler_returnValue = nil
  end

# executes a ws-call to the given endpoint with the given parameters. the call
  def activity_handle(passthrough, parameters)
    @controller.notify("running/activity_calling", :instance => "#{@url}/#{@controller.id}", :activity => @handler_position, :passthrough => passthrough, :endpoint => @handler_endpoint, :parameters => parameters)

    params = []
    if parameters.key?(:info) && parameters[:info] == 'true' # {{{
      parameters[:parameters] = Array.new if (parameters.include?(:parameters) == false) || parameters[:parameters].nil?
      parameters[:parameters] << {'call-instance-uri' => "#{@url}/#{@controller.id}"}
      parameters[:parameters] << {'call-activity' => @handler_position}
      parameters[:parameters] << {'call-endpoint' => @handler_endpoint}
      parameters[:parameters] << {'call-oid' => parameters[:'call-oid']} if parameters.include?(:'call-oid')
    end # }}}
     if parameters.include?(:templates) # {{{
      parameters[:parameters] << {'templates-uri' => parameters[:templates][0][:uri]}
      parameters[:parameters] << {'template-name' => parameters[:templates][1][:name]}
      parameters[:parameters] << {'template-lang' => parameters[:templates][2][:lang]}
    end # }}}
    if parameters.key?(:service) # {{{
      injection_handler_uri = parameters[:service][1][:injection_handler]
      # Give postion to injection-handler
      @handler_returnValue = nil 
      injection_handler = Riddl::Client.new(injection_handler_uri)
      status, resp = injection_handler.post [
        Riddl::Parameter::Simple.new('activity', @handler_position), 
        Riddl::Parameter::Simple.new('instance', "#{@url}/#{@controller.id}")
      ] # here could be consumer, producer secrets
      raise "Subscription to injection-handler at #{injection_handler_uri} failed with status #{status}" unless status == 200
      raise WEEL::Signal::SkipManipulate # }}}
    elsif parameters.key?(:method) #{{{
      client = Riddl::Client.new(@handler_endpoint)
      type = parameters[:method]
      (parameters[:parameters] || {}).each do |h|
        if h.class == Hash
          h.each do |k,v|
            params <<  (parameters[:method].downcase == 'get' ? Riddl::Parameter::Simple.new("#{k}","#{v}", :query) : Riddl::Parameter::Simple.new("#{k}","#{v}"))
          end
        end
      end
      callback = Digest::MD5.hexdigest(Kernel::rand().to_s)
      params << Riddl::Header.new("CPEE_BASE",@url)
      params << Riddl::Header.new("CPEE_INSTANCE","#{@url}/#{@controller.id}")
      params << Riddl::Header.new("CPEE_CALLBACK",callback)
      status, result, headers = client.request type => params
      if(not(type == "get" and status == 200) and not(type == "post" and status == 201))
        raise "Could not perform http-#{type} on URI: #{@handler_endpoint} - Status: #{status}" 
      end
      if headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true'
        @controller.callbacks[callback] = CPEE::Callback.new("callback activity: #{@handler_position}",self,:callback,nil,nil,:http)
        return
      end
# Make rescue-hash here
      @handler_returnValue = Result.new(result, status)# }}}
# TODO
# Georg: Check log if color freeze (unmark)
# When stopping the unmark command may be ignored
# instance.js at the beginning (moz-websocket)
    elsif parameters.key?(:soap_operation)# {{{
      begin
        pp parameters
        client = Savon.client do 
          wsdl parameters[:wsdl]
          log false
          log_level :info
          soap_header(
            "CPEE_BASE" => @url, 
            "CPEE_INSTANCE" => "#{@url}/#{@controller.id}", 
          )
        end 
        params = {}
        (parameters[:parameters] || {}).each do |h|
          if h.class == Hash
            h.each do |k,v|
              params[k] = v
            end  
          end  
        end
        response = client.call parameters[:soap_operation].to_sym, params
        @handler_returnValue = Result.new(XML::Smart.new(response.to_doc), 200)
      rescue Savon::Error => error
        @handler_returnValue = error.to_s
      end
    end# }}}  
    @handler_continue.continue
  end

  def activity_result_status
    WEEL::Status.new(1, "everything okay")
  end

  # returns the result of the last handled call
  def activity_result_value
    @handler_returnValue
  end

  def activity_stop
    @handler_stopped = true
  end
  def activity_passthrough_value
    nil
  end
  
  def activity_no_longer_necessary
    @handler_stopped = true
  end

  def inform_activity_done
    @controller.notify("running/activity_done", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position)
  end
  def inform_activity_manipulate
    @controller.notify("running/activity_manipulating", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position)
  end
  def inform_activity_failed(err)
    puts err.message
    puts err.backtrace
    @controller.notify("running/activity_failed", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position, :message => err.message, :line => err.backtrace[0].match(/(.*?):(\d+):/)[2], :where => err.backtrace[0].match(/(.*?):(\d+):/)[1])
  end

  def inform_syntax_error(err,code)
    puts err.message
    puts err.backtrace
    @controller.notify("properties/description/error", :instance => "#{@url}/#{@controller.id}", :message => err.message, :line => err.backtrace[0].match(/(.*?):(\d+):/)[2], :code => code, :where => err.backtrace[0].match(/(.*?):(\d+):/)[1])
  end
  def inform_manipulate_change(status,dataelements,endpoints)
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
  end
  def inform_position_change(ipc={})
    @controller.serialize_positions!
    ipc[:instance] = "#{@url}/#{@controller.id}"
    @controller.notify("properties/position/change", ipc)
  end
  def inform_state_change(newstate)
    if @controller
      @controller.serialize_state!
      @controller.notify("properties/state/change", :instance => "#{@url}/#{@controller.id}", :state => newstate)
    end
  end

  def vote_sync_after
    @controller.call_vote("running/syncing_after", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position)
  end
  def vote_sync_before
    @controller.call_vote("running/syncing_before", :endpoint => @handler_endpoint, :instance => "#{@url}/#{@controller.id}", :activity => @handler_position)
  end

  def callback(result)
    @handler_returnValue = Result.new(result,nil)
    @handler_continue.continue
  end

end
