#!/usr/bin/ruby
require 'riddl/client'

client = Riddl::Client.new("http://localhost:9298/39/callbacks/#{ARGV[1]}")
status, response, headers = client.put [
  Riddl::Header.new('CPEE-UPDATE','true'),
  Riddl::Header.new('CPEE-UPDATE-STATUS','georg'),
  Riddl::Parameter::Simple.new('x',ARGV[0])
]
