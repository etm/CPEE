class DefaultHandlerWrapper < Wee::HandlerWrapperBase
  def initialize(arguments,endpoint=nil,position=nil,lay=nil,continue=nil) # {{{
    @instance = arguments[0].to_i
    @url = arguments[1]
    @handler_stopped = false
    @handler_continue = continue
    @handler_endpoint = endpoint
    @handler_position = position
    @handler_lay = lay
    @handler_returnValue = nil
  end # }}}

  def activity_handle(passthrough, parameters) # {{{
    $controller[@instance].notify("running/activity_calling", :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :passthrough => passthrough, :endpoint => @handler_endpoint, :parameters => parameters)
    cpee_instance = "#{@url}/#{@instance}"

    params = []
    callback = Digest::MD5.hexdigest(Kernel::rand().to_s)
    (parameters[:parameters] || {}).each do |h|
      if h.class == Hash
        h.each do |k,v|
          params <<  Riddl::Parameter::Simple.new("#{k}",ActiveSupport::JSON::encode(v))
        end  
      end  
    end
    params << Riddl::Header.new("CPEE-Instance",cpee_instance)
    params << Riddl::Header.new("CPEE-Callback",callback)

    type = parameters[:method] || 'post'
    client = Riddl::Client.new(@handler_endpoint)
    status, result, headers = client.request type => params
    raise "Could not #{parameters[:method] || 'post'} #{@handler_endpoint}" if status != 200

    @handler_returnValue = ''
    if headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true'
      $controller[@instance].callbacks[callback] = Callback.new("callback activity: #{@handler_position}#{@handler_lay.nil? ? '': ", #{@handler_lay}"}",self,:callback,nil,nil,:http)
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
    @handler_stopped = true
  end # }}}
  def activity_passthrough_value # {{{
    nil
  end # }}}

  def activity_no_longer_necessary # {{{
    @handler_stopped = true
  end # }}}

  def inform_activity_done # {{{
    $controller[@instance].notify("running/activity_done", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end # }}}
  def inform_activity_manipulate # {{{
    $controller[@instance].notify("running/activity_manipulating", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end # }}}
  def inform_activity_failed(err) # {{{
    puts err.message
    puts err.backtrace
    $controller[@instance].notify("running/activity_failed", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :message => err.message, :line => err.backtrace[0].match(/(.*?):(\d+):/)[2], :where => err.backtrace[0].match(/(.*?):(\d+):/)[1])
  end # }}}

  def inform_syntax_error(err,code)# {{{
    puts code
    puts "------"
    puts err.message
    puts err.backtrace
    $controller[@instance].notify("properties/description/error", :instance => "#{$url}/#{@instance}", :message => err.message, :line => err.backtrace[0].match(/(.*?):(\d+):/)[2], :code => code, :where => err.backtrace[0].match(/(.*?):(\d+):/)[1])
  end# }}}
  def inform_manipulate_change(status,data,endpoints) # {{{
    $controller[@instance].serialize!
    $controller[@instance].notify("properties/status/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :id => status.id, :message => status.message) unless status.nil?
    $controller[@instance].notify("properties/data-elements/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :changed => data) unless data.nil?
    $controller[@instance].notify("properties/endpoints/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :changed => endpoints) unless endpoints.nil?
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
    $controller[@instance].call_vote("running/syncing_after", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end # }}}
  def vote_sync_before # {{{
    $controller[@instance].call_vote("running/syncing_before", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end # }}}

  def callback(result)
    @handler_returnValue = [result,nil]
    @handler_continue.continue
  end
end
