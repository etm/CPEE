# require 'Thread'
require 'pp'
require ::File.dirname(__FILE__) + '/../../../lib/Wee'
require ::File.dirname(__FILE__) + '/../includes/client'

class MonitoringHandler < Wee::HandlerWrapperBase
  def initialize(url)
    p "MonitoringHandler.initialize: url = #{url.inspect}"
    @urls = url.is_a?(String) ? url.split(',') : url[0].split(',')

    @__myhandler_continue = nil
    @__myhandler_stopped = false
    @__myhandler_returnValue = nil
  end

  def log(type, details)
    p "[#{Time.now.to_s}] #{type}: #{details}"
    @urls.each do |url|
      Riddl::Client.new(url).post [
        Riddl::Parameter::Simple.new("stamp", Time.now.to_s),
        Riddl::Parameter::Simple.new("type", type),
        Riddl::Parameter::Simple.new("details", details)
      ]
    end
  end

  # executes a Riddle-call to the given endpoint with the given parameters.
  def activity_handle(position, continue, passthrough, endpoint, parameters)
    log "activity_handle", "Handle call: position=[#{position}]; passthrough=[#{passthrough}], endpoint=[#{endpoint}], parameters=[#{parameters.inspect}]"
    @__myhandler_continue = continue
    Thread.new do
    #  do_the_riddle position, passthrough, endpoint, parameters
      p parameters[:timeout]
      do_the_sim position, passthrough, endpoint, parameters[:timeout]
      @__myhandler_continue.continue
    end
  end

  def do_the_sim(position, passthrough, endpoint, parameters)
    to_wait = parameters ? parameters.to_i : 5
    p "====="
    p "Wating for #{to_wait} times, parameters[-1]=#{parameters[-1].to_i}"
    to_wait.times() {
      sleep 1 unless @__myhandler_stopped
    }
    @__myhandler_returnValue = "dummy_value"
  end

  def do_the_riddle(position, passthrough, endpoint, parameters)
    rdl_params = []
    parameters.each do |param|
      if param.is_a?Hash
        param.each do |key, value|
          rdl_params.push Riddl::Parameter::Simple.new key, value
        end
      end
    end
    p "Calling Riddl Service: #{endpoint} ... params = #{rdl_params.inspect}"
    status, res = Riddl::Client.new(endpoint).post rdl_params
    raise RuntimeError, "Invalid riddle request, return status = #{status.inspect}" if status != "200"
    id = res[0].value
    p "Service ID = #{id}"
    p "--------------------"

    while(true)
      status, res = Riddl::Client.new("#{endpoint}/#{id}").request :get => []
      raise RuntimeError, "Invalid riddle request, return status = #{status.inspect}" if status != "200"
      p "Checking Riddl Request: url = #{endpoint}/#{id}, Status = #{status.inspect}, res = #{res.inspect}"
      break if res[0].value == "stopped" || res[0].value == "finished"
      if @__myhandler_stopped
        break
      else
        sleep 1
      end
    end
    @__myhandler_returnValue = "dummy_value"
  end



  # returns the result of the last handled call
  def activity_result_value
    @__myhandler_returnValue
  end
  # Called if the WS-Call should be interrupted. The decision how to deal
  # with this situation is given to the handler. To provide the possibility
  # of a continue the Handler will be asked for a passthrough
  def activity_stop
    log "stop_call", "Recieved stop signal, aborting on next possibility"
    @__myhandler_stopped = true
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
    log "stop_call", "Recieved no_longer_necessary signal, aborting on next possibility"
    @__myhandler_stopped = true
  end
  # Is called if a Activity is executed correctly
  def inform_activity_done(activity)
    log "inform_activity_done", "Activity #{activity} done"
  end
  # Is called if a Activity is executed with an error
  def inform_activity_failed(activity, err)
    log "inform_activity_failed", "Activity #{activity} failed with error #{err}"
    raise(err)
  end
  def inform_state(newstate)
    log "inform_workflow_state", "State changed to #{newstate}"
  end

end
