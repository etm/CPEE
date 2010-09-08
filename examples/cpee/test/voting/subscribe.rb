#!/usr/bin/ruby
require 'rubygems'
require '../../../../../riddl/lib/ruby/client'
require 'digest/md5'
require 'yaml'

srv = Riddl::Client.new("http://localhost:9298/")

res = srv.resource("/")
status, response = res.post [
  Riddl::Parameter::Simple.new("name","Subscription Test")
]

instance = response[0].value
puts "Instance: #{instance}"
 
['endpoints','data-elements','description'].each do |e|
  res = srv.resource("/#{instance}/properties/values/#{e}")
  status, response = res.put [
    Riddl::Parameter::Simple.new("content",File::read("testset/#{e}"))
  ]
end

key = nil
ps = nil
1.upto 4 do |i|
  res = srv.resource("/#{instance}/notifications/subscriptions/")
  status, response = res.post [ 
    Riddl::Parameter::Simple.new("url","http://www.pri.univie.ac.at/~mangler/services/voter.php"),
    Riddl::Parameter::Simple.new("topic","running"),
    Riddl::Parameter::Simple.new("votes","syncing_after"),
  ]
  key = response.value('key')
  ps = response.value('producer-secret')
  puts "Subscription #{i}: #{key}"
end

muid = Digest::MD5.hexdigest(Kernel::rand().to_s)

res = srv.resource("/#{instance}/notifications/subscriptions/#{key}")
status, response = res.delete [
    Riddl::Parameter::Simple.new("message-uid",muid),
    Riddl::Parameter::Simple.new("fingerprint-with-producer-secret",Digest::MD5.hexdigest("#{muid}#{ps}"))
]    
p status

res = srv.resource("/#{instance}/properties/values/state")
status, response = res.put [
  Riddl::Parameter::Simple.new("value","running")
]
