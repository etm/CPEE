# require 'Thread'
require ::File.dirname(__FILE__) + '/../../../lib/Wee'
require ::File.dirname(__FILE__) + '/../../../../riddl/lib/ruby/client'

class MonitoringHandler < Wee::HandlerWrapperBase
  def initialize(url)
    p "MonitoringHandler.initialize: url = #{url.inspect}"
    url = url.is_a?(String) ? url : url[0];
    srv = Riddl::Client.new(/(.*:\/\/.*:[0-9]*\/)(.*)/.match(url)[1])
    @logresource = srv.resource(/(.*:\/\/.*:[0-9]*\/)(.*)/.match(url)[2])

    @__myhandler_stopped = false
    @__myhandler_finished = false
    @__myhandler_returnValue = nil
  end

  def log(type, details)
    p "[#{Time.now.to_s}] #{type}: #{details}"
    @logresource.request :post => [
      Riddl::Parameter::Simple.new("stamp", Time.now.to_s),
      Riddl::Parameter::Simple.new("type", type),
      Riddl::Parameter::Simple.new("details", details)
    ]
  end

  # executes a ws-call to the given endpoint with the given parameters. the call
  # can be executed asynchron, see finished_call & return_value
  def handle_call(position, passthrough, endpoint, *parameters)
    log "handle_call", "Handle call: position=[#{position}]; passthrough=[#{passthrough}], endpoint=[#{endpoint}], parameters=[#{parameters.inspect}]"
    Thread.new do
      tosleep = parameters ? parameters.last : 1
      tosleep.to_i.times do
        sleep(1) unless @__myhandler_stopped
        # Thread.pass
      end
      @__myhandler_finished = true
      @__myhandler_returnValue = tosleep
    end
  end

  # returns true if the last handled call has finished processing, or the
  # call runs independent (asynchronous call)
  def finished_call
    return @__myhandler_finished
  end

  # returns the result of the last handled call
  def return_value
    @__myhandler_finished ? @__myhandler_returnValue : nil
  end
  # Called if the WS-Call should be interrupted. The decision how to deal
  # with this situation is given to the handler. To provide the possibility
  # of a continue the Handler will be asked for a passthrough
  def stop_call
    log "stop_call", "Recieved stop signal, aborting on next possibility"
    @__myhandler_stopped = true
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
    log "stop_call", "Recieved no_longer_necessary signal, aborting on next possibility"
    @__myhandler_stopped = true
  end
  # Is called if a Activity is executed correctly
  def inform_activity_done(activity, context)
    log "inform_activity_done", "Activity #{activity} done"
  end
  # Is called if a Activity is executed with an error
  def inform_activity_failed(activity, context, err)
    log "inform_activity_failed", "Activity #{activity} failed with error #{err}"
    raise(err)
  end
  def inform_workflow_state(newstate)
    log "inform_workflow_state", "State changed to #{newstate}"
  end
end
