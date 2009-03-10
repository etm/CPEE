require 'logger'  
require 'Workflow'
# $LOG = Logger.new('wee.log', 'monthly')  
t = Workflow.new
result = nil
execution = Thread.new { result = t.execute }
sleep(2)
t.stop
execution.join()
puts "Ergebnis: #{result}"