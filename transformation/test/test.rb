#!/usr/bin/ruby
# encoding: UTF-8
require 'rubygems'
require File.expand_path(File.dirname(__FILE__) + '/../lib/bpmn2')
require File.expand_path(File.dirname(__FILE__) + '/../lib/cpee')
require 'pp'

Dir.chdir(File.expand_path(File.dirname(__FILE__)))
f = "Test 1.bpmn"

bpmn2 = ProcessTransformation::Source::BPMN2.new(File.read(f))

p bpmn2.dataelements
p bpmn2.endpoints


bpmn2.traces
tree = bpmn2.tree(false).to_s
xml = bpmn2.model(ProcessTransformation::Target::CPEE)

puts tree
