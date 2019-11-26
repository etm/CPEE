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

require 'riddl/server'
require 'securerandom'
require 'xml/smart'
require 'base64'
require 'uri'
require 'redis'
require 'json'
require ::File.dirname(__FILE__) + '/value_helper'

module CPEE
  module Instantiation

    SERVER = File.expand_path(__dir__ + '/../instantiation.xml')

    module Helpers #{{{
      def load_testset(tdoc,cpee,name=nil,stream=nil) #{{{
        ins = -1
        uuid = nil
        XML::Smart.string(tdoc) do |doc|
          doc.register_namespace 'desc', 'http://cpee.org/ns/description/1.0'
          doc.register_namespace 'prop', 'http://riddl.org/ns/common-patterns/properties/1.0'

          srv = Riddl::Client.new(cpee, cpee + "?riddl-description")
          res = srv.resource("/")
          if name
            doc.find("/testset/attributes/prop:info").each do |e|
              e.text = name
            end
          end
          if stream && !stream.empty?
            JSON.parse(stream).each do |e|
              begin
                stream = Typhoeus.get e['url']
                if stream.success?
                  XML::Smart::string(stream.response_body) do |str|
                    doc.find("//desc:call[@id=\"#{e['id']}\"]/desc:parameters/desc:stream").each do |ele|
                      ele.replace_by str.root
                    end
                  end
                end
              rescue => e
                puts e.message
                puts e.backtrace
              end
            end
          end

          status, response, headers = res.post Riddl::Parameter::Simple.new("info",doc.find("string(/testset/attributes/prop:info)"))

          if status == 200
            ins = response.first.value
            uuid = headers['CPEE_INSTANCE_UUID']
            params = []

            res = srv.resource("/#{ins}/properties/values")
            ["handlerwrapper","positions","dataelements","endpoints","attributes","transformation"].each do |item|
              if doc.find("/testset/#{item}").any?
                params << Riddl::Parameter::Simple.new("name",item)
                params << Riddl::Parameter::Simple.new("content",doc.find("/testset/#{item}").first.dump)
              end
            end
            ["description"].each do |item|
              if doc.find("/testset/#{item}").any?
                params << Riddl::Parameter::Simple.new("name",item)
                params << Riddl::Parameter::Simple.new("content","<content>" + doc.find("/testset/#{item}/desc:*").first.dump + "</content>")
              end
            end
            status, response = res.put params
            ["handlers"].each do |item|
              doc.find("/testset/#{item}/handler").each do |han|
                #pp han.children.first
                url =  han.attributes['url']
                inp = "url=" + URI.encode_www_form_component(url)
                inp = inp + "&topic=" + han.children.first.attributes['topic']
                inp = inp + "&" + han.children.first.qname.to_s + "=" + han.children.first.to_s
                status,body = Riddl::Client::new(cpee+ins+"/notifications/subscriptions/").post(
                  [
                    Riddl::Parameter::Simple.new("url",han.attributes['url']),
                    Riddl::Parameter::Simple.new("topic",han.children.first.attributes['topic']),
                    Riddl::Parameter::Simple.new(han.children.first.qname.to_s,han.children.first.to_s)
                  ]
                )
              end
            end
          end
        end
        [ins, uuid]
      end #}}}
      private :load_testset
      def handle_waiting(cpee,instance,uuid,behavior,selfurl,cblist) #{{{
        if behavior =~ /^wait/
          condition = behavior.match(/_([^_]+)_/)&.[](1) || 'finished'
          @headers << Riddl::Header.new('CPEE-CALLBACK','true')
          cb = @h['CPEE_CALLBACK']

          if cb
            cbk = SecureRandom.uuid
            srv = Riddl::Client.new(cpee, cpee + "?riddl-description")
            status, response = srv.resource("/#{instance}/notifications/subscriptions/").post [
              Riddl::Parameter::Simple.new("url",File.join(selfurl,'callback',cbk)),
              Riddl::Parameter::Simple.new("topic","state"),
              Riddl::Parameter::Simple.new("events","change")
            ]
            cblist.rpush(cbk, cb)
            cblist.rpush(cbk, condition)
            cblist.rpush(cbk, instance)
            cblist.rpush(cbk, uuid)
            cblist.rpush(cbk, File.join(cpee,instance))
          end
        end
      end #}}}
      private :handle_waiting
      def handle_starting(cpee,instance,behavior) #{{{
        if behavior =~ /_running$/
          srv = Riddl::Client.new(cpee, cpee + "?riddl-description")
          res = srv.resource("/#{instance}/properties/values")
          status, response = res.put [
            Riddl::Parameter::Simple.new('name', 'state'),
            Riddl::Parameter::Simple.new('value','running')
          ]
        end
      end #}}}
      private :handle_starting
      def handle_data(cpee,instance,data) #{{{
        if data && !data.empty?
          content = XML::Smart.string('<content/>')
          JSON::parse(data).each do |k,v|
            content.root.add(k,v)
          end
          srv = Riddl::Client.new(cpee, cpee + "?riddl-description")
          res = srv.resource("/#{instance}/properties/values/dataelements/")
          status, response = res.patch [
            Riddl::Parameter::Complex.new('content','text/xml',content.to_s)
          ]
        end rescue nil
      end #}}}
      def handle_endpoints(cpee,instance,data) #{{{
        if data && !data.empty?
          content = XML::Smart.string('<content/>')
          JSON::parse(data).each do |k,v|
            content.root.add(k,v)
          end
          srv = Riddl::Client.new(cpee, cpee + "?riddl-description")
          res = srv.resource("/#{instance}/properties/values/endpoints/")
          status, response = res.patch [
            Riddl::Parameter::Complex.new('content','text/xml',content.to_s)
          ]
        end rescue nil
      end #}}}
    end #}}}

    class InstantiateGit < Riddl::Implementation #{{{
      include Helpers

      def response
        cpee = @h['X_CPEE'] || @a[0]
        selfurl = @a[1]
        cblist = @a[2]

        status, res = Riddl::Client.new(File.join(@p[1].value,'raw',@p[2].value,@p[3].value).gsub(/ /,'%20')).get
        tdoc = if status >= 200 && status < 300
          res[0].value.read
        else
          (@status = 500) && return
        end
        stream = @p.find{ |e| e.name == 'stream' }&.value
        if (instance, uuid = load_testset(tdoc,cpee,nil,stream)).first == -1
          @status = 500
        else
          handle_data cpee, instance, @p[4]&.value if @p[4]&.name == 'init'
          handle_endpoints cpee, instance, @p[4]&.value if @p[4]&.name == 'endpoints'
          handle_endpoints cpee, instance, @p[5]&.value if @p[5]&.name == 'endpoints'

          handle_waiting cpee, instance, uuid, @p[0].value, selfurl, cblist
          handle_starting cpee, instance, @p[0].value

          send = {
            'CPEE-INSTANCE' => instance,
            'CPEE-INSTANCE-URL' => File.join(cpee,instance),
            'CPEE-INSTANCE-UUID' => uuid,
            'CPEE-BEHAVIOR' => @p[0].value
          }
          @headers << Riddl::Header.new('CPEE-INSTANTIATION',JSON::generate(send))
          Riddl::Parameter::Complex.new('instance','application/json',JSON::generate(send))
        end
      end
    end  #}}}

    class InstantiateUrl < Riddl::Implementation #{{{
      include Helpers

      def response
        cpee    = @h['X_CPEE'] || @a[0]
        selfurl = @a[1]
        cblist  = @a[2]
        name    = @a[3] ? @p.shift.value : nil

        status, res = Riddl::Client.new(@p[1].value.gsub(/ /,'%20')).get
        tdoc = if status >= 200 && status < 300
          res[0].value.read
        else
          (@status = 500) && return
        end
        stream = @p.find{ |e| e.name == 'stream' }&.value
        if (instance, uuid = load_testset(tdoc,cpee,name,stream)).first == -1
          @status = 500
        else
          handle_data cpee, instance, @p[2]&.value if @p[2]&.name == 'init'
          handle_endpoints cpee, instance, @p[2]&.value if @p[2]&.name == 'endpoints'
          handle_endpoints cpee, instance, @p[3]&.value if @p[3]&.name == 'endpoints'

          handle_waiting cpee, instance, uuid, @p[0].value, selfurl, cblist
          handle_starting cpee, instance, @p[0].value

          send = {
            'CPEE-INSTANCE' => instance,
            'CPEE-INSTANCE-URL' => File.join(cpee,instance),
            'CPEE-INSTANCE-UUID' => uuid,
            'CPEE-BEHAVIOR' => @p[0].value
          }
          @headers << Riddl::Header.new('CPEE-INSTANTIATION',JSON::generate(send))
          Riddl::Parameter::Complex.new('instance','application/json',JSON::generate(send))
        end
      end
    end  #}}}

    class InstantiateXML < Riddl::Implementation #{{{
      include Helpers

      def response
        cpee     = @h['X_CPEE'] || @a[0]
        behavior = @a[1] ? 'fork_ready' : @p[0].value
        data     = @a[1] ? 0 : 1
        selfurl  = @a[2]
        cblist   = @a[3]
        tdoc = if @p[data].additional =~ /base64/
          Base64.decode64(@p[data].value.read)
        else
          @p[data].value.read
        end

        if (instance, uuid = load_testset(tdoc,cpee)).first == -1
          @status = 500
        else
          handle_data cpee, instance, @p[data+1]&.value
          handle_waiting cpee, instance, uuid, behavior, selfurl, cblist
          handle_starting cpee, instance, behavior

          send = {
            'CPEE-INSTANCE' => instance,
            'CPEE-INSTANCE-URL' => File.join(cpee,instance),
            'CPEE-INSTANCE-UUID' => uuid,
            'CPEE-BEHAVIOR' => behavior
          }
          Riddl::Parameter::Complex.new('instance','application/json',JSON::generate(send))
        end
      end
    end #}}}

    class HandleInstance < Riddl::Implementation #{{{
      include Helpers

      def response
        cpee     = @h['X_CPEE'] || @a[0]
        selfurl  = @a[1]
        cblist   = @a[2]
        instance = @p[1].value

        srv = Riddl::Client.new(cpee, cpee + "?riddl-description")
        res = srv.resource("/#{instance}/properties/values/attributes/uuid")
        status, response = res.get

        if status >= 200 && status < 300
          uuid = XML::Smart::string(response.first.value).root.text
          handle_data cpee, instance, @p[2]&.value
          handle_waiting cpee, instance, uuid, @p[0].value, selfurl, cblist
          handle_starting cpee, instance, @p[0].value
          return Riddl::Parameter::Simple.new("url",cpee + instance)
        end
      end
    end #}}}

    class ContinueTask < Riddl::Implementation #{{{
      def response
        cpee         = @h['X_CPEE'] || @a[0]
        cblist       = @a[1]
        topic        = @p[1].value
        event_name   = @p[2].value
        notification = JSON.parse(@p[3].value)

        key = @r.last
        cb, condition, instance, uuid, instance_url = cblist.lrange(key,0,-1)

        orisend = {
          'CPEE-INSTANCE' => instance,
          'CPEE-INSTANCE-URL' => instance_url,
          'CPEE-INSTANCE-UUID' => uuid,
          'CPEE-STATE' => notification['state']
        }
        send = orisend.dup

        if notification['state'] == condition
          cblist.del(key)
          srv = Riddl::Client.new(cpee, cpee + "?riddl-description")
          res = srv.resource("/#{instance}/properties/values/dataelements")
          status, response = res.get
          if status >= 200 && status < 300
            doc = XML::Smart.string(response[0].value.read)
            doc.register_namespace 'p', 'http://riddl.org/ns/common-patterns/properties/1.0'
            doc.find('/p:value/*').each do |e|
              send[e.qname.name] = CPEE::ValueHelper::parse(e.text)
            end
          end
          Riddl::Client.new(cb).put Riddl::Parameter::Complex.new('dataelements','application/json',JSON::generate(send))
        else
          Riddl::Client.new(cb).put [
            Riddl::Header.new('CPEE-UPDATE','true'),
            Riddl::Parameter::Complex.new('dataelements','application/json',JSON::generate(send))
          ]
        end
      end
    end #}}}

    def self::implementation(opts)
      opts[:cpee] ||= 'http://localhost:9298/'
      opts[:self] ||= "http#{opts[:secure] ? 's' : ''}://#{opts[:host]}:#{opts[:port]}/"
      opts[:cblist] = Redis.new(path: "/tmp/redis.sock", db: 14)
      Proc.new do
        on resource do
          run InstantiateXML, opts[:cpee], true if post 'xmlsimple'
          on resource 'xml' do
            run InstantiateXML, opts[:cpee], false if post 'xml'
          end
          on resource 'url' do
            run InstantiateUrl, opts[:cpee], opts[:self], opts[:cblist], false if post 'url'
            run InstantiateUrl, opts[:cpee], opts[:self], opts[:cblist], true  if post 'url_info'
          end
          on resource 'git' do
            run InstantiateGit, opts[:cpee], opts[:self], opts[:cblist] if post 'git'
          end
          on resource 'instance' do
            run HandleInstance, opts[:cpee] if post 'instance'
          end
          on resource 'callback' do
            on resource do
              run ContinueTask, opts[:cpee], opts[:cblist] if post
            end
          end
        end
      end
    end

  end
end
