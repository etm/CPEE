#!/usr/bin/ruby
# encoding: UTF-8
require 'rubygems'
require File.expand_path(File.dirname(__FILE__) + '/../lib/bpmn2')
require File.expand_path(File.dirname(__FILE__) + '/../lib/cpee')
require 'pp'

Dir.chdir(File.expand_path(File.dirname(__FILE__)))
f = "Test 11.bpmn"

bpmn2 = ProcessTransformation::Source::BPMN2.new(File.read(f))
bpmn2.traces
tree = bpmn2.tree(true).to_s
