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

require 'weel'
require 'json'
require 'redis'
require 'securerandom'
require 'riddl/client'
require_relative 'callback'
require_relative 'value_helper'
require_relative 'attributes_helper'
require_relative 'message'

require 'ostruct'
class ParaStruct < OpenStruct
  def to_json(*a)
    table.to_json
  end
end
def →(a); ParaStruct.new(a); end
def ⭐(a); ParaStruct.new(a); end

module CPEE

  class Controller
    def initialize(id,dir,opts)
      @redis = Redis.new(path: opts[:redis_path], db: opts[:redis_db])

      @id = id

      @attributes = {}
      @redis.keys("instance:#{id}/attributes/*").each do |key|
        @attributes[File.basename(key)] = @redis.get(key)
      end

      @attributes_helper = AttributesHelper.new
      @thread = nil
      @opts = opts
      @instance = nil
    end

    attr_reader :id
    attr_reader :attributes

    def uuid
      @attributes['uuid']
    end

    def attributes_translated
      @attributes_helper.translate(attributes,dataelements,endpoints)
    end

    def host
      @opts[:host]
    end
    def base_url
      @opts[:url]
    end
    def instance_url
      File.join(@opts[:url].to_s,@id.to_s)
    end
    def instance_id
      @id
    end
    def base
      base_url
    end
    def instance=(inst)
      @instance = inst
    end
    def endpoints
      @instance.endpoints
    end
    def dataelements
      @instance.data
    end

    def start
      @thread = @instance.start
      @thread.join
    end

    def stop
      t = @instance.stop
      t.run
      @thread.join if !@thread.nil? && @thread.alive?
    end

    def info
      @attributes['info']
    end

    def notify(what,content={})
      content[:attributes] = attributes_translated
      CPEE::Message::send(:event,what,base,@id,uuid,info,content,@redis)
    end

    def vote(what,content={})
      voteid = Digest::MD5.hexdigest(Kernel::rand().to_s)
      content[:voteid] = voteid
      CPEE::Message::send(:vote,what,base,@id,uuid,info,content,@redis)

      psredis = Redis.new(path: @opts[:redis_path], db: @opts[:redis_db])
      collect = []
      psredis.subscribe('vote-response:' + voteid, 'vote-end:' + voteid) do |on|
        on.message do |what, message|
          case what
            when 'vote-response:' + voteid
              collect << (message == 'true' || false)
            when 'vote-end:' + voteid
              psredis.unsubscribe
          end
        end
      end
      !collect.include?(false)
    end

    def vote(what,content={})
      voteid = Digest::MD5.hexdigest(Kernel::rand().to_s)
      content[:voteid] = voteid
      CPEE::Message::send(:vote,what,base,@id,uuid,info,content,@redis)

      psredis = Redis.new(path: @opts[:redis_path], db: @opts[:redis_db])
      collect = []
      psredis.subscribe('vote-response:' + voteid, 'vote-end:' + voteid) do |on|
        on.message do |what, message|
          case what
            when 'vote-response:' + voteid
              collect << (message == 'true' || false)
            when 'vote-end:' + voteid
              psredis.unsubscribe
          end
        end
      end
      !collect.include?(false)
    end

    def callback(hw,key,content)
      CPEE::Message::send(:callback,key,base,@id,uuid,info,content,@redis)

      psredis = Redis.new(path: @opts[:redis_path], db: @opts[:redis_db])
      response = nil
      Thread.new do
        psredis.subscribe('callback-response:' + key, 'callback-end:' + key) do |on|
          on.message do |what, message|
            if what == 'callback-response:' + key
              mess = JSON.parse(message)
              hw.send(:callback,mess['response'],mess['options')
            end
            psredis.unsubscribe
          end
        end
      end
    end

    def cancel_callback(key)
      CPEE::Message::send(:callback-end,key,base,@id,uuid,info,{},@redis)
    end
  end

end
