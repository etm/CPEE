require 'pp'
require 'logger'
require 'thread'
require ::File.dirname(__FILE__) + '/SimpleWorkflow'

def show_simple
  t = SimpleWorkflow.new
  result = nil
  execution = Thread.new {
    result = t.start
  }
  execution.join()
  return result
end
def show_stop
  t = Workflow.new
  result = nil
  execution = Thread.new { result = t.start }
  sleep(0.5)
  t.stop
  execution.join
  return result
end
def show_stop_and_replace
  t = Workflow.new
  result = nil
  execution = Thread.new { result = t.start }
  t.stop
  execution.join()
  t.replace do
    activity :a1_1, :call, :endpoint1 do |re|    # Call an endpoint and use the result
      @y = re;                                   # Alter a defined context variable
      @x = "Successfull replaced the execution code"
    end
  end
  execution = Thread.new { result = t.start }
  execution.join
  return result
end

puts "===================================================="
result = show_simple
puts "========> Ending-Result: #{result.inspect}"
