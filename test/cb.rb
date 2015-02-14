#!/usr/bin/ruby
require 'riddl/client'

client = Riddl::Client.new("http://localhost:9298/37/callbacks/#{ARGV[1]}")
status, response, headers = client.put [
  # Riddl::Header.new('CPEE_UPDATE','true'),
  Riddl::Header.new('CPEE_UPDATE_STATUS','taking'),
  Riddl::Parameter::Simple.new('x',ARGV[0])
]
