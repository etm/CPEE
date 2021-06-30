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

module CPEE
  def self::redis_connect(opts,name=nil)
    if opts[:redis_cmd].nil?
      begin
        if opts[:redis_path]
          opts[:redis_dyn] = Proc.new { |name| Redis.new(path: opts[:redis_path], db: opts[:redis_db], id: name.gsub(/[^a-zA-Z0-9]/,'-') ) }
        elsif opts[:redis_url]
          opts[:redis_dyn] = Proc.new { |name| Redis.new(url: opts[:redis_url], db: opts[:redis_db], id: name.gsub(/[^a-zA-Z0-9]/,'-') ) }
        else
          raise
        end
        opts[:redis] = opts[:redis_dyn].call name.gsub(/[^a-zA-Z0-9]/,'-')
        opts[:redis].dbsize
      rescue
        puts 'can not connect to redis. check if it is running and cpee is configured correctly ...'
        exit
      end
    else # we always assume file socket if redis is startet locally
      opts[:redis_dyn] = Proc.new { |name| Redis.new(path: File.join(opts[:basepath],opts[:redis_path]), db: opts[:redis_db].to_i, id: name.gsub(/[^a-zA-Z0-9]/,'-') ) }
      tried = false
      begin
        opts[:redis] = opts[:redis_dyn].call name.gsub(/[^a-zA-Z0-9]/,'-')
        opts[:redis].dbsize
      rescue => e
        puts e
        res = unless tried
          rcmd = opts[:redis_cmd]
          rcmd.gsub! /#redis_path#/, File.join(opts[:basepath],opts[:redis_path])
          rcmd.gsub! /#redis_db_dir#/, opts[:basepath]
          rcmd.gsub! /#redis_db_name#/, opts[:redis_db_name]
          rcmd.gsub! /#redis_pid#/, File.join(opts[:basepath],opts[:redis_pid])
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
