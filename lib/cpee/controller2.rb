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

require 'yaml'
require 'ffi-rzmq'
require 'securerandom'
require 'riddl/client'
require_relative 'callback'
require_relative 'value_helper'

require 'ostruct'
class ParaStruct < OpenStruct
  def to_json(*a)
    table.to_json
  end
end
def →(a); ParaStruct.new(a); end
def ⭐(a); ParaStruct.new(a); end

module CPEE

  class AttributesHelper #{{{
    def translate(__attributes__,__dataelements__,__endpoints__)
      @data       = WEEL::ReadHash.new(__dataelements__)
      @endpoints  = WEEL::ReadHash.new(__endpoints__)
      @attributes = WEEL::ReadHash.new(__attributes__)
      __attributes__.transform_values do |v|
        v.gsub(/(!(attributes|data|endpoints)\.[\w_]+)/) do |m|
          eval(m[1..-1])
        end
      end
    end

    def data
      @data
    end

    def endpoints
      @endpoints
    end

    def attributes
      @attributes
    end
  end #}}}

  class Controller

    def initialize(id,dir,opts)
      @id = id

      @zmqc = ZMQ::Context.new
      @pub = @zmqc.socket(ZMQ::PUB)
      @pub.bind("ipc://" + File.join(dir,"pub"))

      @sub = @zmqc.socket(ZMQ::SUB)
      @sub.bind("ipc://" + File.join(dir,"sub"))

      @events = {}
      @votes = {}
      @votes_results = {}
      @callbacks = {}

      @attributes = YAML::load_file(File.join(dir,'attributes.yaml'))
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

    def notify(what,content={})# {{{
      p what
      @pub.send_strings [@id.to_s,what,content[:activity_uuid],content.to_s]
      p [@id.to_s,what,content[:activity_uuid],content.to_s]
      # item = @events[what]

      # if item
      #   item.each do |ke,ur|
      #     Thread.new(ke,ur) do |key,url|
      #       notf = build_notification(key,what,content,'event')
      #       if url.class == String
      #         client = Riddl::Client.new(url,'http://riddl.org/ns/common-patterns/notifications-consumer/1.0/consumer.xml')
      #         params = notf.map{|ke,va|Riddl::Parameter::Simple.new(ke,va)}
      #         params << Riddl::Header.new("CPEE-BASE",self.base)
      #         params << Riddl::Header.new("CPEE-INSTANCE",self.instance)
      #         params << Riddl::Header.new("CPEE-INSTANCE-URL",self.instance_url)
      #         params << Riddl::Header.new("CPEE-INSTANCE-UUID",self.uuid)
      #         client.post params
      #       elsif url.class == Riddl::Utils::Notifications::Producer::WS
      #         e = XML::Smart::string("<event/>")
      #         notf.each do |k,v|
      #           e.root.add(k,v)
      #         end
      #         url.send(e.to_s) rescue nil
      #       end
      #     end
      #   end
      # end
    end # }}}

    def call_vote(what,content={})# {{{
      voteid = Digest::MD5.hexdigest(Kernel::rand().to_s)
      # item = @votes[what]
      # if item && item.length > 0
      #   continue = WEEL::Continue.new
      #   @votes_results[voteid] = []
      #   inum = 0
      #   item.each do |key,url|
      #     if url.class == String
      #       inum += 1
      #     elsif url.class == Riddl::Utils::Notifications::Producer::WS
      #       inum += 1 unless url.closed?
      #     end
      #   end

      #   item.each do |key,url|

      #     Thread.new(key,url,content.dup) do |k,u,c|
      #       callback = Digest::MD5.hexdigest(Kernel::rand().to_s)
      #       c['callback'] = callback
      #       notf = build_notification(k,what,c,'vote',callback)
      #       if u.class == String
      #         client = Riddl::Client.new(u,'http://riddl.org/ns/common-patterns/notifications-consumer/1.0/consumer.xml')
      #         params = notf.map{|ke,va|Riddl::Parameter::Simple.new(ke,va)}
      #         params << Riddl::Header.new("CPEE-BASE",self.base_url)
      #         params << Riddl::Header.new("CPEE-INSTANCE",self.instance)
      #         params << Riddl::Header.new("CPEE-INSTANCE-URL",self.instance_url)
      #         params << Riddl::Header.new("CPEE-INSTANCE-UUID",self.uuid)
      #         params << Riddl::Header.new("CPEE-CALLBACK",self.instance_url + '/callbacks/' + callback)
      #         @mutex.synchronize do
      #           status, result, headers = client.post params
      #           if headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true'
      #             @callbacks[callback] = Callback.new("vote #{notf.find{|a,b| a == 'notification'}[1]}", self, :vote_callback, what, k, :http, continue, voteid, callback, inum)
      #           else
      #             vote_callback(result,nil,continue,voteid,callback,inum)
      #           end
      #         end
      #       elsif u.class == Riddl::Utils::Notifications::Producer::WS
      #         @callbacks[callback] = Callback.new("vote #{notf.find{|a,b| a == 'notification'}[1]}", self, :vote_callback, what, k, :ws, continue, voteid, callback, inum)
      #         e = XML::Smart::string("<vote/>")
      #         notf.each do |ke,va|
      #           e.root.add(ke,va)
      #         end
      #         u.send(e.to_s)
      #       end
      #     end

      #   end
      #   continue.wait

      #   !@votes_results.delete(voteid).include?(false)
      # else
      #   true
      # end
    end # }}}

  private

    def build_notification(key,what,content,type,callback=nil)# {{{
      res = []
      res << ['key'                             , key]
      res << ['topic'                           , ::File::dirname(what)]
      res << [type                              , ::File::basename(what)]
      res << ['notification'                    , ValueHelper::generate(content)]
      res << ['callback'                        , callback] unless callback.nil?
      res << ['fingerprint-with-consumer-secret', Digest::MD5.hexdigest(res.join(''))]
      # TODO add secret to fp
    end # }}}

  end

end
