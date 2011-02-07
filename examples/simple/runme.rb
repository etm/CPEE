#!/usr/bin/env ruby
require ::File.dirname(__FILE__) + '/SimpleWorkflow'

t = SimpleWorkflow.new
execution = t.start
execution.join()
puts "========> Ending-Result:"
puts "  data:#{t.data.inspect}"
puts "  status:#{t.status.inspect}"
puts "  state:#{t.state}"


