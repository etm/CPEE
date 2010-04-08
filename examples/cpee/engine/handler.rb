class Handler < Wee::HandlerWrapperBase
  def initialize(arguments)
    @instance = arguments[0].to_i
    @__basichandler_stopped = false
    @__basichandler_continue = nil
    @__basichandler_returnValue = nil
  end

  # executes a ws-call to the given endpoint with the given parameters. the call
  def activity_handle(id, continue, passthrough, endpoint, parameters)
    $controller[@instance].position
    $controller[@instance].notify("monitoring/activity_call", :activity => id, :passthrough => passthrough, :endpoint => endpoint, :parameters => parameters)
    @__basichandler_continue = continue    

    client = Riddl::Client.new(endpoint)

    params = []
    callback = Digest::MD5.hexdigest(rand(Time.now).to_s)
    (parameters[:parameters] || {}).each do |h|
      if h.class == Hash
        h.each do |k,v|
          params <<  Riddl::Parameter::Simple.new("#{k}","#{v}")
        end  
      end  
    end
    params << Riddl::Header.new("WEE_CALLBACK",callback)

    type = parameters[:method] || 'post'
    status, result, headers = client.request type => params

    raise "Could not #{parameters[:method] || 'post'} #{endpoint}"  if status != 200

    @__basichandler_returnValue = ''
    if headers["WEE_CALLBACK"] && headers["WEE_CALLBACK"] == true
      $controller[@instance].callbacks[callback] = Callback.new(self,:callback)
      return
    end

    @__basichandler_returnValue = result
    @__basichandler_continue.continue
  end

  def callback(result)
    @__basichandler_returnValue = result
    @__basichandler_continue.continue
  end
 
  # returns the result of the last handled call
  def activity_result_value
    @__basichandler_returnValue
  end

  # Called if the WS-Call should be interrupted. The decision how to deal
  # with this situation is given to the handler. To provide the possibility
  # of a continue the Handler will be asked for a passthrough
  def activity_stop
    @__basichandler_stopped = true
  end
  # is called from Wee after stop_call to ask for a passthrough-value that may give
  # information about how to continue the call. This passthrough-value is given
  # to activity_handle if the workflow is configured to do so.
  def activity_passthrough_value
    nil
  end
  
  # Called if the execution of the actual activity_handle is not necessary anymore
  # It is definit that the call will not be continued.
  # At this stage, this is only the case if parallel branches are not needed
  # anymore to continue the workflow
  def activity_no_longer_necessary
    @__basichandler_stopped = true
  end

  def inform_activity_done(activity)
    $controller[@instance].position
    $controller[@instance].notify("monitoring/activity_done", :activity => activity)
  end
  def inform_activity_manipulate(activity)
    $controller[@instance].notify("monitoring/activity_manipulate", :activity => activity)
  end
  def inform_activity_failed(activity, err)
    $controller[@instance].notify("monitoring/activity_failed", :activity => activity, :message => err.message)
  end
  def inform_syntax_error(err)
    $controller[@instance].notify("properties/description/error", :message => err.message)
  end
  def inform_context_change(changed)
    $controller[@instance].serialize!
    $controller[@instance].notify("properties/context-variables/change", :changed => changed)
  end
  def inform_state(newstate)
    if $controller[@instance]
      $controller[@instance].serialize!
      $controller[@instance].notify("properties/state/change", :state => newstate)
    end
  end

  def vote_sync_before(activity)
    $controller[@instance].vote("properties/running/syncing_before", :activity => activity)
  end
  def vote_sync_after(activity)
    $controller[@instance].vote("properties/running/syncing_after", :activity => activity)
  end
end
