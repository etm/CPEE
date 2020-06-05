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

require 'fileutils'
require 'redis'
require 'riddl/server'
require 'riddl/client'
require_relative 'implementation_properties'

module CPEE

  SERVER = File.expand_path(File.join(__dir__,'..','cpee.xml'))
  PROPERTIES_FULL = %w{
    /p:properties/p:handlerwrapper
    /p:properties/p:positions/p:*
    /p:properties/p:positions/p:*/@*
    /p:properties/p:dataelements/p:*
    /p:properties/p:endpoints/p:*
    /p:properties/p:attributes/p:*
    /p:properties/p:transformation/p:*
    /p:properties/p:transformation/p:*/@*
    /p:properties/p:description
    /p:properties/p:status/id
    /p:properties/p:status/message
    /p:properties/p:state/@changed
    /p:properties/p:state
  }
  PROPERTIES = %w{
    /p:properties/p:handlerwrapper
    /p:properties/p:positions
    /p:properties/p:dataelements
    /p:properties/p:endpoints
    /p:properties/p:attributes
    /p:properties/p:transformation
    /p:properties/p:description
    /p:properties/p:status
    /p:properties/p:state
  }

  def self::implementation(opts)
    opts[:instances]                  ||= File.expand_path(File.join(__dir__,'..','..','server','instances'))
    opts[:global_handlerwrappers]     ||= File.expand_path(File.join(__dir__,'..','..','server','handlerwrappers'))
    opts[:handlerwrappers]            ||= ''
    opts[:topics]                     ||= File.expand_path(File.join(__dir__,'..','..','server','resources','topics.xml'))
    opts[:properties_init]            ||= File.expand_path(File.join(__dir__,'..','..','server','resources','properties.init'))
    opts[:transformation_dslx]        ||= File.expand_path(File.join(__dir__,'..','..','server','resources','transformation_dslx.xsl'))
    opts[:transformation_service]     ||= File.expand_path(File.join(__dir__,'..','..','server','resources','transformation.xml'))
    opts[:empty_dslx]                 ||= File.expand_path(File.join(__dir__,'..','..','server','resources','empty_dslx.xml'))
    opts[:notifications_init]         ||= File.expand_path(File.join(__dir__,'..','..','server','resources','notifications'))
    opts[:infinite_loop_stop]         ||= 10000
    opts[:redis_path]                 ||= '/tmp/redis.sock'
    opts[:redis_db]                   ||= 3

    opts[:redis]                      = Redis.new(path: opts[:redis_path], db: opts[:redis_db])

    opts[:runtime_cmds]               << [
      "startclean", "Delete instances before starting.", Proc.new { |status|
        Dir.glob(File.expand_path(File.join(opts[:instances],'*'))).each do |d|
          FileUtils.rm_r(d) if File.basename(d) =~ /^\d+$/
        end
      }
    ]

    Proc.new do
      interface 'properties' do |r|
        id = r[:h]['RIDDL_DECLARATION_PATH'].split('/')[1].to_i
        use CPEE::Properties::implementation(id, opts)
      end

      interface 'main' do
        run CPEE::Instances, opts if get '*'
        run CPEE::NewInstance, opts if post 'instance-new'
        on resource do |r|
          run CPEE::Info, opts if get
          run CPEE::DeleteInstance, opts if delete
          on resource 'callbacks' do
            run CPEE::Callbacks, opts if get
            on resource do
              run CPEE::ExCallback, opts if get || put || post || delete
            end
          end
        end
      end

      interface 'notifications' do |r|
        #id = r[:h]['RIDDL_DECLARATION_PATH'].split('/')[1].to_i
        #use CPEE::Notifications::Producer::implementation(id, opts[:mode])
      end
    end
  end

  class ExCallback < Riddl::Implementation #{{{
    def response
      controller = @a[0]
      id = @r[0].to_i
      callback = @r[2]
      controller[id].mutex.synchronize do
        if controller[id].callbacks.has_key?(callback)
          controller[id].callbacks[callback].callback(@p,@h)
        else
          @status = 503
        end
      end
    end
  end #}}}

  class Callbacks < Riddl::Implementation #{{{
    def response
      controller = @a[0]
      opts = @a[1]
      id = @r[0].to_i
      unless controller[id]
        @status = 400
        return
      end
      Riddl::Parameter::Complex.new("info","text/xml") do
        cb = XML::Smart::string("<callbacks details='#{opts[:mode]}'/>")
        if opts[:mode] == :debug
          controller[id].callbacks.each do |k,v|
            cb.root.add("callback",{"id" => k},"[#{v.protocol.to_s}] #{v.info}")
          end
        end
        cb.to_s
      end
    end
  end #}}}

  class Instances < Riddl::Implementation #{{{
    def response
      redis = @a[0][:redis]
      Riddl::Parameter::Complex.new("wis","text/xml") do
        ins = XML::Smart::string('<instances/>')
        redis.keys('instance:*/state').each do |key|
          instance = key[9..-1].to_i
          attributes = "instance:#{instance}/attributes/"
          info = redis.get(attributes + 'info')
          uuid = redis.get(attributes + 'uuid')
          state = redis.get(key)
          state_changed = redis.get(key + '/@changed')
          ins.root.add('instance', info,  'uuid' => uuid, 'id' => instance, 'state' => state, 'state_changed' => state_changed )
        end
        ins.to_s
      end
    end
  end #}}}

  class NewInstance < Riddl::Implementation #{{{
    def path(e)
      ret = []
      until e.qname.name == 'properties'
        ret << (e.class == XML::Smart::Dom::Attribute ? '@' : '') + e.qname.name
        e = e.parent
      end
      File.join(*ret.reverse)
    end

    def response
      opts = @a[0]
      redis = opts[:redis]
      doc = XML::Smart::open_unprotected(opts[:properties_init])
      doc.register_namespace 'p', 'http://cpee.org/ns/properties/2.0'
      name     = @p[0].value
      id       = redis.keys('instance:*/state').map { |e| e[9..-1].to_i}.max + 1
      uuid     = SecureRandom.uuid
      instance = 'instance:' + id.to_s
      redis.multi do |multi|
        doc.root.find(PROPERTIES_FULL.join(' | ')).each do |e|
          multi.set(File.join(instance, path(e)), e.text)
        end
      end

      @headers << Riddl::Header.new("CPEE-INSTANCE", id.to_s)
      @headers << Riddl::Header.new("CPEE-INSTANCE-URL", File.join(opts[:url].to_s,id.to_s))
      @headers << Riddl::Header.new("CPEE-INSTANCE-UUID", uuid)

      Riddl::Parameter::Simple.new("id", id.to_s)
    end
  end #}}}

  class Info < Riddl::Implementation #{{{
    def response
      opts = @a[0]
      id = @r[0].to_i
      unless opts[:redis].exists("instance:#{id}/state")
        @status = 400
        return
      end
      Riddl::Parameter::Complex.new("info","text/xml") do
        i = XML::Smart::string <<-END
          <info instance='#{id}'>
            <notifications/>
            <properties/>
            <callbacks/>
          </info>
        END
        i.to_s
      end
    end
  end #}}}

  class DeleteInstance < Riddl::Implementation #{{{
    def response
      opts = @a[0]
      redis = opts[:redis]
      id = @r[0].to_i
      unless redis.exists("instance:#{id}/state")
        @status = 400
        return
      end
      redis.multi do |multi|
        redis.keys('instance:#{id}/*').each do |key|
          redis.del(key)
        end
      end
    end
  end #}}}

end
