
require 'logger'
require 'Workflow'
puts "========> Starting Workflow"
t = Workflow.new
result = nil
execution = Thread.new { result = t.execute }
sleep(1.5)
t.stop
execution.join()
puts "========> Ending-Result: #{result}"

# t.instance_eval()