class DefaultHandlerWrapper < Wee::HandlerWrapperBase
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
    puts "Before pt: #{passthrough.inspect}"
    puts "Before ep: #{@handler_endpoint.inspect}"

    $controller[@instance].notify("running/activity_calling", :instance => "#{$url}/#{@instance}", :activity => @handler_position, :passthrough => passthrough, :endpoint => @handler_endpoint, :parameters => parameters)
    cpee_instance = "#{@url}/#{@instance}"

    if passthrough.nil?
      params = []
      callback = Digest::MD5.hexdigest(Kernel::rand().to_s)
      (parameters[:parameters] || {}).each do |h|
        if h.class == Hash
          h.each do |k,v|
            params <<  Riddl::Parameter::Simple.new("#{k}",MultiJson::encode(v))
          end  
        end  
      end
      params << Riddl::Header.new("CPEE-Instance",cpee_instance)
      params << Riddl::Header.new("CPEE-Callback",callback)

      type = parameters[:method] || 'post'
      client = Riddl::Client.new(@handler_endpoint)
      status, result, headers = client.request type => params
      raise "Could not #{parameters[:method] || 'post'} #{@handler_endpoint}" if status != 200

      if headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true'
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
    Wee::Status.new(1, "everything okay")
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
    # puts "CB pt: #{@handler_passthrough.inspect}"
    # puts "CB ep: #{@handler_endpoint.inspect}"
    $controller[@instance].callbacks.delete(@handler_passthrough)
    @handler_passthrough = nil
    # puts "CB pt: #{@handler_passthrough.inspect}"
    # p 'continue ....'
    @handler_continue.continue
  end
end
