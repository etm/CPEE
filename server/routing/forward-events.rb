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
require 'concurrent-ruby'
require 'riddl/client'
require 'digest/sha1'
require_relative '../../lib/cpee/redis'

HTTP_POOL = Concurrent::FixedThreadPool.new(32)

# one round trip per event: KEYS[1] is the reverse index (subscription keys for exactly
# this topic/type/name), ARGV[1] the instance prefix. Returns key, url, sseq per match.
# GET needs the or '', a nil (false) would truncate the returned array.
MATCH = <<~LUA.freeze
  local res = {}
  for _, k in ipairs(redis.call('SMEMBERS', KEYS[1])) do
    local b = ARGV[1] .. '/handlers/' .. k
    res[#res+1] = k
    res[#res+1] = redis.call('GET', b .. '/url') or ''
    res[#res+1] = redis.call('INCR', b .. '/seq')
  end
  return res
LUA
MATCH_SHA = Digest::SHA1.hexdigest(MATCH).freeze

Daemonite.new do |opts|
  opts[:runtime_opts] += [
    ["--url=URL", "-uURL", "Specify redis url", ->(p){ opts[:redis_url] = p }],
    ["--db=DB", "-dDB", "Specify redis db, e.g. 1", ->(p) { opts[:redis_db] = p.to_i }],
    ["--worker=NUM", "-wNUM", "Specify the worker id, e.g. 0", ->(p) { opts[:worker] = p.to_i }]
  ]

  on setup do
    opts[:worker] ||= 0
    opts[:worker] = ('%02i' % opts[:worker]).freeze
    opts[:pidfile] = File.basename(opts[:pidfile],'.pid') + '-' + opts[:worker].to_s + '.pid'
  end

  on startup do
    opts[:redis_db] ||= 1 if opts[:redis_db].nil?
    CPEE::redis_connect opts, 'Server Routing Forward Events'
    opts[:pubsubredis] = opts[:redis_dyn].call 'Server Routing Forward Events Sub'
  end

  run do
    opts[:pubsubredis].psubscribe("event:#{opts[:worker]}:*") do |on|
      on.pmessage do |pat, what, message|
        index = message.index(' ')
        mess = message[index+1..-1]
        instance, uuid, seq = message[0...index].split(',')
        type, worker, event = what.split(':',3)
        topic = ::File::dirname(event)
        name = ::File::basename(event)
        long = File.join(topic,type,name)

        # per subscription sequence (sseq): gapless per subscription, so subscribers can detect missing messages; seq gives the order
        res = CPEE::redis_script(opts[:redis], MATCH_SHA, MATCH, ["instance:#{instance}/handlers/#{long}"], ["instance:#{instance}"])
        forwards = []
        res.each_slice(3) do |key, url, sseq|
          if url.nil? || url == ""
            forwards << ["forward:#{instance}/#{key}","#{seq},#{sseq} #{mess}"]
          else
            # Ractor.new(url,type,topic,name,mess) do |url,type,topic,name,mess|
            # sadly typhoes does not support ractors
            HTTP_POOL.post do
              Riddl::Client.new(url, nil, ignore_response: true).post [
                Riddl::Header.new("CPEE-INSTANCE",instance),
                Riddl::Header.new("CPEE-INSTANCE-UUID",uuid),
                Riddl::Header.new("CPEE-SEQ",seq),
                Riddl::Header.new("CPEE-SSEQ",sseq),
                Riddl::Parameter::Simple::new('type',type),
                Riddl::Parameter::Simple::new('topic',topic),
                Riddl::Parameter::Simple::new('event',name),
                Riddl::Parameter::Complex::new('notification','application/json',mess)
              ]
            end
          end
        end
        # all sse subscribers in one round trip
        opts[:redis].pipelined { |p| forwards.each { |c,m| p.publish(c,m) } } unless forwards.empty?
      rescue
        # deliberately silent: an exception must not end the psubscribe loop (and the
        # worker), and subscribers detect missing messages through gaps in sseq
      end
    end
  end
end.go!
