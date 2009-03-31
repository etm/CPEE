require 'logger'
require 'Workflow'

def show_normal
  t = Workflow.new
  result = nil
  execution = Thread.new { result = t.execute }
  execution.join()
  return result
end
def show_stop
  t = Workflow.new
  result = nil
  execution = Thread.new { result = t.execute }
  sleep(0.5)
  t.stop
  execution.join
  return result
end
def show_stop_and_replace
  t = Workflow.new
  result = nil
  execution = Thread.new { result = t.execute }
  sleep(1.1)
  t.stop
  execution.join

  t.replace_execute do activity :newA, :call, :endpoint3 end
  t2 = Workflow_2.new
  puts t.endpoint1
  execution = Thread.new { result = t.execute }
  execution.join
  return result
end
def show_stop_and_replace
  t = Workflow.new
  result = nil
  execution = Thread.new { result = t.execute }
  t.stop
  execution.join()
  t.endstate = :normal
  t.instance_eval do
    def execute
      activity :a1_1, :call, :endpoint1 do |result|    # Call an endpoint and use the result
        @y = result;                                   # Alter a defined context variable
        @x = "Successfull replaced the execution code"
      end
      return [endstate, position, context]
    end
  end
  execution = Thread.new { result = t.execute }
  execution.join
  return result
end

puts "===================================================="
result = show_stop_and_replace
puts "========> Ending-Result: #{result.inspect}"
