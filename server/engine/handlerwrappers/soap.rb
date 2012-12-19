require 'savon'
Savon.configure do |config|
  config.log = false
  config.log_level = :info                                                                                                                                      
end

class SOAPHandlerWrapper < WEEL::HandlerWrapperBase
  def initialize(arguments,endpoint=nil,position=nil,continue=nil) # {{{
    @instance = arguments[0].to_i
    @url = arguments[1]
    @handler_continue = continue
    @handler_endpoint = endpoint
    @handler_position = position
    @handler_passthrough = nil
    @handler_returnValue = nil
  end # }}}

  def activity_handle(passthrough, parameters) # {{{
    $controller[@instance].notify("running/activity_calling", :instance => "#{$url}/#{@instance}", :activity => @handler_position, :passthrough => passthrough, :endpoint => @handler_endpoint, :parameters => parameters)
    cpee_instance = "#{@url}/#{@instance}"

    if passthrough.nil?
      callback = Digest::MD5.hexdigest(Kernel::rand().to_s)
      begin
        client = Savon.client(@handler_endpoint)
        client.http.headers["CPEE-Instance"] = cpee_instance
        client.http.headers["CPEE-Callback"] = callback
        params = {}
        (parameters[:parameters] || {}).each do |h|
          if h.class == Hash
            h.each do |k,v|
              params[k] = MultiJson::encode(v)
            end  
          end  
        end
        response = client.request parameters[:method].to_sym, params
        result = response.body.first[1].first[1]
      rescue Savon::Error => error
        raise "Could not soap #{@handler_endpoint}->#{parameters[:method].to_sym}'s back: #{error.to_s}"
      end
      
      if response.http.headers["CPEE_CALLBACK"] && response.http.headers["CPEE_CALLBACK"] == 'true'
        $controller[@instance].callbacks[callback] = Callback.new("callback activity: #{@handler_position}",self,:callback,nil,nil,:http)
        @handler_passthrough = callback
        return
      end
    else
      $controller[@instance].callbacks[passthrough] = Callback.new("callback activity: #{@handler_position}",self,:callback,nil,nil,:http)
      @handler_passthrough = passthrough
      return
    end

    @handler_returnValue = result
    @handler_continue.continue
  end # }}}

  def activity_result_value # {{{
    @handler_returnValue
  end # }}}
  def activity_result_status # {{{
    WEEL::Status.new(1, "everything okay")
  end # }}}

  def activity_stop # {{{
    unless @handler_passthrough.nil?
      $controller[@instance].callbacks.delete(@handler_passthrough)
    end
  end # }}}
  def activity_passthrough_value # {{{
    @handler_passthrough
  end # }}}

  def activity_no_longer_necessary # {{{
    true
  end # }}}

  def inform_activity_done # {{{
    $controller[@instance].notify("running/activity_done", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position)
  end # }}}
  def inform_activity_manipulate # {{{
    $controller[@instance].notify("running/activity_manipulating", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position)
  end # }}}
  def inform_activity_failed(err) # {{{
    puts err.message
    puts err.backtrace
    $controller[@instance].notify("running/activity_failed", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :message => err.message, :line => err.backtrace[0].match(/(.*?):(\d+):/)[2], :where => err.backtrace[0].match(/(.*?):(\d+):/)[1])
  end # }}}

  def inform_syntax_error(err,code)# {{{
    puts err.message
    puts err.backtrace
    $controller[@instance].notify("properties/description/error", :instance => "#{$url}/#{@instance}", :message => err.message)
  end# }}}
  def inform_manipulate_change(status,data,endpoints) # {{{
    $controller[@instance].serialize!
    $controller[@instance].notify("properties/status/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :id => status.id, :message => status.message) unless status.nil?
    $controller[@instance].notify("properties/dataelements/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :changed => data) unless data.nil?
    $controller[@instance].notify("properties/endpoints/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :changed => endpoints) unless endpoints.nil?
  end # }}}
  def inform_position_change(ipc={}) # {{{
    $controller[@instance].serialize_position!
    ipc[:instance] = "#{$url}/#{@instance}"
    $controller[@instance].notify("properties/position/change", ipc)
  end # }}}
  def inform_state_change(newstate) # {{{
    if $controller[@instance]
      $controller[@instance].serialize!
      $controller[@instance].notify("properties/state/change", :instance => "#{$url}/#{@instance}", :state => newstate)
    end
  end # }}}

  def vote_sync_after # {{{
    $controller[@instance].call_vote("running/syncing_after", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position)
  end # }}}
  def vote_sync_before # {{{
    $controller[@instance].call_vote("running/syncing_before", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position)
  end # }}}

  def callback(result)
    @handler_returnValue = result
    $controller[@instance].callbacks.delete(@handler_passthrough)
    @handler_passthrough = nil
    @handler_continue.continue
  end
end
