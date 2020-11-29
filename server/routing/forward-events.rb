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
require_relative '../../lib/cpee/redis'

OPTS = {
  :runtime_opts => [
    ["--url [REDIS]", "-u [REDIS]", "Specify redis url", ->(p){ @riddl_opts[:redis_url] = p }],
    ["--path [REDIS]", "-p [REDIS]", "Specify redis path, e.g. /tmp/redis.sock", ->(p){ @riddl_opts[:redis_path] = p }],
    ["--db [REDIS]", "-d [REDIS]", "Specify redis db, e.g. 1", -> { @riddl_opts[:redis_db] = p.to_i }]
  ]
}

Daemonite.new(OPTS) do |opts|
  opts[:redis_path] ||= '/tmp/redis.sock'
  opts[:redis_db] ||= 1

  CPEE::redis_connect opts
  redis = opts[:redis]
  pubsubredis = opts[:redis_dyn].call

  run do
    pubsubredis.psubscribe('event:*') do |on|
      on.pmessage do |pat, what, message|
        index = message.index(' ')
        mess = message[index+1..-1]
        instance = message[0...index]
        type = pat[0..-3]
        event = what[(type.length+1)..-1]
        topic = ::File::dirname(event)
        name = ::File::basename(event)
        long = File.join(topic,type,name)
        redis.smembers("instance:#{instance}/handlers").each do |key|
          if redis.smembers("instance:#{instance}/handlers/#{key}").include? long
            url = redis.get("instance:#{instance}/handlers/#{key}/url")
            if url.nil? || url == ""
              redis.publish("forward:#{instance}/#{key}",mess)
            else
              p "#{type}/#{topic}/#{event}-#{url}"
              client = Riddl::Client.new(url)
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
        p '-----------------'
      end
    end
  end
end.go!
