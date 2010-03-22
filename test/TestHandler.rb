require ::File.dirname(__FILE__) + '/../lib/Wee'

class TestHandler < Wee::HandlerWrapperBase
  def initialize(args)
    @__myhandler_stopped = false
    @__myhandler_continue = nil
    @__myhandler_returnValue = nil
  end

  # executes a ws-call to the given endpoint with the given parameters. the call
  # can be executed asynchron, see finished_call & return_value
  def handle_call(position, continue, passthrough, endpoint,parameters)
    @__myhandler_continue = continue
    $message += "Handle call: position=[#{position}] passthrough=[#{passthrough}], endpoint=[#{endpoint}], parameters=[#{parameters}]. Waiting for release\n"
    t = Thread.new() {
      released = false
      until(released) do
        if @__myhandler_stopped
          $message += "handle_call: : Received stop signal, process is stoppable =>aborting!\n"
          return
        end
        if($released.include?("release #{position.to_s}"))
          released = true
          $released["release #{position.to_s}"]=""
          $message += "Handler: Released: #{position}\n"
        end
        Thread.pass
      end
      @__myhandler_returnValue = 'Handler_Dummy_Result'
      @__myhandler_continue.continue
    }
  end
 
  # returns the result of the last handled call
  def return_value
    @__myhandler_returnValue
  end
  # Called if the WS-Call should be interrupted. The decision how to deal
  # with this situation is given to the handler. To provide the possibility
  # of a continue the Handler will be asked for a passthrough
  def stop_call()
    $message += "Handler: Recieved stop signal, deciding if stopping\n"
    @__myhandler_stopped = true
  end
  # is called from Wee after stop_call to ask for a passthrough-value that may give
  # information about how to continue the call. This passthrough-value is given
  # to handle_call if the workflow is configured to do so.
  def passthrough
    return nil
  end

  # Called if the execution of the actual handle_call is not necessary anymore
  # It is definit that the call will not be continued.
  # At this stage, this is only the case if parallel branches are not needed
  # anymore to continue the workflow
  def no_longer_necessary
    $message += "Handler: Recieved no_longer_necessary signal, deciding if stopping\n"
    @__myhandler_stopped = true
  end
  # Is called if a Activity is executed correctly
  def inform_activity_done(activity)
    $message += "Activity #{activity} done\n"
  end
  # Is called if a Activity is executed with an error
  def inform_activity_failed(activity, err)
    $message += "Activity #{activity} failed with error #{err}\n"
    raise(err)
  end
  def inform_workflow_state(newstate)
    $message += "State changed to #{newstate}"
  end

end
