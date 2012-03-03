class TestHandlerWrapper < Wee::HandlerWrapperBase
  def initialize(args,endpoint=nil,position=nil,continue=nil)
    @__myhandler_stopped = false
    @__myhandler_position = position
    @__myhandler_continue = continue
    @__myhandler_endpoint = endpoint
    @__myhandler_returnValue = nil
  end

  # executes a ws-call to the given endpoint with the given parameters. the call
  # can be executed asynchron, see finished_call & return_value
  def activity_handle(passthrough, parameters)
    $long_track << "CALL #{@__myhandler_position}: passthrough=[#{passthrough}], endpoint=[#{@__myhandler_endpoint}], parameters=[#{parameters.inspect}]\n"
    $short_track << "C#{@__myhandler_position}"

    if @__myhandler_endpoint == 'stop it'
      raise Wee::Signal::Stop
    end
    if parameters[:call]
      @t = Thread.new do
        parameters[:call].call
        @__myhandler_returnValue = parameters.has_key?(:result) ? parameters[:result] : 'Handler_Dummy_Result'
        @__myhandler_continue.continue
      end   
      # give nothing back 
    else
      @__myhandler_returnValue = parameters.has_key?(:result) ? parameters[:result] : 'Handler_Dummy_Result'
      @__myhandler_continue.continue
    end  
  end
 
  # returns the result of the last handled call
  def activity_result_value
    @__myhandler_returnValue
  end
  # Called if the WS-Call should be interrupted. The decision how to deal
  # with this situation is given to the handler. To provide the possibility
  # of a continue the Handler will be asked for a passthrough
  def activity_stop
    $long_track += "STOPPED #{@__myhandler_position}\n"
    $short_track << "S#{@__myhandler_position}"
    @t.exit if @t
    @__myhandler_stopped = true
  end
  # is called from Wee after stop_call to ask for a passthrough-value that may give
  # information about how to continue the call. This passthrough-value is given
  # to activity_handle if the workflow is configured to do so.
  def activity_passthrough_value
    "SOME passthrough"
  end

  # Called if the execution of the actual activity_handle is not necessary anymore
  # It is definit that the call will not be continued.
  # At this stage, this is only the case if parallel branches are not needed
  # anymore to continue the workflow
  def activity_no_longer_necessary
    $long_track += "NO_LONGER_NECCESARY #{@__myhandler_position}\n"
    $short_track << "NLN#{@__myhandler_position}"
    @t.exit if @t
    @__myhandler_returnValue = "No longer necessary"
    @__myhandler_stopped = true
  end
  # Is called if a Activity is executed correctly
  def inform_activity_manipulate
    $long_track += "MANIPULATE #{@__myhandler_position}\n"
    $short_track << "M#{@__myhandler_position}"
  end
  # Is called if a Activity is executed correctly
  def inform_activity_done
    $long_track += "DONE #{@__myhandler_position}\n"
    $short_track << "D#{@__myhandler_position}"
  end
  # Is called if a Activity is executed with an error
  def inform_activity_failed(err)
    $long_track += "FAILED #{@__myhandler_position}: #{err}\n"
    $short_track << "F#{@__myhandler_position}"
    raise(err)
  end
  def inform_syntax_error(err,code)
    $long_track += "ERROR: Syntax messed with error #{err}\n"
    $short_track << "E"
    raise(err)
  end
  def inform_state_change(newstate)
    $long_track += "---> STATE #{newstate}\n"
    $short_track << "|#{newstate}|"
  end
end

module TestMixin #{{{
  def setup
    $long_track = ""
    $short_track = ""
    @wf = TestWorkflow.new
  end

  def teardown
    @wf.stop.join
    $long_track = ""
    $short_track = ""
  end

  def wf_assert(what,cond=true)
    if cond
      assert($long_track.include?(what),"Missing \"#{what}\":\n#{$long_track}")
    else  
      assert(!$long_track.include?(what),"Missing \"#{what}\":\n#{$long_track}")
    end
  end
  def wf_sassert(what,cond=true)
    if cond
      assert($short_track.include?(what),"#{$short_track}\nNot Present \"#{what}\":\n#{$long_track}")
    else  
      assert(!$short_track.include?(what),"#{$short_track}\nNot Present \"#{what}\":\n#{$long_track}")
    end
  end
  def wf_rsassert(pat='')
    assert($short_track =~ /#{pat}/,"Somehow executed different #{$short_track} should be '#{pat}'")
  end
end  #}}}
