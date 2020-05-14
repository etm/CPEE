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

Daemonite.new do |opts|
  redis = Redis.new(path: "/tmp/redis.sock", db: 3)
  pubsubredis = Redis.new(path: "/tmp/redis.sock", db: 3)

  run do
    pubsubredis.psubscribe('event:*') do |on|
      on.pmessage do |pat, what, message|
        mess = JSON.parse(message)
        case what
          when  'event:state/change'
            redis.multi do |multi|
              multi.set("instance:#{mess.dig('instance')}/state",mess.dig('content','state'))
              multi.set("instance:#{mess.dig('instance')}/state_changed",mess.dig('content','timestamp'))
            end
          when 'event:dataelements/change', 'event:endpoints/change'
            redis.multi do |multi|
              mess.dig('content','changed').each do |c|
                multi.hset("instance:#{mess.dig('instance')}/#{mess.dig('topic')}",c,mess.dig('content','values',c))
              end
            end
          when 'event:status/change'
            redis.multi do |multi|
              multi.set("instance:#{mess.dig('instance')}/status_id",mess.dig('content','id'))
              multi.set("instance:#{mess.dig('instance')}/status_message",mess.dig('content','message'))
            end
          when 'event:position/change'
            redis.multi do |multi|
              c = mess.dig('content')
              c.dig('at')&.each do |ele|
                p ele
                multi.hset("instance:#{mess.dig('instance')}/positions",ele['position'],'at')
              end
              c.dig('after')&.each do |ele|
                multi.hset("instance:#{mess.dig('instance')}/positions",ele['position'],'after')
              end
              c.dig('unmark')&.each do |ele|
                multi.hdel("instance:#{mess.dig('instance')}/positions",ele['position'])
              end
            end
        end
      end
    end
  end
end.go!
