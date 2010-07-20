class DefaultHandlerWrapper < Wee::HandlerWrapperBase
  def initialize(arguments,endpoint=nil,position=nil,lay=nil,continue=nil)
    @instance = arguments[0].to_i
    @url = arguments[1]
    @handler_stopped = false
    @handler_continue = continue
    @handler_endpoint = endpoint
    @handler_position = position
    @handler_lay = lay
    @handler_returnValue = nil
  end

  # executes a ws-call to the given endpoint with the given parameters. the call
  def activity_handle(passthrough, parameters)
    $controller[@instance].position
    $controller[@instance].notify("running/activity_calling", :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :passthrough => passthrough, :endpoint => @handler_endpoint, :parameters => parameters)

    client = Riddl::Client.new(@handler_endpoint)

    params = []
    callback = Digest::MD5.hexdigest(rand(Time.now).to_s)
    (parameters[:parameters] || {}).each do |h|
      if h.class == Hash
        h.each do |k,v|
          params <<  Riddl::Parameter::Simple.new("#{k}",ActiveSupport::JSON::encode(v))
        end  
      end  
    end
    params << Riddl::Header.new("CPEE-Instance","#{$url}/#{@instance}")
    params << Riddl::Header.new("CPEE-Callback",callback)

    type = parameters[:method] || 'post'
    status, result, headers = client.request type => params
    raise "Could not #{parameters[:method] || 'post'} #{@handler_endpoint}" if status != 200

    @handler_returnValue = ''
    if headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true'
      $controller[@instance].callbacks[callback] = Callback.new("callback activity: #{@handler_position}#{@handler_lay.nil? ? '': ", #{@handler_lay}"}",self,:callback,nil,nil,:http)
      return
    end

    @handler_returnValue = result
    @handler_continue.continue
  end

  def activity_result_status
    Wee::Status.new(1, "everything okay")
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
    $controller[@instance].notify("running/activity_done", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end
  def inform_activity_manipulate
    $controller[@instance].notify("running/activity_manipulating", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end
  def inform_activity_failed(err)
    $controller[@instance].notify("running/activity_failed", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :message => err.message)
  end
  def inform_syntax_error(err)
    puts err.message
    puts err.backtrace
    $controller[@instance].notify("properties/description/error", :instance => "#{$url}/#{@instance}", :message => err.message)
  end
  def inform_manipulate_change(status,context,endpoints)
    $controller[@instance].serialize!
    $controller[@instance].notify("properties/status/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :id => status.id, :message => status.message) unless status.nil?
    $controller[@instance].notify("properties/context-variables/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :changed => context) unless context.nil?
    $controller[@instance].notify("properties/endpoints/change", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay, :changed => endpoints) unless endpoints.nil?
  end
  def inform_position_change
    $controller[@instance].position
  end
  def inform_state_change(newstate)
    if $controller[@instance]
      $controller[@instance].serialize!
      $controller[@instance].notify("properties/state/change", :instance => "#{$url}/#{@instance}", :state => newstate)
    end
  end

  def vote_sync_after
    $controller[@instance].call_vote("running/syncing_after", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end
  def vote_sync_before
    $controller[@instance].call_vote("running/syncing_before", :endpoint => @handler_endpoint, :instance => "#{$url}/#{@instance}", :activity => @handler_position, :lay => @handler_lay)
  end
end
