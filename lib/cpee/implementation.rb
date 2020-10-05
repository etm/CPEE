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
require_relative 'message'
require_relative 'persistence'
require_relative 'statemachine'
require_relative 'implementation_properties'
require_relative 'implementation_notifications'
require_relative 'implementation_callbacks'

module CPEE

  SERVER = File.expand_path(File.join(__dir__,'..','cpee.xml'))
  PROPERTIES_PATHS_FULL = %w{
    /p:properties/p:handlerwrapper
    /p:properties/p:positions/p:*
    /p:properties/p:positions/p:*/@*
    /p:properties/p:dataelements/p:*
    /p:properties/p:endpoints/p:*
    /p:properties/p:attributes/p:*
    /p:properties/p:transformation/p:*
    /p:properties/p:transformation/p:*/@*
    /p:properties/p:description
    /p:properties/p:dslx
    /p:properties/p:dsl
    /p:properties/p:status/p:id
    /p:properties/p:status/p:message
    /p:properties/p:state/@changed
    /p:properties/p:state
  }
  PROPERTIES_PATHS_INDEX_UNORDERED = %w{
    /p:properties/p:positions/p:*
  }
  PROPERTIES_PATHS_INDEX_ORDERED = %w{
    /p:properties/p:dataelements/p:*
    /p:properties/p:endpoints/p:*
    /p:properties/p:attributes/p:*
  }
  def self::implementation(opts)
    opts[:instances]                  ||= File.expand_path(File.join(__dir__,'..','..','server','instances'))
    opts[:global_handlerwrappers]     ||= File.expand_path(File.join(__dir__,'..','..','server','handlerwrappers'))
    opts[:handlerwrappers]            ||= ''
    opts[:topics]                     ||= File.expand_path(File.join(__dir__,'..','..','server','resources','topics.xml'))
    opts[:properties_init]            ||= File.expand_path(File.join(__dir__,'..','..','server','resources','properties.init'))
    opts[:properties_empty]           ||= File.expand_path(File.join(__dir__,'..','..','server','resources','properties.empty'))
    opts[:transformation_dslx]        ||= File.expand_path(File.join(__dir__,'..','..','server','resources','transformation_dslx.xsl'))
    opts[:transformation_service]     ||= File.expand_path(File.join(__dir__,'..','..','server','resources','transformation.xml'))
    opts[:empty_dslx]                 ||= File.expand_path(File.join(__dir__,'..','..','server','resources','empty_dslx.xml'))
    opts[:notifications_init]         ||= File.expand_path(File.join(__dir__,'..','..','server','resources','notifications'))
    opts[:states]                     ||= File.expand_path(File.join(__dir__,'..','..','server','resources','states.xml'))
    opts[:backend_run]                ||= File.expand_path(File.join(__dir__,'..','..','server','resources','backend','run'))
    opts[:backend_template]           ||= File.expand_path(File.join(__dir__,'..','..','server','resources','backend','instance.template'))
    opts[:backend_opts]               ||= 'opts.yaml'
    opts[:watchdog_frequency]         ||= 7
    opts[:watchdog_start_off]         ||= false
    opts[:backend_instance]           ||= 'instance.rb'
    opts[:infinite_loop_stop]         ||= 10000
    opts[:redis_path]                 ||= '/tmp/redis.sock'
    opts[:redis_db]                   ||= 3

    opts[:redis]                      = Redis.new(path: opts[:redis_path], db: opts[:redis_db])
    opts[:statemachine]               = CPEE::StateMachine.new opts[:states], %w{running simulating replaying finishing stopping abandoned finished} do |id|
      opts[:redis].get("instance:#{id}/state")
    end

    opts[:runtime_cmds]               << [
      "startclean", "Delete instances before starting.", Proc.new { |status|
        Dir.glob(File.expand_path(File.join(opts[:instances],'*'))).each do |d|
          FileUtils.rm_r(d) if File.basename(d) =~ /^\d+$/
        end
      }
    ]

    Proc.new do
      parallel do
        CPEE::watch_services(@riddl_opts[:watchdog_start_off])
        EM.add_periodic_timer(@riddl_opts[:watchdog_frequency]) do
          CPEE::watch_services(@riddl_opts[:watchdog_start_off])
        end
      end
      cleanup do
        CPEE::cleanup_services(@riddl_opts[:watchdog_start_off])
      end

      interface 'main' do
        run CPEE::Instances, opts if get '*'
        run CPEE::NewInstance, opts if post 'instance-new'
        on resource '\d+' do |r|
          run CPEE::Info, opts if get
          run CPEE::DeleteInstance, opts if delete
        end
      end

      interface 'properties' do |r|
        id = r[:h]['RIDDL_DECLARATION_PATH'].split('/')[1].to_i
        use CPEE::Properties::implementation(id.to_i, opts)
      end

      interface 'notifications' do |r|
        id = r[:h]['RIDDL_DECLARATION_PATH'].split('/')[1].to_i
        use CPEE::Notifications::implementation(id.to_i, opts)
      end

      interface 'callbacks' do |r|
        id = r[:h]['RIDDL_DECLARATION_PATH'].split('/')[1].to_i
        use CPEE::Callbacks::implementation(id.to_i, opts)
      end
    end
  end

  def self::watch_services(watchdog_start_off)
    return if watchdog_start_off
     EM.defer do
       Dir[File.join(__dir__,'..','..','server','routing','*.rb')].each do |s|
         s = s.sub(/\.rb$/,'')
         pid = (File.read(s + '.pid').to_i rescue nil)
         if (pid.nil? || !(Process.kill(0, pid) rescue false)) && !File.exist?(s + '.lock')
           system "#{s}.rb restart 1>/dev/null 2>&1"
           puts "➡ Service #{File.basename(s,'.rb')} started ..."
         end
       end
    end
  end
  def self::cleanup_services(watchdog_start_off)
    return if watchdog_start_off
    Dir[File.join(__dir__,'..','..','server','routing','*.rb')].each do |s|
      s = s.sub(/\.rb$/,'')
      pid = (File.read(s + '.pid').to_i rescue nil)
      if !pid.nil? || (Process.kill(0, pid) rescue false)
        system "#{s}.rb stop 1>/dev/null 2>&1"
        puts "➡ Service #{File.basename(s,'.rb')} stopped ..."
      end
    end
  end

  class Instances < Riddl::Implementation #{{{
    def response
      redis = @a[0][:redis]
      Riddl::Parameter::Complex.new("wis","text/xml") do
        ins = XML::Smart::string('<instances/>')
        redis.zrevrange('instances',0,-1).each do |instance|
          statekey = "instance:#{instance}/state"
          attributes = "instance:#{instance}/attributes/"
          info = redis.get(attributes + 'info')
          uuid = redis.get(attributes + 'uuid')
          state = redis.get(statekey)
          state_changed = redis.get(File.join(statekey,'@changed'))
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
      id       = redis.zcount('instances','-inf','+inf').to_i + 1
      uuid     = SecureRandom.uuid
      instance = 'instance:' + id.to_s
      redis.multi do |multi|
        multi.zadd('instances',id,id)
        doc.root.find(PROPERTIES_PATHS_FULL.join(' | ')).each do |e|
          if e.class == XML::Smart::Dom::Element && e.element_only?
            val = e.find('*').map { |f| f.dump }.join
            multi.set(File.join(instance, path(e)), val)
          else
            multi.set(File.join(instance, path(e)), e.text)
          end
        end
        doc.root.find(PROPERTIES_PATHS_INDEX_UNORDERED.join(' | ')).each do |e|
          p = path(e)
          multi.sadd(File.join(instance, File.dirname(p)), File.basename(p))
        end
        doc.root.find(PROPERTIES_PATHS_INDEX_ORDERED.join(' | ')).each_with_index do |e,i|
          p = path(e)
          multi.zadd(File.join(instance, File.dirname(p)), i, File.basename(p))
        end
        Dir[File.join(opts[:notifications_init],'*','subscription.xml')].each do |f|
          XML::Smart::open_unprotected(f) do |doc|
            doc.register_namespace 'np', 'http://riddl.org/ns/common-patterns/notifications-producer/2.0'
            key = File.basename(File.dirname(f))
            url = doc.find('string(/np:subscription/@url)')
            multi.sadd("instance:#{id}/handlers",key)
            multi.set("instance:#{id}/handlers/#{key}/url",url)
            doc.find('/np:subscription/np:topic/*').each do |e|
              c = File.join(e.parent.attributes['id'],e.qname.name,e.text)
              multi.sadd("instance:#{id}/handlers/#{key}",c)
              multi.sadd("instance:#{id}/handlers/#{c}",key)
            end
          end
        end
        multi.set(File.join(instance, 'attributes', 'uuid'), SecureRandom.uuid)
        multi.zadd(File.join(instance, 'attributes'), -2, 'uuid')
        multi.set(File.join(instance, 'attributes', 'info'), name)
        multi.zadd(File.join(instance, 'attributes'), -1, 'info')
        multi.set(File.join(instance, 'state', '@changed'), Time.now.xmlschema(3))
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
      unless opts[:redis].exists?("instance:#{id}/state")
        @status = 404
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
        @status = 404
        return
      end
      redis.multi do |multi|
        multi.del redis.keys("instance:#{id}/*").to_a
        multi.zrem 'instances', id
      end
    end
  end #}}}

end
