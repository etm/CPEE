#!/usr/bin/ruby
#
# This file is part of CPEE.
#
# CPEE is free software: you can redistribute it and/or modify it under the terms
# of the GNU General Public License as published by the Free Software Foundation,
# either version 3 of the License, or (at your option) any later version.
#
# CPEE is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
# PARTICULAR PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along with
# CPEE (file COPYING in the main directory).  If not, see
# <http://www.gnu.org/licenses/>.

require 'json'
require 'redis'
require 'daemonite'
require_relative '../../lib/cpee/value_helper'
require_relative '../../lib/cpee/redis'

EVENTS =

Daemonite.new do |opts|
  opts[:runtime_opts] += [
    ["--url=URL", "-uURL", "Specify redis url", ->(p){ opts[:redis_url] = p }],
    ["--path=PATH", "-pPATH", "Specify redis path, e.g. /tmp/redis.sock", ->(p){ opts[:redis_path] = p }],
    ["--db=DB", "-dDB", "Specify redis db, e.g. 1", ->(p) { opts[:redis_db] = p.to_i }],
    ["--workers=NUM", "-wNUM", "Number of workers that are expected, e.g. 3", ->(p) { opts[:workers] = p.to_i }]
  ]

  on startup do
    opts[:redis_path] ||= '/tmp/redis.sock'.freeze
    opts[:redis_db] ||= 1
    opts[:events] = []
    0.upto(opts[:workers]-1) do |w|
      opts[:events] += [
        'event:' + ('%02i' % w) + ':state/change',
        'event:' + ('%02i' % w) + ':executionhandler/change',
        'event:' + ('%02i' % w) + ':description/change',
        'event:' + ('%02i' % w) + ':dataelements/change',
        'event:' + ('%02i' % w) + ':endpoints/change',
        'event:' + ('%02i' % w) + ':attributes/change',
        'event:' + ('%02i' % w) + ':transformation/change',
        'event:' + ('%02i' % w) + ':status/change',
        'event:' + ('%02i' % w) + ':position/change',
        'event:' + ('%02i' % w) + ':handler/change',
        'callback:' + ('%02i' % w) + ':activity/content'
      ]
    end
    opts[:events].freeze
    CPEE::redis_connect opts, 'Server Routing Persist'
    opts[:pubsubredis] = opts[:redis_dyn].call 'Server Routing Persist Sub'
  rescue => e
    puts e.message
    puts e.backtrace
  end

  run do
    opts[:pubsubredis].subscribe(opts[:events]) do |on|
      on.message do |what, message|
        mess = JSON.parse(message[message.index(' ')+1..-1])
        instance = mess.dig('instance')
        case what
          when /callback:\d+:activity\/content/
            key = mess.dig('content','key')
            opts[:redis].multi do |multi|
              multi.sadd("instance:#{instance}/callbacks",key)
              multi.set("instance:#{instance}/callback/#{key}/uuid",mess.dig('content','activity-uuid'))
              multi.set("instance:#{instance}/callback/#{key}/label",mess.dig('content','label'))
              multi.set("instance:#{instance}/callback/#{key}/position",mess.dig('content','activity'))
              multi.set("instance:#{instance}/callback/#{key}/type",'callback')
            end
          when /event:\d+:state\/change/
            opts[:redis].multi do |multi|
              unless mess.dig('content','state') == 'purged'
                multi.set("instance:#{instance}/state",mess.dig('content','state'))
                multi.set("instance:#{instance}/state/@changed",mess.dig('timestamp'))
              end
            end
          when /event:\d+:executionhandler\/change/
            opts[:redis].set("instance:#{instance}/executionhandler",mess.dig('content','executionhandler'))
          when /event:\d+:description\/change/
            opts[:redis].multi do |multi|
              multi.set("instance:#{instance}/description",mess.dig('content','description'))
              multi.set("instance:#{instance}/dslx",mess.dig('content','dslx'))
              multi.set("instance:#{instance}/dsl",mess.dig('content','dsl'))
            end
          when /event:\d+:dataelements\/change/, /event:\d+:endpoints\/change/, /event:\d+:attributes\/change/
            topic = mess.dig('topic')
            opts[:redis].multi do |multi|
              mess.dig('content','changed')&.each_with_index do |c,i|
                unless what =~ /event:\d+:attributes\/change/ && c == 'uuid'
                  multi.zadd("instance:#{instance}/#{topic}",i,c)
                  if what =~ /event:\d+:dataelements\/change/
                    multi.set("instance:#{instance}/#{topic}/#{c}",CPEE::ValueHelper::generate(mess.dig('content','values',c)))
                  else
                    multi.set("instance:#{instance}/#{topic}/#{c}",mess.dig('content','values',c))
                  end
                end
              end
              mess.dig('content','deleted')&.to_a&.each do |c|
                unless what =~ /event:\d+:attributes\/change/ && c == 'uuid'
                  multi.zrem("instance:#{instance}/#{topic}",c)
                  multi.del("instance:#{instance}/#{topic}/#{c}")
                end
              end
            end
          when /event:\d+:transformation\/change/
            opts[:redis].multi do |multi|
              multi.set("instance:#{instance}/transformation/description",mess.dig('content','description'))
              multi.set("instance:#{instance}/transformation/description/@type",mess.dig('content','description_type'))
              multi.set("instance:#{instance}/transformation/dataelements",mess.dig('content','dataelements'))
              multi.set("instance:#{instance}/transformation/dataelements/@type",mess.dig('content','dataelements_type'))
              multi.set("instance:#{instance}/transformation/endpoints",mess.dig('content','endpoints'))
              multi.set("instance:#{instance}/transformation/endpoints/@type",mess.dig('content','endpoints_type'))
            end
          when /event:\d+:status\/change/
            opts[:redis].multi do |multi|
              multi.set("instance:#{instance}/status/id",mess.dig('content','id'))
              multi.set("instance:#{instance}/status/message",mess.dig('content','message'))
            end
          when /event:\d+:position\/change/
            opts[:redis].multi do |multi|
              c = mess.dig('content')
              c.dig('unmark')&.each do |ele|
                multi.srem("instance:#{instance}/positions",ele['position'])
                multi.del("instance:#{instance}/positions/#{ele['position']}")
                multi.del("instance:#{instance}/positions/#{ele['position']}/@passthrough")
              end
              c.dig('before')&.each do |ele|
                multi.sadd("instance:#{instance}/positions",ele['position'])
                multi.set("instance:#{instance}/positions/#{ele['position']}",'before')
              end
              c.dig('at')&.each do |ele|
                multi.sadd("instance:#{instance}/positions",ele['position'])
                multi.set("instance:#{instance}/positions/#{ele['position']}",'at')
                multi.set("instance:#{instance}/positions/#{ele['position']}/@passthrough",ele['passthrough']) if ele['passthrough']
              end
              c.dig('wait')&.each do |ele|
                multi.sadd("instance:#{instance}/positions",ele['position'])
                multi.set("instance:#{instance}/positions/#{ele['position']}",'at')
                multi.set("instance:#{instance}/positions/#{ele['position']}/@passthrough",ele['passthrough']) if ele['passthrough']
              end
              c.dig('after')&.each do |ele|
                multi.sadd("instance:#{instance}/positions",ele['position'])
                multi.set("instance:#{instance}/positions/#{ele['position']}",'after')
              end
            end
          when /event:\d+:handler\/change/
            opts[:redis].multi do |multi|
              mess.dig('content','changed').each do |c|
                multi.sadd("instance:#{instance}/handlers",mess.dig('content','key'))
                multi.sadd("instance:#{instance}/handlers/#{mess.dig('content','key')}",c)
                multi.set("instance:#{instance}/handlers/#{mess.dig('content','key')}/url",mess.dig('content','url'))
                multi.sadd("instance:#{instance}/handlers/#{c}",mess.dig('content','key'))
              end
              mess.dig('content','deleted').to_a.each do |c|
                multi.srem("instance:#{instance}/handlers/#{mess.dig('content','key')}",c)
                multi.srem("instance:#{instance}/handlers/#{c}",mess.dig('content','key'))
              end
            end
            if opts[:redis].scard("instance:#{instance}/handlers/#{mess.dig('content','key')}") < 1
              opts[:redis].multi do |multi|
                multi.del("instance:#{instance}/handlers/#{mess.dig('content','key')}/url")
                multi.srem("instance:#{instance}/handlers",mess.dig('content','key'))
              end
            end
        end
      rescue => e
        puts e.message
        puts e.backtrace
      end
    end
  end
end.go!
