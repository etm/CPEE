
module MyHandler
  def handle_call(endpoint,*parameters)
    # $LOG.debug('MyHandler.handle_call'){ "Calling [#{endpoint}] with parameters #{parameters.inspect}"}
    return 1;
  end
  def finished()
    # TODO
    return true;
  end
  def inform_activity_done(activity)
    $LOG.info('MyHandler.inform_activity_done'){"Activity #{activity} done"}
  end
  def inform_activity_failed(activity, err)
    $LOG.error('MyHandler.inform_activity_failed'){"Activity #{activity} failed with error #{err}"}
  end
end
