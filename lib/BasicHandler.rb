require 'logger'
require 'pp'
require ::File.dirname(__FILE__) + '/Wee'

class BasicHandler < Wee::HandlerWrapperBase
  def initialize(args,position,continue)
    @__basichandler_stopped = false
    @__basichandler_position = position
    @__basichandler_continue = continue
    @__basichandler_returnValue = nil
    $LOG = Logger.new(STDOUT) unless defined?($LOG)
  end

  # executes a ws-call to the given endpoint with the given parameters. the call
  # can be executed asynchron, see finished_call & return_value
  def activity_handle(passthrough, endpoint, parameters)
    $LOG.debug('BasicHandler.activity_handle'){ "Handle call: passthrough=[#{passthrough}], endpoint=[#{endpoint}], parameters=[#{parameters.inspect}]"}
    pp "Handle call: passthrough=[#{passthrough}], endpoint=[#{endpoint}], parameters=[#{parameters.inspect}]"
    Thread.new do
      sleep(0.6)
      return if @__basichandler_stopped
      @__basichandler_continue.continue
      @__basichandler_returnValue = 'Handler_Dummy_Result'
    end
  end
 
  # returns the result of the last handled call
  def activity_result_value
    @__basichandler_returnValue
  end
  # Called if the WS-Call should be interrupted. The decision how to deal
  # with this situation is given to the handler. To provide the possibility
  # of a continue the Handler will be asked for a passthrough
  def activity_stop
    $LOG.debug('BasicHandler.stop_call'){ "Recieved stop signal, aborting on next possibility"}
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
    $LOG.debug('BasicHandler.stop_call'){ "Recieved no_longer_necessary signal, aborting on next possibility"}
    @__basichandler_stopped = true
  end
  # Is called if a Activity is executed correctly
  def inform_activity_done
    $LOG.info('BasicHandler.inform_activity_done'){"Activity #{activity} done"}
  end
  # Is called before the results of a call are manipulated
  def inform_activity_manipulate
    $LOG.info('BasicHandler.inform_activity_manipulate'){"Activity #{activity} manipulating"}
    raise(err)
  end
  # Is called if a Activity is executed with an error
  def inform_activity_failed(err)
    $LOG.error('BasicHandler.inform_activity_failed'){"Activity #{activity} failed with error #{err}"}
    raise(err)
  end
  def inform_workflow_state(newstate)
    $LOG.info('BasicHandler.inform_workflow_state'){"State changed to #{newstate}"}
  end
end
