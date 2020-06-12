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
require 'riddl/client'
require 'daemonite'
require 'pp'
require_relative 'transform'

Daemonite.new do |opts|
  redis = Redis.new(path: "/tmp/redis.sock", db: 3)
  pubsubredis = Redis.new(path: "/tmp/redis.sock", db: 3)

  run do
    pubsubredis.psubscribe('event:*') do |on|
      on.pmessage do |pat, what, message|
        mess = JSON.parse(message)
        case what
          when 'event:state/change'
            redis.multi do |multi|
              multi.set("instance:#{mess.dig('instance')}/state",mess.dig('content','state'))
              multi.set("instance:#{mess.dig('instance')}/state/@changed",mess.dig('content','timestamp'))
            end
          when 'event:handlerwrapper/change'
            redis.set("instance:#{mess.dig('instance')}/handlerwrapper",mess.dig('content','handlerwrapper'))
          when 'event:description/change'
            redis.set("instance:#{mess.dig('instance')}/description",mess.dig('content','description'))
            # TODO transformation
          when 'event:handler/add'
            redis.multi do |multi|
              multi.set("instance:#{mess.dig('instance')}/handlers/#{mess.dig('content','id')}/@url",mess.dig('content','url'))
              multi.set("instance:#{mess.dig('instance')}/handlers/#{mess.dig('content','id')}",mess.dig('topics','topics'))
            end
          when 'event:handler/delete'
            redis.del("instance:#{mess.dig('instance')}/handlers/#{mess.dig('content','id')}")
          when 'event:dataelements/change', 'event:endpoints/change', 'event:attributes/change'
            redis.multi do |multi|
              mess.dig('content','changed').each do |c|
                multi.sadd("instance:#{mess.dig('instance')}/#{mess.dig('topic')}",c)
                unless what == 'event:attributes/change' && c == 'uuid'
                  multi.set("instance:#{mess.dig('instance')}/#{mess.dig('topic')}/#{c}",mess.dig('content','values',c))
                end
              end
              mess.dig('content','deleted').to_a.each do |c|
                multi.srem("instance:#{mess.dig('instance')}/#{mess.dig('topic')}",c)
                unless what == 'event:attributes/change' && c == 'uuid'
                  multi.del("instance:#{mess.dig('instance')}/#{mess.dig('topic')}/#{c}")
                end
              end
            end
          when 'event:transformation/change'
            redis.multi do |multi|
              multi.set("instance:#{mess.dig('instance')}/transformation/description/",mess.dig('content','description'))
              multi.set("instance:#{mess.dig('instance')}/transformation/description/@type",mess.dig('content','description_type'))
              multi.set("instance:#{mess.dig('instance')}/transformation/dataelements/",mess.dig('content','dataelements'))
              multi.set("instance:#{mess.dig('instance')}/transformation/dataelements/@type",mess.dig('content','dataelements_type'))
              multi.set("instance:#{mess.dig('instance')}/transformation/endpoints/",mess.dig('content','endpoints'))
              multi.set("instance:#{mess.dig('instance')}/transformation/endpoints/@type",mess.dig('content','endpoints_type'))
            end
          when 'event:status/change'
            redis.multi do |multi|
              multi.set("instance:#{mess.dig('instance')}/status/id",mess.dig('content','id'))
              multi.set("instance:#{mess.dig('instance')}/status/message",mess.dig('content','message'))
            end
          when 'event:position/change'
            redis.multi do |multi|
              c = mess.dig('content')
              c.dig('at')&.each do |ele|
                multi.sadd("instance:#{mess.dig('instance')}/positions",ele['position'])
                multi.set("instance:#{mess.dig('instance')}/positions/#{ele['position']}",'at')
              end
              c.dig('after')&.each do |ele|
                multi.sadd("instance:#{mess.dig('instance')}/positions",ele['position'])
                multi.set("instance:#{mess.dig('instance')}/positions/#{ele['position']}",'after')
              end
              c.dig('unmark')&.each do |ele|
                multi.srem("instance:#{mess.dig('instance')}/positions",ele['position'])
                multi.del("instance:#{mess.dig('instance')}/positions/#{ele['position']}")
              end
            end
        end
      rescue => e
        puts e.message
      end
    end
  end
end.go!
