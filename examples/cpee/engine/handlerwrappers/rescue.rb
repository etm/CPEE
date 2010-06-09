class RescueHash < Hash
  def value(key)
    results = []
    self.each do |k,v|
      results << v.value(key) if v.class == RescueHash
      results << v if k == key.to_sym
    end
    results.length != 1 ? results.flatten : results[0]
  end
end

module Kernel
  def neq(value)
    self != value
  end
end

class RescueHandlerWrapper < Wee::HandlerWrapperBase
  def initialize(arguments,position=nil,lay=nil,continue=nil)
    @instance = arguments[0].to_i
    @url = arguments[1]
    @handler_stopped = false
    @handler_continue = continue
    @handler_position = position
    @handler_lay = lay
    @handler_returnValue = nil
  end

  # executes a ws-call to the given endpoint with the given parameters. the call
  def activity_handle(passthrough, endpoint, parameters)
    puts '==Handler-started=='*5
    $controller[@instance].position
    $controller[@instance].notify("running/activity_calling", :activity => @handler_position, :passthrough => passthrough, :endpoint => endpoint, :parameters => parameters)
  
    cpee_instance = "#{@url}/#{@instance}/"

    pp "Endpoint: #{endpoint}"
    pp "Position: #{@handler_position}"
    pp 'Parameters:'
    pp parameters.to_yaml

    if parameters.key?(:service) # {{{
      injection_service = parameters[:service][1][:injection]
      puts "== performing a call to the injection service (#{injection_service})"
      status, resp = Riddl::Client.new(injection_service).post [Riddl::Parameter::Simple.new("position", @handler_position),
                                                                Riddl::Parameter::Simple.new("cpee", cpee_instance),
                                                                Riddl::Parameter::Simple.new("rescue", endpoint)]
      raise "'Injection at #{injection_service} failed with status: #{status}'" if status != 200
      raise "'Injection in progress'" if status == 200 # }}}
    else # {{{
      puts "== performing a call to service"
      client = Riddl::Client.new(endpoint)
      pp client.inspect

      params = []
#      callback = Digest::MD5.hexdigest(rand(Time.now).to_s)
      if parameters.key?(:group)
        (parameters[:group] || {}).each do |h|
          if h.class == Hash
            h.each do |k,v|
              params <<  Riddl::Parameter::Simple.new("#{k}","#{v}")
              puts "=== adding parameter for grouping: #{k} => #{v}"
            end
          end
        end
      end
      (parameters[:parameters] || {}).each do |h|
        if h.class == Hash
          h.each do |k,v|
            params <<  Riddl::Parameter::Simple.new("#{k}","#{v}")
            puts "=== adding parameter: #{k}"
          end
        end
      end #}}}
#      params << Riddl::Header.new("CPEE-Callback",callback)

      type = parameters[:method] || 'post'
      puts "=== Type: #{type}"
      puts "== Performing call"
      status, result, headers = client.request type => params
      puts "== Call finished with status: #{status}"
      raise "Could not #{parameters[:method] || 'post'} #{endpoint}"  if status != 200

#      res = Hash.new
#      result.each do |r| 
#        name = r.name != "" ? r.name : "void_#{rand(Time.now)}"
#        res[name.to_sym] = (r.class == Riddl::Parameter::Complex) ? r.value.read : r.value
#      end
#      @handler_returnValue = res
      @handler_returnValue = result
=begin      
      if headers["CPEE-Callback"] && headers["CPEE-Callback"] == true
        $controller[@instance].callbacks[callback] = Callback.new("callback activity: #{@handler_position}#{@handler_lay.nil? ? '': ", #{@handler_lay}"}",self,:callback,:http)
        return
      end
=end
    end
    @handler_continue.continue
    puts '==Handler finished=='*5
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
    $controller[@instance].notify("running/activity_done", :activity => @handler_position, :lay => @handler_lay)
  end
  def inform_activity_manipulate
    $controller[@instance].notify("running/activity_manipulating", :activity => @handler_position, :lay => @handler_lay)
  end
  def inform_activity_failed(err)
    puts err.message
    #puts err.backtrace if not err.message.include? "Injection"
    $controller[@instance].notify("running/activity_failed", :activity => @handler_position, :lay => @handler_lay, :message => err.message)
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
  def inform_endpoints_change(changed)
    $controller[@instance].serialize!
    $controller[@instance].notify("properties/endpoints/change", :activity => @handler_position, :lay => @handler_lay, :changed => changed)
  end
  def inform_position_change
    $controller[@instance].position
  end
  def inform_state_change(newstate)
    if $controller[@instance]
      $controller[@instance].serialize!
      $controller[@instance].notify("properties/state/change", :state => newstate)
    end
  end

  def vote_sync_after
    voteid = $controller[@instance].call_vote("running/syncing_after", :activity => @handler_position, :lay => @handler_lay)
    $controller[@instance].vote_result(voteid)
  end
  def vote_sync_before
    voteid = $controller[@instance].call_vote("running/syncing_before", :activity => @handler_position, :lay => @handler_lay)
    $controller[@instance].vote_result(voteid)
  end
end
