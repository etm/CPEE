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

require 'redis'
require 'daemonite'

Daemonite.new do |opts|
  redis = Redis.new(path: "/tmp/redis.sock", db: 3)
  pubsubredis = Redis.new(path: "/tmp/redis.sock", db: 3)

  run do
    pubsubredis.psubscribe('event:*','vote:*') do |on|
      on.pmessage do |pat, what, message|
        index = message.index(' ')
        mess = message[index+1..-1]
        instance = message[0...index]
        type = pat[0..-3]
        event = what[(type.length+1)..-1]
        topic = ::File::dirname(event)
        name = ::File::basename(event)
        long = File.join(topic,'event',name)
        redis.smembers("instance:#{instance}/handlers").each do |key|
          if redis.smembers("instance:#{instance}/handlers/#{key}").include? long
            url = redis.get("instance:#{instance}/handlers/#{key}/url")
            if url.nil? || url == ""
              redis.publish("forward:#{instance}/#{key}",mess)
            else
              client = Riddl::Client.new(url,'http://riddl.org/ns/common-patterns/notifications-consumer/2.0/consumer.xml')
              client.post [
                Riddl::Parameter::Simple::new('type',type),
                Riddl::Parameter::Simple::new('topic',topic),
                Riddl::Parameter::Simple::new('event',name),
                Riddl::Parameter::Complex::new('notification','application/json',mess)
              ]
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
