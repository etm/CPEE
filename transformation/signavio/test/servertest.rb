#!/usr/bin/ruby
# encoding: UTF-8
require 'rubygems'
require 'riddl/client'
require 'pp'

Dir.chdir(File.expand_path(File.dirname(__FILE__)))

srv = Riddl::Client.new("http://localhost:9295",'../translation.xml',:jid => 'jürgen@fp7-adventure.eu',:pass => 'mangler')
res = srv.resource("/")

#status, response = res.post [
#  Riddl::Parameter::Complex.new("description","text/xml",File.read('base5.xml')),
#  Riddl::Parameter::Simple.new("type","description")
#]
#puts response[0].value.read

#status, response = res.post [
#  Riddl::Parameter::Complex.new("description","text/xml",File.read('base5.xml')),
#  Riddl::Parameter::Simple.new("type","dataelements")
#]
#pp response

status, response = res.post [
  Riddl::Parameter::Complex.new("description","text/xml",File.read('Test 1.bpmn')),
  Riddl::Parameter::Simple.new("type","endpoints")
]
pp response.first.value.read

