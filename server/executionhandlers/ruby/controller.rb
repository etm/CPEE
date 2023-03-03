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
require 'cpee/value_helper'
require 'cpee/attributes_helper'
require 'cpee/message'
require 'cpee/redis'
require 'cpee/persistence'

require 'ostruct'
class ParaStruct < OpenStruct
  def to_json(*a)
    table.to_json
  end
end
def →(a); ParaStruct.new(a); end
def ⭐(a); ParaStruct.new(a); end

class Controller
  def initialize(id,dir,opts)
    CPEE::redis_connect(opts,"Instance #{id}")
    CPEE::Message::set_workers(opts[:workers])

    @redis = opts[:redis]
    @votes = []

    @id = id

    @attributes = {}
    CPEE::Persistence::extract_list(id,opts,'attributes').each do |de|
      @attributes[de[0]] = de[1]
    end

    @attributes_helper = AttributesHelper.new
    @thread = nil
    @opts = opts
    @instance = nil
    @loop_guard = {}

    @callback_keys = {}

    @subs = Thread.new do
      @psredis = @opts[:redis_dyn].call "Instance #{@id} Callback Response"
      @psredis.psubscribe('callback-response:*','callback-end:*') do |on|
        on.pmessage do |pat, what, message|
          if pat == 'callback-response:*'
            _, worker, identifier = what.split(':')
            if @callback_keys.has_key?(identifier)
              index = message.index(' ')
              mess = message[index+1..-1]
              instance = message[0...index]
              m = JSON.parse(mess)
              resp = []
              m['content']['values'].each do |e|
                if e[1][0] == 'simple'
                  resp << Riddl::Parameter::Simple.new(e[0],e[1][1])
                elsif e[1][0] == 'complex'
                  resp << Riddl::Parameter::Complex.new(e[0],e[1][1],File.open(e[1][2]))
                end
              end
              @callback_keys[identifier].send(:callback,resp,m['content']['headers'])
            end
          end
          if pat == 'callback-end:*'
            _, worker, identifier = what.split(':')
            @callback_keys.delete(identifier)
          end
        end
      end
      @psredis.close
    rescue =>  e
      sleep 1
      retry
    end
  end

  attr_reader :id
  attr_reader :attributes
  attr_reader :loop_guard

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
    File.join(@opts[:url],'/')
  end
  def instance_url
    File.join(@opts[:url].to_s,@id.to_s,'/')
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
    if vote("state/change", :state => 'running')
      @thread = @instance.start
      @thread.join
    else
      @thread = @instance.stop
      @thread.join
    end
  end

  def stop
    ### tell the instance to stop
    @instance.stop
    ### end all votes or it will not work
    Thread.new do # doing stuff in trap context is a nono. but in a thread its fine :-)
      @votes.each do |key|
        CPEE::Message::send(:'vote-response',key,base,@id,uuid,info,true,@redis)
      end
    end
  end

  def info
    @attributes['info']
  end

  def notify(what,content={})
    content[:attributes] = attributes_translated
    CPEE::Message::send(:event,what,base,@id,uuid,info,content,@redis)
  end

  def vote(what,content={})
    topic, name = what.split('/')
    handler = File.join(topic,'vote',name)
    votes = []

    CPEE::Persistence::extract_handler(id,@opts,handler).each do |client|
      voteid = Digest::MD5.hexdigest(Kernel::rand().to_s)
      content[:key] = voteid
      content[:attributes] = attributes_translated
      content[:subscription] = client
      votes << voteid
      CPEE::Message::send(:vote,what,base,@id,uuid,info,content,@redis)
    end

    if votes.length > 0
      @votes += votes
      psredis = @opts[:redis_dyn].call "Instance #{@id} Vote"
      collect = []
      psredis.subscribe(votes.map{|e| ['vote-response:' + e.to_s] }.flatten) do |on|
        on.message do |what, message|
          index = message.index(' ')
          mess = message[index+1..-1]
          m = JSON.parse(mess)
          collect << ((m['content'] == true || m['content'] == 'true') || false)
          @votes.delete m['name']
          cancel_callback m['name']
          if collect.length >= votes.length
            psredis.unsubscribe
          end
        end
      end
      !collect.include?(false)
    else
      true
    end
  end

  def callback(hw,key,content)
    CPEE::Message::send(:callback,'activity/content',base,@id,uuid,info,content.merge(:key => key),@redis)
    @callback_keys[key] = hw
  end

  def cancel_callback(key)
    CPEE::Message::send(:'callback-end',key,base,@id,uuid,info,{},@redis)
  end
end
