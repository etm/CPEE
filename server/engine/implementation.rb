require ::File.dirname(__FILE__) + '/controller'
require ::File.dirname(__FILE__) + '/handler_properties'
require ::File.dirname(__FILE__) + '/handler_notifications'

module CPEE

  def self::implementation(opts)
    opts[:instances] ||= File.expand_path(File.dirname(__FILE__) + '/instances')
    opts[:handlerwrappers] ||= File.expand_path(File.dirname(__FILE__) + '/handlerwrappers')
    opts[:topics] ||= File.expand_path(File.dirname(__FILE__) + '/resource/topics.xml')
    opts[:properties_init] ||= File.expand_path(File.dirname(__FILE__) + '/resource/properties.init')
    opts[:properties_schema_active] ||= File.expand_path(File.dirname(__FILE__) + '/resource/properties.schema.active')
    opts[:properties_schema_finished] ||= File.expand_path(File.dirname(__FILE__) + '/resource/properties.schema.finished')
    opts[:properties_schema_inactive] ||= File.expand_path(File.dirname(__FILE__) + '/resource/properties.schema.inactive')

    Proc.new do
      controller = {}
      Dir[opts[:instances] + '/*/properties.xml'].map{|e|::File::basename(::File::dirname(e))}.each do |id|
        controller[id.to_i] = Controller.new(id,opts[:url],opts)
      end

      interface 'properties' do |r|
        id = r[:h]['RIDDL_DECLARATION_PATH'].split('/')[1].to_i
        use Riddl::Utils::Properties::implementation(controller[id].backend_properties, PropertiesHandler, opts[:mode])
      end  

      interface 'main' do
        run CPEE::Instances, controller if get '*'
        run CPEE::NewInstance, opts[:url] if post 'instance-name'
        on resource do |r|
          run CPEE::Info if get
          run CPEE::DeleteInstance if delete
          on resource 'callbacks' do
            run CPEE::Callbacks, opts[:mode] if get
            on resource do
              run CPEE::ExCallback if get || put || post || delete
            end  
          end  
        end  
      end

      interface 'notifications' do |r|
        id = r[:h]['RIDDL_DECLARATION_PATH'].split('/')[1].to_i
        use Riddl::Utils::Notifications::Producer::implementation(controller[id].backend_notifications, NotificationsHandler, opts[:mode])
      end
    end  
  end  

  class Callback #{{{
    def initialize(info,handler,method,event,key,protocol,*data)
      @info = info
      @event = event
      @key = key
      @data = data
      @handler = handler
      @protocol = protocol
      @method = method.class == Symbol ? method : :callback
    end

    attr_reader :info, :protocol, :method

    def delete_if!(event,key)
      @handler.send @method, :DELETE, *@data if @key == key && @event == event
      nil
    end

    def callback(result)
      @handler.send @method, result, *@data
    end
  end #}}}

  class ExCallback < Riddl::Implementation #{{{
    def response
      id = @r[0]  
      callback = @r[2]
      $controller[id.to_i].mutex.synchronize do
        if $controller[id.to_i].callbacks.has_key?(callback) then
          $controller[id.to_i].callbacks[callback].callback(@p)
          $controller[id.to_i].callbacks.delete(callback)
        end
      end  
    end
  end #}}}

  class Callbacks < Riddl::Implementation #{{{
    def response
      unless File.exists?("instances/#{@r[0]}")
        @status = 400
        return
      end
      Riddl::Parameter::Complex.new("info","text/xml") do
        cb = XML::Smart::string("<callbacks details='#{@a[0]}'/>")
        if @a[0] == :debug
          id = @r[0]
          $controller[id.to_i].callbacks.each do |k,v|
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
          name = v.backend_properties.properties.find("string(/p:properties/p:name)")
          state = v.backend_properties.properties.find("string(/p:properties/p:state)")
          ins.root.add('instance',name, 'id' => k, 'state' => state)
        end
        ins.to_s
      end
    end
  end #}}}

  class NewInstance < Riddl::Implementation #{{{
    def response
      url = @a[0]
      name = @p[0].value
      id = Dir['instances/*/properties.xml'].map{|e|File::basename(File::dirname(e)).to_i}.sort.last.to_i
      while true
        id += 1
        begin
          Dir.mkdir("instances/#{id}")
          break
        rescue => details
        end
      end  
      FileUtils.cp('instances/properties.init',"instances/#{id}/properties.xml")
      FileUtils.cp_r('instances/notifications.init',"instances/#{id}/notifications")
      XML::Smart.modify("instances/#{id}/properties.xml") do |doc|
        doc.register_namespace 'p', 'http://riddl.org/ns/common-patterns/properties/1.0'
        doc.find("/p:properties/p:name").first.text = name
      end

      $controller[id.to_i] = Controller.new(id,url)

      Riddl::Parameter::Simple.new("id", id)
    end
  end #}}}

  class Info < Riddl::Implementation #{{{
    def response
      unless File.exists?("instances/#{@r[0]}")
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

  class DeleteInstance < Riddl::Implementation #{{{
    def response
      unless File.exists?("instances/#{@r[0]}")
        @status = 400
        return
      end
      FileUtils.rm_r("instances/#{@r[0]}")
      $controller.delete(@r[0])
    end
  end #}}}

end
