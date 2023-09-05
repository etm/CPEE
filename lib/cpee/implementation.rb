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
require_relative 'fail'
require_relative 'redis'
require_relative 'message'
require_relative 'persistence'
require_relative 'statemachine'
require_relative 'implementation_properties'
require_relative 'implementation_notifications'
require_relative 'implementation_callbacks'

module CPEE

  SERVER = File.expand_path(File.join(__dir__,'..','cpee.xml'))
  PROPERTIES_PATHS_FULL = %w{
    /p:properties/p:executionhandler
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
    opts[:see_instances]              ||= opts[:see_instances].nil? ? false : opts[:see_instances]

    opts[:instances]                  ||= File.expand_path(File.join(__dir__,'..','..','server','instances'))
    opts[:global_executionhandlers]   ||= File.expand_path(File.join(__dir__,'..','..','server','executionhandlers'))
    opts[:executionhandlers]          ||= ''
    opts[:topics]                     ||= File.expand_path(File.join(__dir__,'..','..','server','resources','topics.xml'))
    opts[:properties_init]            ||= File.expand_path(File.join(__dir__,'..','..','server','resources','properties.init'))
    opts[:properties_empty]           ||= File.expand_path(File.join(__dir__,'..','..','server','resources','properties.empty'))
    opts[:transformation_service]     ||= File.expand_path(File.join(__dir__,'..','..','server','resources','transformation.xml'))
    opts[:empty_dslx]                 ||= File.expand_path(File.join(__dir__,'..','..','server','resources','empty_dslx.xml'))
    opts[:notifications_init]         ||= File.expand_path(File.join(__dir__,'..','..','server','resources','notifications'))
    opts[:states]                     ||= File.expand_path(File.join(__dir__,'..','..','server','resources','states.xml'))
    opts[:watchdog_frequency]         ||= 7
    opts[:watchdog_start_off]         ||= false
    opts[:infinite_loop_stop]         ||= 10000
    opts[:workers]                    ||= 1
    opts[:workers_single]             ||= ['end','persist','forward-votes']
    opts[:workers_multi]              ||= ['forward-events']

    opts[:dashing_frequency]          ||= 3
    opts[:dashing_target]             ||= nil

    ### set redis_cmd to nil if you want to do global
    ### at least redis_path or redis_url and redis_db have to be set if you do global
    opts[:redis_path]                 ||= 'redis.sock' # use e.g. /tmp/redis.sock for global stuff. Look it up in your redis config
    opts[:redis_db]                   ||= 0
    ### optional redis stuff
    opts[:redis_url]                  ||= nil
    opts[:redis_cmd]                  ||= 'redis-server --port 0 --unixsocket #redis_path# --unixsocketperm 600 --pidfile #redis_pid# --dir #redis_db_dir# --dbfilename #redis_db_name# --databases 1 --save 900 1 --save 300 10 --save 60 10000 --rdbcompression yes --daemonize yes'
    opts[:redis_pid]                  ||= 'redis.pid' # use e.g. /var/run/redis.pid if you do global. Look it up in your redis config
    opts[:redis_db_name]              ||= 'redis.rdb' # use e.g. /var/lib/redis.rdb for global stuff. Look it up in your redis config

    CPEE::redis_connect opts, 'Server Main'

    opts[:sse_keepalive_frequency]    ||= 10
    opts[:sse_connections]            = {}

    opts[:statemachine]               = CPEE::StateMachine.new opts[:states], %w{running simulating replaying finishing stopping abandoned finished} do |id|
      CPEE::Persistence::extract_item(id,opts,"state")
    end

    opts[:runtime_cmds]               << [
      "startclean", "Delete instances before starting.", Proc.new { |status|
        Dir.glob(File.expand_path(File.join(opts[:instances],'*'))).each do |d|
          FileUtils.rm_r(d) if File.basename(d) =~ /^\d+$/
        end
      }
    ]

    Proc.new do
      Dir[File.join(opts[:global_executionhandlers],'*','execution.rb')].each do |h|
        require h
      end unless opts[:global_executionhandlers].nil? || opts[:global_executionhandlers].strip == ''
      Dir[File.join(opts[:executionhandlers],'*','execution.rb')].each do |h|
        require h
      end unless opts[:executionhandlers].nil? || opts[:executionhandlers].strip == ''
      CPEE::Message::set_workers(opts[:workers])

      parallel do
        CPEE::watch_services(opts[:watchdog_start_off],opts[:redis_url],File.join(opts[:basepath],opts[:redis_path]),opts[:redis_db],opts[:workers],opts[:workers_single],opts[:workers_multi])
        EM.add_periodic_timer(opts[:watchdog_frequency]) do ### start services
          CPEE::watch_services(opts[:watchdog_start_off],opts[:redis_url],File.join(opts[:basepath],opts[:redis_path]),opts[:redis_db],opts[:workers],opts[:workers_single],opts[:workers_multi])
        end
        EM.defer do ### catch all sse connections
          CPEE::Notifications::sse_distributor(opts)
        end
        EM.add_periodic_timer(opts[:sse_keepalive_frequency]) do
          CPEE::Notifications::sse_heartbeat(opts)
        end

        if opts[:dashing_target]
          cpu_last = 0
          idl_last = 0
          EM.add_periodic_timer(opts[:dashing_frequency]) do
            src = `cat /proc/stat | head -n 1`.split("\n")
            srm = `cat /proc/meminfo`.split("\n")
            sc = {}
            sm = {}
            src.each do |e|
              x = e.split(' ')
              sc[x[0]] = x[1..-1].map{|r| r.to_i}
            end
            srm.each do |e|
              x = e.split(/\s+/)
              sm[x[0].chop] = x[1].to_i
            end
            scc = 0
            sci = 0
            sc.each do |_,e|
              scc = e[0..4].sum
              sci = e[3]
            end
            cpu_delta = scc - cpu_last
            cpu_idle  = sci - idl_last
            cpu_used  = cpu_delta - cpu_idle
            cpu_usage = '%.2f' % (100 * cpu_used / cpu_delta.to_f)
            mem_tot   = '%.1f' % (sm['MemTotal']/1024.0)
            mem_fre   = '%.1f' % (sm['MemFree']/1024.0)
            mem_ava   = '%.1f' % (sm['MemAvailable']/1024.0)
            mem_buc   = '%.1f' % ((sm['Buffers'] + sm['Cached'] + sm['SReclaimable'])/1024.0)
            mem_usd   = '%.1f' % ((sm['MemTotal'] - sm['MemFree'] - sm['Buffers'] - sm['Cached'] - sm['SReclaimable'])/1024.0)

            # puts "CPU usage at #{cpu_usage}%"
            # puts "Mem usage at #{mem_tot}/#{mem_fre}/#{mem_usd}/#{mem_buc}/#{mem_ava}"
            content = {}
            content['cpu_usage'] = cpu_usage
            content['mem_total'] = mem_tot
            content['mem_free'] = mem_fre
            content['mem_available'] = mem_ava
            content['mem_bufferedandcached'] = mem_buc
            content['mem_used'] = mem_usd
            CPEE::Message::send_url(:event,'node/resource_utilization',File.join(opts[:url],'/'),content,File.join(opts[:dashing_target],'/dash/events'))

            # Keep this as last for our next read
            idl_last = sci
            cpu_last = scc
          end
        end
      end

      cleanup do
        CPEE::cleanup_services(opts[:watchdog_start_off])
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

  def self::watch_services(watchdog_start_off,url,path,db,workers,workers_single,workers_multi)
    return if watchdog_start_off
    EM.defer do
      workers_single.each do |s|
        s = File.join(__dir__,'..','..','server','routing',s)
        next if File.exist?(s + '.lock')
        pid = (File.read(s + '.pid').to_i rescue nil)
        if (pid.nil? || !(Process.kill(0, pid) rescue false))
          cmd = if url.nil?
            "-p \"#{path}\" -d #{db} -w #{workers} restart 1>/dev/null 2>&1"
          else
            "-u \"#{url}\" -d #{db} -w #{workers} restart 1>/dev/null 2>&1"
          end
          system "#{s}.rb " + cmd + " 1>/dev/null 2>&1"
          puts "➡ Service #{File.basename(s)} (#{cmd}) started ..."
        end
      end
      workers_multi.each do |s|
        s = File.join(__dir__,'..','..','server','routing',s.to_s)
        next if File.exist?(s + '.lock')
        (0...workers).each do |w|
          w = '%02i' % w
          pid = (File.read(s + '-' + w + '.pid').to_i rescue nil)
          if (pid.nil? || !(Process.kill(0, pid) rescue false))
            cmd = if url.nil?
              "-p \"#{path}\" -d #{db} -w #{w} restart"
            else
              "-u \"#{url}\" -d #{db} -w #{w} restart"
            end
            system "#{s}.rb " + cmd + " 1>/dev/null 2>&1"
            puts "➡ Service #{File.basename(s)}-#{w} (#{cmd}) started ..."
          end
        end
      end
    end
  end
  def self::cleanup_services(watchdog_start_off)
    return if watchdog_start_off
    Dir[File.join(__dir__,'..','..','server','routing','*.pid')].each do |s|
      pid = (File.read(s).to_i rescue nil)
      if !pid.nil? || (Process.kill(0, pid) rescue false)
        f = s.sub(/(-(\d+))?\.pid$/,'.rb')
        if $2.nil?
          system "#{f} stop 1>/dev/null 2>&1"
        else
          system "#{f} -w #{$2} stop 1>/dev/null 2>&1"
        end
        puts "➡ Service #{File.basename(s,'.pid')} stopped ..."
      end
    end
  end

  class Instances < Riddl::Implementation #{{{
    def response
      opts = @a[0]
      if opts[:see_instances] || @h['SEE_INSTANCES'] == 'true'
        Riddl::Parameter::Complex.new("wis","text/xml") do
          ins = XML::Smart::string('<instances/>')
          CPEE::Persistence::each_object(opts) do |instance|
            info = CPEE::Persistence::extract_item(instance,opts,'attributes/info')
            uuid = CPEE::Persistence::extract_item(instance,opts,'attributes/uuid')
            state = CPEE::Persistence::extract_item(instance,opts,'state')
            state_changed = CPEE::Persistence::extract_item(instance,opts,'state/@changed')
            ins.root.add('instance', info,  'uuid' => uuid, 'id' => instance, 'state' => state, 'state_changed' => state_changed )
          end
          ins.to_s
        end
      else
        Riddl::Parameter::Complex.new("wis","text/xml",'<instances><!-- instances list disabled. --></instances>')
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
      id       = CPEE::Persistence::new_object(opts)
      uuid     = SecureRandom.uuid
      instance = CPEE::Persistence::obj + ':' + id.to_s
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
            multi.sadd(CPEE::Persistence::obj + ":#{id}/handlers",key)
            multi.set(CPEE::Persistence::obj + ":#{id}/handlers/#{key}/url",url)
            doc.find('/np:subscription/np:topic/*').each do |e|
              c = File.join(e.parent.attributes['id'],e.qname.name,e.text)
              multi.sadd(CPEE::Persistence::obj + ":#{id}/handlers/#{key}",c)
              multi.sadd(CPEE::Persistence::obj + ":#{id}/handlers/#{c}",key)
            end
          end rescue nil # all the ones that are not ok, are ignored
        end
        multi.set(File.join(instance, 'attributes', 'uuid'), uuid)
        multi.zadd(File.join(instance, 'attributes'), -2, 'uuid')
        multi.set(File.join(instance, 'attributes', 'info'), name)
        multi.zadd(File.join(instance, 'attributes'), -1, 'info')
        multi.set(File.join(instance, 'state', '@changed'), Time.now.xmlschema(3))
      end

      content = {
        :state => 'ready',
        :attributes => CPEE::Persistence::extract_list(id,opts,'attributes').to_h
      }
      CPEE::Message::send(:event,'state/change',File.join(opts[:url],'/'),id,uuid,name,content,redis)

      @headers << Riddl::Header.new("CPEE-INSTANCE", id.to_s)
      @headers << Riddl::Header.new("CPEE-INSTANCE-URL", File.join(opts[:url].to_s,id.to_s,'/'))
      @headers << Riddl::Header.new("CPEE-INSTANCE-UUID", uuid)

      Riddl::Parameter::Simple.new("id", id.to_s)
    end
  end #}}}

  class Info < Riddl::Implementation #{{{
    def response
      opts = @a[0]
      id = @r[0].to_i
      unless CPEE::Persistence::exists?(id,opts)
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
      unless CPEE::Persistence::exists?(id,opts)
        @status = 404
        return
      end

      content = {
        :state => 'purged',
        :attributes => CPEE::Persistence::extract_list(id,opts,'attributes').to_h
      }
      state = CPEE::Persistence::extract_item(id,opts,'state')
      if state == 'stopped' || state == 'ready'
        CPEE::Message::send(:event,'state/change',File.join(opts[:url],'/'),id,content[:attributes]['uuid'],content[:attributes]['info'],content,redis)
      end

      empt = CPEE::Persistence::keys(id,opts).to_a
      redis.multi do |multi|
        empt.each do |e|
          multi.expire e, 30
        end
        multi.zrem 'instances', id
      end
    end
  end #}}}

end
