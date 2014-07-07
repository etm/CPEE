#!/usr/bin/ruby
# encoding: UTF-8
require 'rubygems'
require File.expand_path(File.dirname(__FILE__) + '/../lib/bpmn2')
require 'pp'

Dir.chdir(File.expand_path(File.dirname(__FILE__)))
Dir["Test *.bpmn"].each do |f|
  bpmn2 = ProcessTransformation::Source::BPMN2.new(File.read(f))
  bpmn2.traces
  tree = bpmn2.tree(false).to_s
  xml = bpmn2.model(ProcessTransformation::Target::CPEE)
  fname = File.basename(f,'.bpmn')
  File.write(fname + '.tree',tree)
  File.write(fname + '.xml',xml)
end
