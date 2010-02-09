#!/usr/bin/env ruby
require ::File.dirname(__FILE__) + '/SimpleWorkflow'

t = SimpleWorkflow.new
result = nil
execution = Thread.new {
  result = t.start
}
execution.join()
puts "========> Ending-Result: #{result.inspect}"
