#!/usr/bin/ruby
require 'yaml'
require 'pp'

def pbuf(buf)
  unless buf.empty?
    x = YAML.load(buf)
  end
  buf.clear
  x
end

result = []
buf = ""
File.open('log.xes').each do |line|
  result << pbuf(buf) if line == "---\n"
  buf += line
end
result << pbuf(buf)
