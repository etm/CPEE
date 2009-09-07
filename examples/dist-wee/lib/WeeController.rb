require 'lib/EmptyWorkflow'

class WeeController
  attr_reader :instances

  def initialize
    @instances = {}
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
end