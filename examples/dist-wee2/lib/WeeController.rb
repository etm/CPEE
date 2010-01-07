require ::File.dirname(__FILE__) + '/EmptyWorkflow'

class WeeController
  attr_reader :instances

  def initialize
    @instances =  {}
    @threads = {}
    @names = {}
    @results = {}
  end
  def make_instance(id)
    @instances[id] = EmptyWorkflow.new
  end
  def remove_instance(delete_id)
    @instances.delete delete_id
  end
  def [](id)
    @instances[id]
  end
  def start(id)
    Thread.abort_on_exception = true;
    @threads[id] = Thread.new {Thread.current.abort_on_exception = true; @results[id] = self[id].start}
  end
  def stop(id)
    self[id].stop
    @threads[id].join
  end
  def result(id)
    @results[id]
  end
  def name
    return @names
  end
  def set_name(id, name)
    @names[id] = name
  end
end
