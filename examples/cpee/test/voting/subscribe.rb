#!/usr/bin/ruby
require 'rubygems'
require '../../../../riddl/lib/ruby/client'
require 'digest/md5'
require 'yaml'

srv = Riddl::Client.new("http://localhost:9298/")

res = srv.resource("/")
status, response = res.post [
  Riddl::Parameter::Simple.new("name","Subscription Test")
]

instance = response[0].value
puts "Instance: #{instance}"
 
['endpoints','context-variables','description'].each do |e|
  res = srv.resource("/#{instance}/properties/values/#{e}")
  status, response = res.put [
    Riddl::Parameter::Simple.new("content",File::read("testset/#{e}"))
  ]
end

1.upto 3 do |i|
  res = srv.resource("/#{instance}/notifications/subscriptions/")
  status, response = res.post [ 
    Riddl::Parameter::Simple.new("url","http://www.pri.univie.ac.at/~mangler/services/voter.php"),
    Riddl::Parameter::Simple.new("topic","running"),
    Riddl::Parameter::Simple.new("votes","syncing_after"),
  ]
  puts "Subscription #{i}: #{response[0].value}"
end

res = srv.resource("/#{instance}/properties/values/state")
status, response = res.put [
  Riddl::Parameter::Simple.new("value","running")
]
