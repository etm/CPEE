#!/usr/bin/ruby 
require 'optparse'
require ::File.dirname(__FILE__) + '/lib/BPEL_Transform.rb'

dowhat = nil
ARGV.options { |opt|
  opt.summary_indent = ' ' * 2
  opt.banner = "Usage:\n#{opt.summary_indent}#{File.basename($0)} [options] [FILENAME]\nExample:\n#{opt.summary_indent}#{File.basename($0)} -d hotel.bpel\n"
  opt.on("Options:")
  opt.on("--help", "-h", "This text") { puts opt; exit }
  opt.on("--dsl", "-d", "For each tile visualize the resource tree and the layers.") { dowhat = "dsl" }
  opt.on("--data-elements", "-D", "For each tile visualize the resource tree and the resulting compositions.") { dowhat = "data-elements" }
  opt.on("--endpoints", "-e", "Visualize the resulting facade.") { dowhat = "endpoints" }
  opt.on("--invocation", "-i", "Invocation messages.") { dowhat = "invocation" }
  opt.on("Filename must be a BPEL file.")
  opt.parse!
}
if ARGV.length == 0 || !File.exists?(ARGV[0]) || dowhat.nil?
  puts ARGV.options
  exit
end
fname = ARGV[0]

bt = BPEL_Transform.new(fname)
case dowhat
  when "dsl"
    puts bt.transform_dsl
  when "endpoints"
    puts bt.transform_endpoints
  when "data-elements"
    puts bt.transform_data
  when "invocation"
    puts bt.transform_invocation
end  
