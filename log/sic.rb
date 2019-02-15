#!/usr/bin/ruby
require 'yaml'
require 'typhoeus'
require 'xml/smart'

# concept:endpoint: https://centurio.work/flow/start/url/
# id:id: a17
# cpee:uuid: bf93adcd-9421-495b-bafa-d34de608fc6c
# lifecycle:transition: unknown
# cpee:lifecycle:transition: activity/receiving
# list:
#   data_receiver:
#   - name: dataelements
#     mimetype: application/json
#     data:
#       CPEE-INSTANCE: https://centurio.work/flow/engine/547
#       qr: "*269MFA466*TZHZE 000"
#       queue: ''
#       machine: MaxxTurn45
#       program: _N_LOWERHOUSING2_MPF
#       label: Lowerhousing Turn 2
#       finished: no good
# time:timestamp: '2019-01-16T11:24:41.162+01:00'

def follow(fname,deep=0)
  io = File.open(fname)
  YAML.load_stream(io) do |e|
    if name = e.dig('log','trace','cpee:name')
      FileUtils.cp(File.join(__dir__,'logs',File.basename(fname,'.xes.yaml') + '.xes.yaml'),'.') if ARGV[1] == 'copy'
      puts " " * deep + name + " (#{File.basename(fname,'.xes.yaml')})"
    end
    if e.dig('event','concept:endpoint') == 'https://centurio.work/flow/start/url/' && e.dig('event','cpee:lifecycle:transition') == 'activity/receiving'
      p e.class
      val = e.dig('event','list','data_receiver',0,'data')
      uuid = e.dig('event','list','data_receiver',0,'data','CPEE-UUID')
      p 'uuid'
      if !uuid
        res = Typhoeus.get(File.join(val,'/properties/values/attributes/uuid/'))
        if res.success?
          uuid = XML::Smart.string(res.body).find('string(/*)')
        end
      end
      follow File.dirname(fname) + "/#{uuid}.xes.yaml",deep + 2
    end
  end
end

fname =  File.join(__dir__,'logs',(ARGV[0].strip rescue '') + '.xes.yaml')
if File.exists? fname
  follow fname
else
  puts 'Copies log files tree to current directory.'
  puts
  puts '  Example: sic.rb UUID'
  puts '  Example: sic.rb UUID copy'
end
