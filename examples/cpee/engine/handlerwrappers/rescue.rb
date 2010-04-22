class RescueHandlerWrapper < Wee::HandlerWrapperBase
  def initialize(arguments,position,continue)
    @instance = arguments[0].to_i
    @url = arguments[1]
    @handler_stopped = false
    @handler_continue = continue
    @handler_position = position
    @handler_returnValue = nil
  end

  # executes a ws-call to the given endpoint with the given parameters. the call
  def activity_handle(passthrough, endpoint, parameters)
    $controller[@instance].position
    $controller[@instance].notify("running/activity_calling", :activity => @handler_position, :passthrough => passthrough, :endpoint => endpoint, :parameters => parameters)
  
    cpee_instance = "#{@url}/#{@instance}/"
    injection_service = "http://localhost:9290/injection/"

    puts '='*80
    pp "Endpoint: #{endpoint}"
    pp "Position: #{@handler_position}"
    pp "Instance-Uri: #{cpee_instance}"
    pp "Injection-Service-Uri: #{injection_service}"
    pp 'Parameters:'
    pp parameters
    puts '='*80
    if parameters.key?(:service)
      puts "== performing a call to the injection service"
      status, resp = Riddl::Client.new(injection_service).post [Riddl::Parameter::Simple.new("position", @handler_position),
                                                                    Riddl::Parameter::Simple.new("cpee", cpee_instance),
                                                                    Riddl::Parameter::Simple.new("rescue", parameters[:service][:repository])];
      raise "Injection at #{injection_service} failed with status: #{status}" if status != 200
      raise "Injection in progress" if status == 200
    else
      sleep(10)
      @status = 200
    end
    @handler_returnValue = {:bla => 'blablablubli', :reservation_id => '4711', :price => 17}
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
    puts err.message
    puts err.backtrace
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
