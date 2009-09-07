require 'lib/EmptyWorkflow'

class WeeController
  attr_reader :instances

  def initialize
    @instances = {}
    @threads = {}
    @results = {}
    @id = 1
  end
  def make_instance
    @instances[@id] = EmptyWorkflow.new
    @id += 1
    @id-1
  end
  def remove_instance(delete_id)
    @instances.delete delete_id
  end
  def [](id)
    @instances[id]
  end
  def start(id)
    @threads[id] = Thread.new() {@results[id] = self[id].start}
  end
  def stop(id)
    self[id].stop
    @threads[id].join;
  end
  def result(id)
    @results[id];
  end
end