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

    module Testset #{{{

      def self::load(tdoc,cpee)
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
      end

    end #}}}

    class Instantiate < Riddl::Implementation
      def response
        cpee = @a[0]
        tdoc = case @p[@p.length - 1].name
          when 'url'
            status, res = Riddl::Client.new(@p[@p.length - 1].value).get
            if status >= 200 && status < 300
              res[0].value.read
            else
              (@status = 500) && return
            end
          when 'xml'
            if @p[@p.length - 1].additional =~ /base64/
              Base64.decode64(@p[@p.length - 1].value.read)
            else
              @p[@p.length - 1].value.read
            end
        end

        if (ins = Testset::load(tdoc,cpee)) == -1
          @status = 500
        else
          if @p[0].value =~ /^wait/
            @headers << Riddl::Header.new('CPEE_CALLBACK','true')
            cb = @h['CPEE_CALLBACK']

            if cb
              srv = Riddl::Client.new(cpee, cpee + "?riddl-description")
              status, response = srv.resource("/#{ins}/notifications/subscriptions/").post [
                Riddl::Parameter::Simple.new("topic","state"),
                Riddl::Parameter::Simple.new("events","change"),
              ]
              key = response.first.value

              srv.resource("/#{ins}/notifications/subscriptions/#{key}/ws/").ws do |conn|
                conn.on :message do |msg|
                  if JSON::parse(XML::Smart::string(msg.data).find('string(/event/notification)'))['state'] == 'finished'
                    conn.close
                    Riddl::Client.new(cb).put [
                      # TODO extract all dataelements from instance
                      Riddl::Parameter::Simple.new('instance',ins)
                    ]
                  end
                end
              end
            end
          end
          if @p.length > 1 && @p[0].value =~ /_running$/
            srv = Riddl::Client.new(cpee, cpee + "?riddl-description")
            res = srv.resource("/#{ins}/properties/values")
            status, response = res.put [
              Riddl::Parameter::Simple.new('name', 'state'),
              Riddl::Parameter::Simple.new('value','running')
            ]
          end
          return Riddl::Parameter::Simple.new("url",cpee + ins)
        end
      end
    end

    def self::implementation(opts)
      opts[:cpee] ||= 'http://localhost:9298/'
      Proc.new do
        on resource do
          run Instantiate, opts[:cpee] if post 'instantiate'
        end
      end
    end

  end
end
