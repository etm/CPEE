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


puts "===================================================="
result = show_stop
puts "========> Ending-Result: #{result.inspect}"