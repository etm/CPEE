# This file is part of CPEE.
#
# CPEE is free software: you can redistribute it and/or modify it under the terms
# of the GNU Lesser General Public License as published by the Free Software Foundation,
# either version 3 of the License, or (at your option) any later version.
#
# CPEE is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
# PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public License along with
# CPEE (file LICENSE in the main directory).  If not, see
# <http://www.gnu.org/licenses/>.

require 'digest/sha1'
require_relative 'redis'

module CPEE

  module Message
    # INCR the per-instance sequence and PUBLISH in one round trip. The seq is
    # appended to the prefix ("instance,uuid,seq {json}") so that routing
    # workers can read it without parsing the JSON, and added to the JSON for
    # consumers that only see the body. The payload is always a JSON object.
    # Only count while the instance exists (KEYS[2] is its state), so late
    # messages for a deleted instance do not recreate the counter (seq 0).
    # INCR keeps the TTL that DeleteInstance set while the key expires.
    SEQ_PUBLISH = <<~LUA.freeze
      local s = 0
      if redis.call('EXISTS', KEYS[2]) == 1 then s = redis.call('INCR', KEYS[1]) end
      redis.call('PUBLISH', ARGV[1], ARGV[2] .. ',' .. s .. ' ' .. string.sub(ARGV[3], 1, -2) .. ',"seq":' .. s .. '}')
      return s
    LUA
    SEQ_PUBLISH_SHA = Digest::SHA1.hexdigest(SEQ_PUBLISH).freeze

    @@mutex = Mutex.new
    @@who = 'cpee'
    @@type = 'instance'
    @@tworkers = 1
    @@last = -1

    def self::who #{{{
      @@who
    end #}}}
    def self::who=(it) #{{{
      @@who = it
    end #}}}
    def self::type #{{{
      @@type
    end #}}}
    def self::type=(it) #{{{
      @@type = it
    end #}}}

    def self::set_workers(workers)
      @@tworkers = (workers < 1 || workers > 99 ? 1 : workers).freeze
      @@last = -1
    end

    def self::target
      @@mutex.synchronize { @@last < @@tworkers-1 ? @@last += 1 : @@last = 0 }
    end

    def self::wait(backend,sub,tt=nil)
      target = '%02i' % (tt || CPEE::Message::target)
      wid = SecureRandom.hex(16)
      begin
        sub.subscribe_with_timeout(2,"event:#{target}:transaction/finished") do |on|
          on.message do |what,message|
            mess = message[0...message.index(' ')]
            sub.unsubscribe("event:#{target}:transaction/finished") if mess == wid
          end
          backend.publish("event:#{target}:transaction/start","#{wid} {}")
        end
      rescue => e
        puts "timeout error"
      end
      sub.disconnect!
    end

    def self::send(type, event, cpee, instance, instance_uuid, instance_name, content={}, backend=nil, tt=nil)
      target = '%02i' % (tt || CPEE::Message::target)
      topic = ::File::dirname(event)
      name = ::File::basename(event)
      payload = {
        @@who => cpee,
        "#{@@type}-url" => File.join(cpee,instance.to_s),
        @@type => instance,
        'topic' => topic,
        'type' => type,
        'name' => name,
        'timestamp' =>  Time.now.xmlschema(6),
        'content' => content
      }
      payload["#{@@type}-uuid"] = instance_uuid if instance_uuid
      payload["#{@@type}-name"] = instance_name if instance_name

      keys = ["#{@@type}:#{instance}/seq", "#{@@type}:#{instance}/state"]
      argv = ["#{type}:#{target}:#{event}", "#{instance},#{instance_uuid}", JSON::generate(payload)]
      CPEE::redis_script(backend, SEQ_PUBLISH_SHA, SEQ_PUBLISH, keys, argv)
    end

    def self::send_url(type, event, cpee, content={}, backend)
      EM.defer do
        topic = ::File::dirname(event)
        name = ::File::basename(event)
        payload = {
          @@who => cpee,
          'topic' => topic,
          'type' => type,
          'name' => name,
          'timestamp' =>  Time.now.xmlschema(3),
          'content' => content
        }
        client = Riddl::Client.new(backend)
        client.post [
          Riddl::Parameter::Simple::new('type',type),
          Riddl::Parameter::Simple::new('topic',topic),
          Riddl::Parameter::Simple::new('event',name),
          Riddl::Parameter::Complex::new('notification','application/json',JSON::generate(payload))
        ]
      end
    end
  end

end
