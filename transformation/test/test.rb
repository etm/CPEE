#!/usr/bin/ruby
# encoding: UTF-8
require 'rubygems'
require File.expand_path(File.dirname(__FILE__) + '/../lib/bpmn2')
require 'pp'

Dir.chdir(File.expand_path(File.dirname(__FILE__)))

Dir['*6.bpmn'].each do |f|
  bpmn2 = ProcessTransformation::Source::BPMN2.new(File.read(f))
  xml = bpmn2.model(ProcessTransformation::Target::CPEE)
  puts xml
end

