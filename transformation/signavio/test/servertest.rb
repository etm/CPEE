#!/usr/bin/ruby
# encoding: UTF-8
require 'rubygems'
require 'riddl/client'
require 'pp'

Dir.chdir(File.expand_path(File.dirname(__FILE__)))

srv = Riddl::Client.new("http://localhost:9295",'../translation.xml',:jid => 'jürgen@fp7-adventure.eu',:pass => 'mangler')
res = srv.resource("/")

puts '### ENDPOINTS ####################' #{{{
### all endpoints
Dir['*.bpmn'].each do |f|
  status, response = res.post [
    Riddl::Parameter::Complex.new("description","text/xml",File.read(f)),
    Riddl::Parameter::Simple.new("type","endpoints")
  ]
  response.each_slice(2) do |k,v| 
    puts "#{f}: #{k.value} => #{v.value}"
  end
end #}}}

puts '### DATAELEMENTS ####################' #{{{
### all dataelements
Dir['*.bpmn'].each do |f|
  status, response = res.post [
    Riddl::Parameter::Complex.new("description","text/xml",File.read(f)),
    Riddl::Parameter::Simple.new("type","dataelements")
  ]
  response.each_slice(2) do |k,v| 
    puts "#{f}: #{k.value} => #{v.value}"
  end
end #}}}

puts '### DESCRIPTIONS ####################'
### all descriptions
Dir['*1.bpmn'].each do |f|
  status, response = res.post [
    Riddl::Parameter::Complex.new("description","text/xml",File.read(f)),
    Riddl::Parameter::Simple.new("type","description")
  ]
  puts "#{f}:"
  puts response.first.value.read
  puts "======================================"
end
