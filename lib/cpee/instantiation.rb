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
require 'xml/smart'
require 'base64'
require 'uri'
require 'json'

module CPEE
  module Instantiation

    SERVER = File.expand_path(__dir__ + '/../instantiation.xml')

    module Helpers #{{{
      def load_testset(tdoc,cpee) #{{{
        ins = -1
        XML::Smart.string(tdoc) do |doc|
          doc.register_namespace 'desc', 'http://cpee.org/ns/description/1.0'
          doc.register_namespace 'prop', 'http://riddl.org/ns/common-patterns/properties/1.0'

          srv = Riddl::Client.new(cpee, cpee + "?riddl-description")
          res = srv.resource("/")
          status, response = res.post Riddl::Parameter::Simple.new("info",doc.find("string(/testset/attributes/prop:info)"))

          if status == 200
            ins = response.first.value
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
                pp cpee+ins+"/notifications/subscriptions/"
                pp inp
                status,body = Riddl::Client::new(cpee+ins+"/notifications/subscriptions/").post([Riddl::Parameter::Simple.new("url",han.attributes['url']),Riddl::Parameter::Simple.new("topic",han.children.first.attributes['topic']),Riddl::Parameter::Simple.new(han.children.first.qname.to_s,han.children.first.to_s)])
                pp status
                pp body
              end
            end
          end
        end
        return ins
      end #}}}
      private :load_testset
      def handle_waiting(cpee,instance,behavior) #{{{
        if behavior =~ /^wait/
          condition = behavior.match(/_([^_]+)_/)&.[](1) || 'finished'
          @headers << Riddl::Header.new('CPEE_CALLBACK','true')
          cb = @h['CPEE_CALLBACK']

          if cb
            srv = Riddl::Client.new(cpee, cpee + "?riddl-description")
            status, response = srv.resource("/#{instance}/notifications/subscriptions/").post [
              Riddl::Parameter::Simple.new("topic","state"),
              Riddl::Parameter::Simple.new("events","change"),
            ]
            key = response.first.value

            srv.resource("/#{instance}/notifications/subscriptions/#{key}/ws/").ws do |conn|
              conn.on :message do |msg|
                if JSON::parse(XML::Smart::string(msg.data).find('string(/event/notification)'))['state'] == condition
                  conn.close
                  Riddl::Client.new(cb).put [
                    # TODO extract all dataelements from instance
                    Riddl::Parameter::Simple.new('instance',instance)
                  ]
                end
              end
            end
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
      def handle_data(cpee,instance,data)
        if data
          srv = Riddl::Client.new(cpee, cpee + "?riddl-description")
          JSON::parse(data).each do |k,v|
            res = srv.resource("/#{instance}/properties/values/dataelements/#{k}")
            status, response = res.put [
              Riddl::Parameter::Simple.new('value',v)
            ]
          end rescue nil
        end
      end
    end #}}}

    class InstantiateUrl < Riddl::Implementation #{{{
      include Helpers

      def response
        cpee = @a[0]
        status, res = Riddl::Client.new(@p[1].value).get
        tdoc = if status >= 200 && status < 300
          res[0].value.read
        else
          (@status = 500) && return
        end

        if (instance = load_testset(tdoc,cpee)) == -1
          @status = 500
        else
          handle_data cpee, instance, @p[2]&.value
          handle_waiting cpee, instance, @p[0].value
          handle_starting cpee, instance, @p[0].value
          return Riddl::Parameter::Simple.new("url",cpee + instance)
        end
      end
    end #}}}

    class InstantiateXML < Riddl::Implementation #{{{
      include Helpers

      def response
        cpee     = @a[0]
        behavior = @a[1] ? 'wait_running' : @p[0].value
        data     = @a[1] ? 0 : 1
        tdoc = if @p[data].additional =~ /base64/
          Base64.decode64(@p[data].value.read)
        else
          @p[data].value.read
        end

        if (instance = load_testset(tdoc,cpee)) == -1
          @status = 500
        else
          handle_data cpee, instance, @p[data+1]&.value
          handle_waiting cpee, instance, behavior
          handle_starting cpee, instance, behavior
          return Riddl::Parameter::Simple.new("url",cpee + instance)
        end
      end
    end #}}}

    class HandleInstance < Riddl::Implementation #{{{
      include Helpers

      def response
        cpee     = @a[0]
        instance = @p[1].value

        handle_data cpee, instance, @p[2]&.value
        handle_waiting cpee, instance, @p[0].value
        handle_starting cpee, instance, @p[0].value
        return Riddl::Parameter::Simple.new("url",cpee + instance)
      end
    end #}}}

    def self::implementation(opts)
      opts[:cpee] ||= 'http://localhost:9298/'
      Proc.new do
        on resource do
          run InstantiateXML, opts[:cpee],true if post 'xmlsimple'
          on resource 'xml' do
            run InstantiateXML, opts[:cpee], false if post 'xml'
          end
          on resource 'url' do
            run InstantiateUrl, opts[:cpee] if post 'url'
          end
          on resource 'instance' do
            run HandleInstance, opts[:cpee] if post 'instance'
          end
        end
      end
    end

  end
end
