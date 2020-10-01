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
require 'riddl/client'
require 'json'
require_relative '../../lib/cpee/message'

def persist_handler(instance,key,mess,redis) #{{{
  redis.multi do |multi|
    multi.sadd("instance:#{instance}/callbacks",key)
    multi.set("instance:#{instance}/callback/#{key}/uuid",mess.dig('content','activity_uuid'))
    multi.set("instance:#{instance}/callback/#{key}/label",mess.dig('content','label'))
    multi.set("instance:#{instance}/callback/#{key}/position",mess.dig('content','activity'))
    multi.set("instance:#{instance}/callback/#{key}/type",'vote')
  end
end #}}}

def send_response(instance,key,url,value,redis) #{{{
  CPEE::Message::send(
    :'vote-response',
    key,
    url,
    instance,
    {},
    {},
    value,
    redis
  )
end #}}}

Daemonite.new do |opts|
  redis = Redis.new(path: "/tmp/redis.sock", db: 3)
  pubsubredis = Redis.new(path: "/tmp/redis.sock", db: 3)

  run do
    pubsubredis.psubscribe('vote:*') do |on|
      on.pmessage do |pat, what, message|
        index = message.index(' ')
        mess = message[index+1..-1]

        instance = message[0...index]
        type = pat[0..-3]
        event = what[(type.length+1)..-1]
        topic = ::File::dirname(event)
        name = ::File::basename(event)
        long = File.join(topic,type,name)

        redis.smembers("instance:#{instance}/handlers").each do |subscription_key|
          if redis.smembers("instance:#{instance}/handlers/#{subscription_key}").include? long
            m = JSON.parse(mess)
            callback_key = m.dig('content','key')
            url = redis.get("instance:#{instance}/handlers/#{subscription_key}/url")

            if url.nil? || url == ""
              persist_handler instance, callback_key, m, redis
              redis.publish("forward:#{instance}/#{subscription_key}",mess)
            else
              client = Riddl::Client.new(url,'http://riddl.org/ns/common-patterns/notifications-consumer/2.0/consumer.xml')
              callback = m['instance-url'] + '/callbacks/' + subscription_key
              status, result, headers = (client.post [
                Riddl::Header.new("CPEE-BASE",m['cpee']),
                Riddl::Header.new("CPEE-INSTANCE",m['instance']),
                Riddl::Header.new("CPEE-INSTANCE-URL",m['instance-url']),
                Riddl::Header.new("CPEE-INSTANCE-UUID",m['instance-uuid']),
                Riddl::Header.new("CPEE-CALLBACK",callback),
                Riddl::Header.new("CPEE-CALLBACK-ID",subscription_key),
                Riddl::Parameter::Simple::new('type',type),
                Riddl::Parameter::Simple::new('topic',topic),
                Riddl::Parameter::Simple::new('vote',name),
                Riddl::Parameter::Simple::new('callback',callback),
                Riddl::Parameter::Complex::new('notification','application/json',mess)
              ] rescue [ 0, [], []])
              if status >= 200 && status < 300
                val = result[0].value.read
                if (headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true') || val == 'callback'
                  persist_handler instance, callback_key, m, redis
                else # they may send true or false
                  send_response instance, callback_key, m['cpee'], val, redis
                end
              else
                p 'rrrr1'
                send_response instance, callback_key, m['cpee'], true, redis
              end
            end
          end
        end
      rescue => e
        puts e.message
        puts e.backtrace
        p '-----------------'
      end
    end
  end
end.go!
