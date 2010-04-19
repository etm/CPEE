class DefaultHandler < Wee::HandlerWrapperBase
  def initialize(arguments,position,continue)
    @instance = arguments[0].to_i
    @handler_stopped = false
    @handler_continue = continue
    @handler_position = position
    @handler_returnValue = nil
  end

  # executes a ws-call to the given endpoint with the given parameters. the call
  def activity_handle(passthrough, endpoint, parameters)
    $controller[@instance].position
    $controller[@instance].notify("running/activity_calling", :activity => @handler_position, :passthrough => passthrough, :endpoint => endpoint, :parameters => parameters)

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
    params << Riddl::Header.new("CPEE-Callback",callback)

    type = parameters[:method] || 'post'
    status, result, headers = client.request type => params

    raise "Could not #{parameters[:method] || 'post'} #{endpoint}"  if status != 200

    @handler_returnValue = ''
    if headers["CPEE-Callback"] && headers["CPEE-Callback"] == true
      $controller[@instance].callbacks[callback] = Callback.new("callback activity: #{@handler_position}",self,:callback,:http)
      return
    end

    @handler_returnValue = result
    @handler_continue.continue
  end

  def callback(result)
    @handler_returnValue = result
    @handler_continue.continue
  end
 
  # returns the result of the last handled call
  def activity_result_value
    @handler_returnValue
  end

  # Called if the WS-Call should be interrupted. The decision how to deal
  # with this situation is given to the handler. To provide the possibility
  # of a continue the Handler will be asked for a passthrough
  def activity_stop
    @handler_stopped = true
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
    @handler_stopped = true
  end

  def inform_activity_done
    $controller[@instance].position
    $controller[@instance].notify("running/activity_done", :activity => @handler_position)
  end
  def inform_activity_manipulate
    $controller[@instance].notify("running/activity_manipulating", :activity => @handler_position)
  end
  def inform_activity_failed(err)
    $controller[@instance].notify("running/activity_failed", :activity => @handler_position, :message => err.message)
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

  def vote_sync_after
    voteid = $controller[@instance].call_vote("running/syncing_after", :activity => @handler_position)
    $controller[@instance].vote_result(voteid)
  end
  def vote_sync_before
    voteid = $controller[@instance].call_vote("running/syncing_before", :activity => @handler_position)
    $controller[@instance].vote_result(voteid)
  end
end
