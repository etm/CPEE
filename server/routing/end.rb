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

Daemonite.new do |opts|
  redis = Redis.new(path: "/tmp/redis.sock", db: 3)
  pubsubredis = Redis.new(path: "/tmp/redis.sock", db: 3)

  run do
    pubsubredis.psubscribe('callback-end:*') do |on|
      on.pmessage do |pat, what, message|
        _, key = what.split(':')
        index = message.index(' ')
        instance = message[0...index]
        redis.multi do |multi|
          multi.srem("instance:#{instance}/callbacks",key)
          multi.del("instance:#{instance}/callback/#{key}/uuid")
          multi.del("instance:#{instance}/callback/#{key}/label")
          multi.del("instance:#{instance}/callback/#{key}/position")
          multi.del("instance:#{instance}/callback/#{key}/type")
        end
      rescue => e
        puts e.message
        puts e.backtrace
      end
    end
  end
end.go!
