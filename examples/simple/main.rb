require 'pp'
require 'logger'
require 'thread'
require ::File.dirname(__FILE__) + '/SimpleWorkflow'
require ::File.dirname(__FILE__) + '/Workflow'

def show_simple
  t = SimpleWorkflow.new
  result = nil
  execution = Thread.new {
    result = t.start
  }
  execution.join()
  p result
end

def show_normal
  t = Workflow.new
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
result = show_normal
puts "========> Ending-Result: #{result.inspect}"

#  control flow do
#    activity :a1, :call, endpoint1
#    parallel do
#      parallel_branch do activity :a2_1, :call, endpoint2 end
#      parallel_branch do activity :a2_2, :call, endpoint2 end
#    end
#    activity :a2, :call, endpoint1 do |result|
#      @x += result;
#    end
#    activity :a3, :call, endpoint1, @x
#  end


