#!/usr/bin/ruby
require 'rubygems'
gem 'riddl', '>=0.99.30'
require 'riddl/client'

srv = Riddl::Client.new("https://centurio.work:9298/")

# new instance
# status, response = srv.resource("/").post [
#   Riddl::Parameter::Simple.new("info","Monitor Test")
# ]
# ins = response.first.value

ins = "371"

# if instance not empty monitor it
unless ins.empty?
  puts "Monitoring Instance #{ins}"
  status, response = srv.resource("/#{ins}/notifications/subscriptions/").post [
    Riddl::Parameter::Simple.new("topic","description"),
    Riddl::Parameter::Simple.new("events","change"),
    Riddl::Parameter::Simple.new("topic","state"),
    Riddl::Parameter::Simple.new("events","change"),
  ]
  key = response.first.value

  res = srv.resource("/#{ins}/notifications/subscriptions/#{key}/ws/").ws do |conn|
    conn.on :close do
      EM::stop_event_loop
    end

    conn.on :message do |msg|
      p msg.data
      conn.close
      puts '--------------'
    end
  end
end
