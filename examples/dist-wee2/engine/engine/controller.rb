require ::File.dirname(__FILE__) + '/empty_workflow
require 'xml/smart'

class Controller
  def initialize(id,file)
    @instance = EmptyWorkflow.new
    @thread = nil
    @result = nil
  end

  def start
    Thread.abort_on_exception = true
    @thread = Thread.new do
      Thread.current.abort_on_exception = true
      @result = @instance.start
    end
  end

  def stop
    @instance.stop
    @thread.join
    @thrad = nil 
  end

  def serialize
    
  end
  def unserialize

  end

  attr_reader :result
end
