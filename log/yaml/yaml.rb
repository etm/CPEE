#!/usr/bin/ruby
require 'yaml'
require 'pp'

def pbuf(buf)
  unless buf.empty?
    pp YAML.load(buf)
    pp '---'
  end
  buf.clear
end

buf = ""
File.open('log.xes').each do |line|
  pbuf(buf) if line == "---\n"
  buf += line
end

pbuf(buf)
