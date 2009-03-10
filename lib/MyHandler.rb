
class MyHandler
  def initialize
    @__myhandler_stopped = false
    @__myhandler_finished = false
    @__myhandler_returnValue = nil
  end

  # executes a ws-call to the given endpoint with the given parameters 
  def handle_call(endpoint,*parameters)
    t = Thread.new() {
      if @__myhandler_stopped
        $LOG.debug('MyHandler.handle_call'){ "Recieved stop signal, aborting!"}
        return
      end
      @__myhandler_finished = true
      @__myhandler_returnValue = 'Handler_Dummy_Result'
    }
  end
 
  # returns true if the last handled call has finished processing, or the
  # call runs independent (asynchronous call) 
  def finished_call
    return @__myhandler_finished
  end
  
  # returns the result of the last handled call
  def return_value
    if @__myhandler_finished
      return @__myhandler_returnValue
    else
      return nil
    end
  end
  def stop_call()
    $LOG.debug('MyHandler.stop_call'){ "Recieved stop signal, deciding if stopping"}
    @__myhandler_stopped = true
  end
  def no_longer_necessary
    $LOG.debug('MyHandler.stop_call'){ "Recieved no_longer_necessary signal, deciding if stopping"}
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
