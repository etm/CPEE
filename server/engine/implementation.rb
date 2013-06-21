require ::File.dirname(__FILE__) + '/controller'
require ::File.dirname(__FILE__) + '/handler_properties'
require ::File.dirname(__FILE__) + '/handler_notifications'

module CPEE

  def self::implementation(opts)
    opts[:instances]                  ||= File.expand_path(File.dirname(__FILE__) + '/../instances')
    opts[:handlerwrappers]            ||= File.expand_path(File.dirname(__FILE__) + '/../handlerwrappers')
    opts[:topics]                     ||= File.expand_path(File.dirname(__FILE__) + '/../resources/topics.xml')
    opts[:properties_init]            ||= File.expand_path(File.dirname(__FILE__) + '/../resources/properties.init')
    opts[:properties_schema_active]   ||= File.expand_path(File.dirname(__FILE__) + '/../resources/properties.schema.active')
    opts[:properties_schema_finished] ||= File.expand_path(File.dirname(__FILE__) + '/../resources/properties.schema.finished')
    opts[:properties_schema_inactive] ||= File.expand_path(File.dirname(__FILE__) + '/../resources/properties.schema.inactive')

    Proc.new do
      controller = {}
      Dir[opts[:instances] + '/*/properties.xml'].map{|e|::File::basename(::File::dirname(e))}.each do |id|
        controller[id.to_i] = Controller.new(id,opts)
      end

      interface 'properties' do |r|
        id = r[:h]['RIDDL_DECLARATION_PATH'].split('/')[1].to_i
        use Riddl::Utils::Properties::implementation(controller[id].properties, PropertiesHandler, opts[:mode])
      end  

      interface 'main' do
        run CPEE::Instances, controller if get '*'
        run CPEE::NewInstance, controller, opts if post 'instance-name'
        on resource do |r|
          run CPEE::Info, controller if get
          run CPEE::DeleteInstance, controller, opts if delete
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
      controller = @a[0]
      id = @r[0].to_i
      callback = @r[2]
      controller[id].mutex.synchronize do
        if controller[id].callbacks.has_key?(callback) then
          controller[id].callbacks[callback].callback(@p)
          controller[id].callbacks.delete(callback)
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
          name = v.properties.data.find("string(/p:properties/p:name)")
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
      controller[id].properties.data.find("/p:properties/p:name").first.text = name

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
