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
require 'uri'

module CPEE
  def self::redis_connect(opts,name=nil)
    if opts[:redis_cmd].nil?
      begin
        opts[:redis_dyn] = Proc.new { |name| Redis.new(url: opts[:redis_url], db: opts[:redis_db], id: name.gsub(/[^a-zA-Z0-9]/,'-') ) }
        opts[:redis] = opts[:redis_dyn].call name.gsub(/[^a-zA-Z0-9]/,'-')
        opts[:redis].dbsize
      rescue
        puts 'can not connect to redis. check if it is running and cpee is configured correctly ...'
        exit
      end
    else # we always assume file socket if redis is startet locally
      uri = URI::parse(opts[:redis_url])
      if uri.scheme == 'unix' || uri.scheme == 'redis-socket'
        opts[:redis_path] = File.join(uri.host,uri.path).sub(/\/$/,'')
        if !File.absolute_path? opts[:redis_path]
          opts[:redis_url] = 'unix://' + File.join(opts[:basepath],opts[:redis_path])
        end
        opts[:redis_port] = 0
        opts[:redis_unixsocket] = true
      else
        opts[:redis_port] = uri.port
        opts[:redis_path] = nil
        opts[:redis_unixsocket] = false
      end

      opts[:redis_dyn] = Proc.new { |name| Redis.new(url: opts[:redis_url], db: opts[:redis_db], id: name.gsub(/[^a-zA-Z0-9]/,'-') ) }

      tried = false
      begin
        opts[:redis] = opts[:redis_dyn].call name.gsub(/[^a-zA-Z0-9]/,'-')
        opts[:redis].dbsize
      rescue => e
        res = unless tried
          rcmd = opts[:redis_cmd]
          if opts[:redis_path]
            rcmd.gsub! /#redis_path#/, File.join(opts[:basepath],opts[:redis_path])
          else
            rcmd.gsub! /#redis_path#\s+/, ''
          end
          if File.absolute_path? opts[:redis_db_name]
            rcmd.gsub! /#redis_db_dir#/, File.dirname(opts[:redis_db_name])
          else
            rcmd.gsub! /#redis_db_dir#/, opts[:basepath]
          end
          rcmd.gsub! /#redis_db_name#/, opts[:redis_db_name]
          if File.absolute_path? opts[:redis_pid]
            rcmd.gsub! /#redis_pid#/, opts[:redis_pid]
          else
            rcmd.gsub! /#redis_pid#/, File.join(opts[:basepath],opts[:redis_pid])
          end
          rcmd.gsub! /#redis_port#/, opts[:redis_port].to_s
          if opts[:redis_unixsocket] == false
            rcmd.gsub! /--unixsocket\s+/, ''
            rcmd.gsub! /--unixsocketperm\s+\d+\s+/, ''
          end
          puts 'starting redis ... it will keep running, just to let you know ...'
          system rcmd
        else
          true
        end
        if res
          tried = true
          puts 'waiting for successful start ...'
          sleep 1
          retry
        else
          puts 'can not start redis. check if cpee is configured correctly ...'
          exit
        end
      end
    end
  end
end
