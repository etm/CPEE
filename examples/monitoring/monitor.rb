#!/usr/bin/ruby
require 'pp'
require 'fileutils'

require 'rubygems'
gem 'riddl', '>=0.99.30'
require 'riddl/client'

srv = Riddl::Client.new("http://localhost:9298/")
res = srv.resource("/")

# new instance
status, response = res.post [
  Riddl::Parameter::Simple.new("name","Monitor Test")
]
ins = response.first.value

unless ins.empty?
  puts "Monitoring Instance #{ins}"
  res = srv.resource("/#{ins}/notifications/subscriptions/")
  status, response = res.post [ 
    Riddl::Parameter::Simple.new("topic","properties/description"),
    Riddl::Parameter::Simple.new("events","change"),
    Riddl::Parameter::Simple.new("topic","properties/state"),
    Riddl::Parameter::Simple.new("events","change"),
  ]
  key = response.first.value

  res = srv.resource("/#{ins}/notifications/subscriptions/#{key}/ws/").ws do |conn|
    conn.stream do |msg|
      puts msg
      puts '--------------'
    end
  end  
end
