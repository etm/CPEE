#!/usr/bin/ruby
require 'rubygems'
require '../../../../riddl/lib/ruby/client'
require 'digest/md5'
require 'yaml'

if ARGV.length != 3
  puts "Usage:   vote.rb [base] [instance] [key]"
  puts "Example: vote.rb http://localhost:9298/1/ 70e964f5ddbc2d7a54b783240f57fe50"
end

srv = Riddl::Client.new(ARGV[0])
instance = ARGV[1]
key = ARGV[2]

res = srv.resource("/#{instance}/callbacks/#{key}")
status, response = res.put [
  Riddl::Parameter::Simple.new("continue","false")
]
