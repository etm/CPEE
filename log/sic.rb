#!/usr/bin/ruby
require 'yaml'
require 'typhoeus'
require 'stringio'
require 'xml/smart'

def follow(fname,io,deep=0)
  if ARGV[1] == 'copy'
    File.write(File.basename(fname,'.xes.yaml') + '.xes.yaml',io.read)
    io.rewind
  end
  YAML.load_stream(io) do |e|
    if name = e.dig('log','trace','cpee:name')
      puts " " * deep + name + " (#{File.basename(fname,'.xes.yaml')}) - #{e.dig('log','trace','concept:name')}"
    end
    if e.dig('event','concept:endpoint') == 'https://centurio.work/flow/start/url/' && e.dig('event','cpee:lifecycle:transition') == 'task/instantiation'
      base = e.dig('event','data','data_receiver')
      val = base.dig('CPEE-INSTANCE') rescue nil
      if val.nil?
        val = File.basename(base)
      end
      uuid = base.dig('CPEE-INSTANCE-UUID') rescue nil
      unless uuid
        res = Typhoeus.get(File.join('https://centurio.work/flow/engine/',val,'/properties/values/attributes/uuid/'))
        if res.success?
          uuid = XML::Smart.string(res.body).find('string(/*)')
        end
      end
      react File.dirname(fname) + "/#{uuid}.xes.yaml",deep + 2
    end
  end
end

def react(name,deep=0)
  if name.nil?
    help
  elsif name =~ /^https?:\/\//
    res = Typhoeus.get(name)
    if res.success?
      file = Tempfile.new('sic')
      file.write(res.body)
      file.rewind
      follow name, file, deep
      file.close
      file.unlink
    end
  elsif File.exists? name
    follow name, File.open(name), deep
  else
    help
  end
end

def help
  puts 'Views or copies log file trees to current directory.'
  puts
  puts '  View: sic.rb https://centurio.work/log/865916c6-2b18-4e9d-81d4-0fab0df248f4.xes.yaml'
  puts '  Copy: sic.rb https://centurio.work/log/865916c6-2b18-4e9d-81d4-0fab0df248f4.xes.yaml copy'
  puts '  Copy: sic.rb ~/Projects/cpee/log/logs/865916c6-2b18-4e9d-81d4-0fab0df248f4.xes.yaml copy'
  puts '  View: sic.rb 865916c6-2b18-4e9d-81d4-0fab0df248f4.xes.yaml'
end

react(ARGV[0]) || help
