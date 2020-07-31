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
require 'securerandom'
require 'riddl/client'
require_relative 'callback'
require_relative 'value_helper'
require_relative 'attributes_helper'

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
      @id = id

      @redis = Redis.new(path: opts[:redis_path], db: opts[:redis_db])

      @events = {}
      @votes = {}
      @votes_results = {}
      @callbacks = {}

      @attributes = {}
      @redis.keys('instance:0/attributes/*').each do |key|
        @attributes[File.basename(key)] = @redis.get(key)
      end

      @attributes_helper = AttributesHelper.new
      @mutex = Mutex.new
      @opts = opts
      @instance = nil
    end

    attr_reader :id
    attr_reader :callbacks
    attr_reader :mutex
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
    def base
      base_url
    end
    def instance
      instance_url
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
      execution = @instance.start
      execution.join
    end

    def info
      @attributes['info']
    end

    def notify(what,content={})
      CPEE::Message::send(redis,what,@id,content)
    end

    def call_vote(what,content={})
      # voteid = Digest::MD5.hexdigest(Kernel::rand().to_s)
      # content[:voteid] = voteid
      # @redis.publish('vote:' + what, JSON::generate(content))

      # psredis = Redis.new(path: @opts[:redis_path], db: @opts[:redis_db])
      # continue = WEEL::Continue.new
      # psredis.subscribe("vote:" + voteid) do |on|
      #   on.message do |_, message|
      #     p message
      #     redis.quit
      #   end
      # end
      true
    end

  end

end
