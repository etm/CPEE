#!/usr/bin/ruby
require 'rubygems'
require 'riddl/client'
require 'xml/smart'
require 'pp'

namepattern = /Performance \d+/
cpees = [
  "http://localhost:9298/"
]

cpees.each do |cpee|
  srv  = Riddl::Client.new(cpee)
  res = srv.resource("/")
  status, response = res.get
  doc = XML::Smart::string(response.first.value.read)
  ins = doc.find("/instances/instance")
  unless ins.empty?
    ins.each do |e|
      next unless e.text =~ namepattern
      p e.text
      res = srv.resource("/#{e.attributes['id']}")
      status, response = res.delete
    end
  end  
end

