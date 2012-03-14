#!/usr/bin/ruby
require 'pp'
require 'fileutils'
require 'rubygems'
require 'riddl/client'
require 'eventmachine'
require 'em-websocket-client'

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
    Riddl::Parameter::Simple.new("topic","running"),
    Riddl::Parameter::Simple.new("events","after_push,call"),
  ]
  key = response.first.value

  EM.run do
    conn = EventMachine::WebSocketClient.connect("ws://localhost:9299/#{ins}/notifications/subscriptions/#{key}/ws/")

    conn.callback do
      conn.send_msg "Hello!"
      conn.send_msg "done"
    end

    conn.errback do |e|
      puts "Got error: #{e}"
    end

    conn.stream do |msg|
      puts "<#{msg}>"
      if msg == "done"
        conn.close_connection
      end
    end

    conn.disconnect do
      puts "gone"
      EM::stop_event_loop
    end
  end

end
