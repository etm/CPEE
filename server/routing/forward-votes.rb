#!/usr/bin/ruby
#
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

require 'redis'
require 'daemonite'
require 'riddl/client'
require 'json'
require 'digest/sha1'
require_relative '../../lib/cpee/message'
require_relative '../../lib/cpee/redis'

# one round trip per vote: the controller sends one vote message per subscriber
# (content.subscription), so only check if that subscriber is still subscribed to
# exactly this topic/type/name (KEYS[1] is the reverse index). Returns url, sseq
# or {} if gone. GET needs the or '', a nil (false) would truncate the array.
MATCH = <<~LUA.freeze
  if redis.call('SISMEMBER', KEYS[1], ARGV[2]) == 0 then return {} end
  local b = ARGV[1] .. '/handlers/' .. ARGV[2]
  return { redis.call('GET', b .. '/url') or '', redis.call('INCR', b .. '/seq') }
LUA
MATCH_SHA = Digest::SHA1.hexdigest(MATCH).freeze

def persist_handler(instance,key,mess,redis) #{{{
  redis.multi do |multi|
    multi.sadd("instance:#{instance}/callbacks",key)
    multi.set("instance:#{instance}/callbacks/#{key}/subscription",mess.dig('content','subscription'),keepttl: true)
    multi.set("instance:#{instance}/callbacks/#{key}/uuid",mess.dig('content','activity-uuid'),keepttl: true)
    multi.set("instance:#{instance}/callbacks/#{key}/label",mess.dig('content','label'),keepttl: true)
    multi.set("instance:#{instance}/callbacks/#{key}/position",mess.dig('content','activity'),keepttl: true)
    multi.set("instance:#{instance}/callbacks/#{key}/type",'vote',keepttl: true)
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
    redis,
    0
  )
end #}}}

Daemonite.new do |opts|
  opts[:runtime_opts] += [
    ["--url=URL", "-uURL", "Specify redis url", ->(p){ opts[:redis_url] = p }],
    ["--db=DB", "-dDB", "Specify redis db, e.g. 1", ->(p) { opts[:redis_db] = p.to_i }],
    ["--workers=NUM", "-wNUM", "Number of workers that are expected, e.g. 3", ->(p) { opts[:workers] = p.to_i }]
  ]

  on startup do
    opts[:redis_db] ||= 1 if opts[:redis_db].nil?

    CPEE::redis_connect opts, 'Server Routing Forward Votes'
    opts[:pubsubredis] = opts[:redis_dyn].call 'Server Routing Forward Votes Sub'
  end

  run do
    opts[:pubsubredis].psubscribe('vote:*') do |on|
      on.pmessage do |pat, what, message|
        index = message.index(' ')
        instance, uuid, seq = message[0...index].split(',')
        mess = message[index+1..-1]

        type, worker, event = what.split(':',3)
        topic = ::File::dirname(event)
        name = ::File::basename(event)
        long = File.join(topic,type,name)

        m = JSON.parse(mess)
        callback_key = m.dig('content','key')
        subscription_key = m.dig('content','subscription')
        url, sseq = CPEE::redis_script(opts[:redis], MATCH_SHA, MATCH, ["instance:#{instance}/handlers/#{long}"], ["instance:#{instance}", subscription_key.to_s])

        if url.nil? # unsubscribed in the meantime, nobody would ever answer, so let the instance continue
          send_response instance, callback_key, m['cpee'], true, opts[:redis]
        elsif url == ""
          persist_handler instance, callback_key, m, opts[:redis]
          opts[:redis].publish("forward:#{instance}/#{subscription_key}","#{seq},#{sseq} #{mess}")
        else
          client = Riddl::Client.new(url)
          callback = File.join(m['instance-url'],'/callbacks/',callback_key,'/')
          status, result, headers = (client.post [
            Riddl::Header.new("CPEE-BASE",File.join(m['cpee'],'/')),
            Riddl::Header.new("CPEE-INSTANCE",m['instance']),
            Riddl::Header.new("CPEE-INSTANCE-URL",File.join(m['instance-url'],'/')),
            Riddl::Header.new("CPEE-INSTANCE-UUID",m['instance-uuid']),
            Riddl::Header.new("CPEE-CALLBACK",callback),
            Riddl::Header.new("CPEE-CALLBACK-ID",callback_key),
            Riddl::Header.new("CPEE-SEQ",seq),
            Riddl::Header.new("CPEE-SSEQ",sseq),
            Riddl::Parameter::Simple::new('type',type),
            Riddl::Parameter::Simple::new('topic',topic),
            Riddl::Parameter::Simple::new('vote',name),
            Riddl::Parameter::Simple::new('callback',callback),
            Riddl::Parameter::Complex::new('notification','application/json',mess)
          ] rescue [ 0, [], []])
          if status >= 200 && status < 300
            val = if result[0].class == Riddl::Parameter::Simple
              result[0].value
            else
              result[0].value.read
            end
            if (headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true') || val == 'callback'
              persist_handler instance, callback_key, m, opts[:redis]
            else # they may send true or false
              send_response instance, callback_key, m['cpee'], val, opts[:redis]
            end
          else
            send_response instance, callback_key, m['cpee'], true, opts[:redis]
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
