require 'logger'  
require 'Workflow'
# $LOG = Logger.new('wee.log', 'monthly')  
t = Workflow.new
t.execute
