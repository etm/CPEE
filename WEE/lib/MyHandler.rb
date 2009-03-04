
class MyHandler
  def initialize
    @__myhandler_stopped = false
    @__myhandler_finished = false
    @__myhandler_returnValue = nil
  end
  def handle_call(endpoint,*parameters)
    # $LOG.debug('MyHandler.handle_call'){ "Calling [#{endpoint}] with parameters #{parameters.inspect}"}
    Thread.new() {
      sleep(0.5)
      if @__myhandler_stopped
        $LOG.debug('MyHandler.handle_call'){ "Call interrupped"}
        return
      end
      @__myhandler_finished = true
      @__myhandler_returnValue = 1
    }
  end
  
  def finished_call
    return @__myhandler_finished
  end
  def return_value
    if @__myhandler_finished
      return @__myhandler_returnValue
    else
      return nil
    end
  end
  def stop_call()
    @__myhandler_stopped = true
  end
    
  def inform_activity_done(activity, context)
    $LOG.info('MyHandler.inform_activity_done'){"Activity #{activity} done"}
  end
  def inform_activity_failed(activity, context, err)
    $LOG.error('MyHandler.inform_activity_failed'){"Activity #{activity} failed with error #{err}"}
    raise(err)
  end
end
