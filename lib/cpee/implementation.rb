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
require 'riddl/server'
require 'riddl/client'
require 'riddl/utils/notifications_producer'
require 'riddl/utils/properties'
require ::File.dirname(__FILE__) + '/controller'

require 'ostruct'
class ParaStruct < OpenStruct
  def to_json(*a)
    table.to_json
  end
end
def →(a); ParaStruct.new(a); end
def ⭐(a); ParaStruct.new(a); end

module CPEE

  SERVER = File.expand_path(File.dirname(__FILE__) + '/../cpee.xml')

  def self::implementation(opts)
    opts[:instances]                  ||= File.expand_path(File.dirname(__FILE__) + '/../../server/instances')
    opts[:global_handlerwrappers]     ||= File.expand_path(File.dirname(__FILE__) + '/../../server/handlerwrappers')
    opts[:handlerwrappers]            ||= ''
    opts[:topics]                     ||= File.expand_path(File.dirname(__FILE__) + '/../../server/resources/topics.xml')
    opts[:properties_init]            ||= File.expand_path(File.dirname(__FILE__) + '/../../server/resources/properties.init')
    opts[:properties_schema_active]   ||= File.expand_path(File.dirname(__FILE__) + '/../../server/resources/properties.schema.active')
    opts[:properties_schema_finished] ||= File.expand_path(File.dirname(__FILE__) + '/../../server/resources/properties.schema.finished')
    opts[:properties_schema_inactive] ||= File.expand_path(File.dirname(__FILE__) + '/../../server/resources/properties.schema.inactive')
    opts[:transformation_dslx]        ||= File.expand_path(File.dirname(__FILE__) + '/../../server/resources/transformation_dslx.xsl')
    opts[:transformation_service]     ||= File.expand_path(File.dirname(__FILE__) + '/../../server/resources/transformation.xml')
    opts[:empty_dslx]                 ||= File.expand_path(File.dirname(__FILE__) + '/../../server/resources/empty_dslx.xml')
    opts[:notifications_init]         ||= nil
    opts[:infinite_loop_stop]         ||= 10000

    opts[:runtime_options]            << [
      "startclean", "Delete instances before starting.", Proc.new { |status|
        Dir.glob(File.expand_path(File.dirname(__FILE__) + '/../../server/instances/*')).each do |d|
          FileUtils.rm_r(d) if File.basename(d) =~ /^\d+$/
        end
      }
    ]

    Proc.new do
      Dir[opts[:global_handlerwrappers] + "/*.rb"].each do |h|
        require h
      end unless opts[:global_handlerwrappers].strip == ''
      Dir[opts[:handlerwrappers] + "/*.rb"].each do |h|
        require h
      end unless opts[:handlerwrappers].strip == ''

      controller = {}
      Dir[opts[:instances] + '/*/properties.xml'].each do |e|
        id = ::File::basename(::File::dirname(e))
        (controller[id.to_i] = Controller.new(id,opts)) rescue nil
      end

      interface 'properties' do |r|
        id = r[:h]['RIDDL_DECLARATION_PATH'].split('/')[1].to_i
        use Riddl::Utils::Properties::implementation(controller[id].properties, PropertiesHandler.new(controller[id]), opts[:mode]) if controller[id]
      end

      interface 'main' do
        run CPEE::Instances, controller if get '*'
        run CPEE::NewInstance, controller, opts if post 'instance-new'
        on resource do |r|
          run CPEE::Info, controller if get
          run CPEE::DeleteInstance, controller, opts if delete
          on resource 'console' do
            run CPEE::Console, controller if get
          end
          on resource 'callbacks' do
            run CPEE::Callbacks, controller, opts if get
            on resource do
              run CPEE::ExCallback, controller if get || put || post || delete
            end
          end
        end
      end

      interface 'notifications' do |r|
        id = r[:h]['RIDDL_DECLARATION_PATH'].split('/')[1].to_i
        use Riddl::Utils::Notifications::Producer::implementation(controller[id].notifications, NotificationsHandler.new(controller[id]), opts[:mode]) if controller[id]
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
      controller = @a[0]
      Riddl::Parameter::Complex.new("wis","text/xml") do
        ins = XML::Smart::string('<instances/>')
        controller.each do |k,v|
          name = v.properties.data.find("string(/p:properties/p:attributes/p:info)")
          state = v.properties.data.find("string(/p:properties/p:state)")
          ins.root.add('instance',name, 'id' => k, 'state' => state)
        end
        ins.to_s
      end
    end
  end #}}}

  class NewInstance < Riddl::Implementation #{{{
    def response
      controller = @a[0]
      opts = @a[1]
      name = @p[0].value
      id = controller.keys.sort.last.to_i

      while true
        id += 1
        Dir.mkdir(opts[:instances] + "/#{id}") rescue nil
        break
      end
      controller[id] = Controller.new(id,opts)
      info = controller[id].properties.data.find("/p:properties/p:attributes/p:info")
      info.first.text = name if info.length == 1

      Riddl::Parameter::Simple.new("id", id)
    end
  end #}}}

  class Info < Riddl::Implementation #{{{
    def response
      controller = @a[0]
      id = @r[0].to_i
      unless controller[id]
        @status = 400
        return
      end
      Riddl::Parameter::Complex.new("info","text/xml") do
        i = XML::Smart::string <<-END
          <info instance='#{@r[0]}'>
            <notifications/>
            <properties/>
            <callbacks/>
          </info>
        END
        i.to_s
      end
    end
  end #}}}

  class Console < Riddl::Implementation #{{{
    def response
      controller = @a[0]
      id = @r[0].to_i
      unless controller[id]
        @status = 400
        return
      end
      Riddl::Parameter::Complex.new("res","text/plain") do
        controller[id].console(@p[0])
      end
    end
  end #}}}

  class DeleteInstance < Riddl::Implementation #{{{
    def response
      controller = @a[0]
      opts = @a[1]
      id = @r[0].to_i
      unless controller[id]
        @status = 400
        return
      end
      controller.delete(id)
      FileUtils.rm_r(opts[:instances] + "/#{@r[0]}")
    end
  end #}}}

end
