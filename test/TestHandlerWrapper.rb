class TestHandlerWrapper < Wee::HandlerWrapperBase
  def initialize(args,endpoint=nil,position=nil,lay=nil,continue=nil)
    @__myhandler_stopped = false
    @__myhandler_position = position
    @__myhandler_continue = continue
    @__myhandler_endpoint = endpoint
    @__myhandler_returnValue = nil
  end

  # executes a ws-call to the given endpoint with the given parameters. the call
  # can be executed asynchron, see finished_call & return_value
  def activity_handle(passthrough, parameters)
    $message += "Handle call: position=[#{@__myhandler_position}] passthrough=[#{passthrough}], endpoint=[#{@__myhandler_endpoint}], parameters=[#{parameters}]. Waiting for release\n"
    t = Thread.new() {
      released = false
      until(released) do
        if @__myhandler_stopped
          $message += "activity_handle: : Received stop signal, process is stoppable =>aborting!\n"
          return
        end
        if($released.include?("release #{@__myhandler_position.to_s}"))
          released = true
          $released["release #{@__myhandler_position.to_s}"]=""
          $message += "Handler: Released: #{@__myhandler_position}\n"
        end
        Thread.pass
      end
      @__myhandler_returnValue = 'Handler_Dummy_Result'
      @__myhandler_continue.continue
    }
  end
 
  # returns the result of the last handled call
  def activity_result_value
    @__myhandler_returnValue
  end
  # Called if the WS-Call should be interrupted. The decision how to deal
  # with this situation is given to the handler. To provide the possibility
  # of a continue the Handler will be asked for a passthrough
  def activity_stop
    $message += "Handler: Recieved stop signal, deciding if stopping\n"
    @__myhandler_stopped = true
  end
  # is called from Wee after stop_call to ask for a passthrough-value that may give
  # information about how to continue the call. This passthrough-value is given
  # to activity_handle if the workflow is configured to do so.
  def activity_passthrough_value
    return nil
  end

  # Called if the execution of the actual activity_handle is not necessary anymore
  # It is definit that the call will not be continued.
  # At this stage, this is only the case if parallel branches are not needed
  # anymore to continue the workflow
  def activity_no_longer_necessary
    $message += "Handler: Recieved no_longer_necessary signal, deciding if stopping\n"
    @__myhandler_stopped = true
  end
  # Is called if a Activity is executed correctly
  def inform_activity_done
    $message += "Activity #{@__myhandler_position} done\n"
  end
  # Is called if a Activity is executed with an error
  def inform_activity_failed(err)
    $message += "Activity #{@__myhandler_position} failed with error #{err}\n"
    raise(err)
  end
  def inform_syntax_error(err)
    $message += "Syntax messed with error #{err}\n"
    raise(err)
  end

  def inform_state_change(newstate)
    $message += "\n#{'-'*40}\nState changed to #{newstate}\n"
  end

end
