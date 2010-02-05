class Handler < Wee::HandlerWrapperBase
  def initialize(arguments)
    @expand_params = true
    @__basichandler_stopped = false
    @__basichandler_finished = false
    @__basichandler_returnValue = nil
  end

  # executes a ws-call to the given endpoint with the given parameters. the call
  # can be executed asynchron, see finished_call & return_value
  def handle_call(position, passthrough, endpoint, *parameters)
    sleep(0.6)
    return if @__basichandler_stopped
    @__basichandler_finished = true
    @__basichandler_returnValue = 'Handler_Dummy_Result'
  end
 
  # returns true if the last handled call has finished processing, or the
  # call runs independent (asynchronous call) 
  def finished_call
    return @__basichandler_finished
  end
  
  # returns the result of the last handled call
  def return_value
    @__basichandler_finished ? @__basichandler_returnValue : nil
  end
  # Called if the WS-Call should be interrupted. The decision how to deal
  # with this situation is given to the handler. To provide the possibility
  # of a continue the Handler will be asked for a passthrough
  def stop_call
    @__basichandler_stopped = true
  end
  # is called from Wee after stop_call to ask for a passthrough-value that may give
  # information about how to continue the call. This passthrough-value is given
  # to handle_call if the workflow is configured to do so.
  def passthrough
    nil
  end
  
  # Called if the execution of the actual handle_call is not necessary anymore
  # It is definit that the call will not be continued.
  # At this stage, this is only the case if parallel branches are not needed
  # anymore to continue the workflow
  def no_longer_necessary
    @__basichandler_stopped = true
  end
  # Is called if a Activity is executed correctly
  def inform_activity_done(activity, context)
  end
  # Is called if a Activity is executed with an error
  def inform_activity_failed(activity, context, err)
    raise(err)
  end
  def inform_workflow_state(newstate)
  end
end
