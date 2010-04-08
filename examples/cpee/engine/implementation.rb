require ::File.dirname(__FILE__) + '/controller'

$controller = {}
Dir['instances/*/properties.xml'].map{|e|::File::basename(::File::dirname(e))}.each do |id|
  $controller[id.to_i] = Controller.new(id)
end

class Callback #{{{
  def initialize(handler,info,method=:callback)
    @info = info
    @handler = handler
    @method = method.class == Symbol ? method : :callback
  end

  attr_reader :info

  def callback(result)
    @handler.send @method, result
  end
end #}}}

class ExCallback < Riddl::Implementation #{{{
  def response
    id = @r[0]  
    callback = @r[2]
    $controller[id.to_i].callbacks[callback].callback(@p)
    $controller[id.to_i].callbacks.delete(callback)
  end
end #}}}

class Callbacks < Riddl::Implementation #{{{
  def response
    Riddl::Parameter::Complex.new("info","text/xml") do
      cb = XML::Smart::string("<?xml-stylesheet href='/xsls/callbacks.xsl' type='text/xsl'?><callbacks details='#{@a[0]}'/>")
      if @a[0] == :production
        id = @r[0]
        $controller[id].callbacks.each do |k,v|
          cb.root.att("callback",{"id" => k},v)
        end  
      end
      cb.to_s
    end  
  end
end #}}}

class Instances < Riddl::Implementation #{{{
  def response
    Riddl::Parameter::Complex.new("wis","text/xml") do
      ins = XML::Smart::string('<?xml-stylesheet href="./xsls/instances.xsl" type="text/xsl"?><instances/>')
      Dir['instances/*/properties.xml'].each do |i|
        name = XML::Smart::open(i).find("string(/p:properties/p:name)",{'p'=>'http://riddl.org/ns/common-patterns/properties/1.0'})
        ins.root.add('instance',name,'id'=>File::basename(File::dirname(i)))
      end
      ins.to_s
    end
  end
end #}}}

class NewInstance < Riddl::Implementation #{{{
  def response
    name = @p[0].value
    id = Dir['instances/*/properties.xml'].map{|e|File::basename(File::dirname(e)).to_i}.sort.last
    id = (id.nil? ? 1 : id  + 1)
    Dir.mkdir("instances/#{id}")
    FileUtils.cp('instances/properties.init',"instances/#{id}/properties.xml")
    FileUtils.cp_r('instances/notifications.init',"instances/#{id}/notifications")
    FileUtils.ln_sf('../properties.schema.inactive',"instances/#{id}/properties.schema.inactive")
    XML::Smart.modify("instances/#{id}/properties.xml") do |doc|
      doc.find("/p:properties/p:name",{'p'=>'http://riddl.org/ns/common-patterns/properties/1.0'}).first.text = name
    end

    $controller[id.to_i] = Controller.new(id)

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
        <?xml-stylesheet href="../xsls/info.xsl" type="text/xsl"?>
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

class PropertiesHandler < Riddl::Utils::Properties::HandlerBase #{{{
  def sync
    if @property == 'description'
      XML::Smart::modify(@properties) do |doc|
        doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }
        dsl   = doc.find("/p:properties/p:dsl").first
        trans = doc.find("/p:properties/p:transformation").first
        desc  = doc.find("/p:properties/p:description").first
        if trans.nil?
          dsl.text = desc.to_s
        else
          trans = XML::Smart::string(trans.children.empty? ? trans.to_s : trans.children.first.dump)
          desc  = XML::Smart::string(desc.children.empty? ? desc.to_s : desc.children.first.dump)
          dsl.text = desc.transform_with(trans)
        end
      end
    end  
    id = ::File::basename(::File::dirname(@properties)).to_i
    if @property == 'state'
      XML::Smart::open(@properties) do |doc|
        doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }
        state = doc.find("string(/p:properties/p:state)")
        if state == 'stopped'
          $controller[id.to_i].stop
        end
        if state == 'running'
          $controller[id.to_i].start
        end
      end
    else
      $controller[id.to_i].unserialize!
    end
    case @property
      when 'description'
        $controller[id.to_i].notify('properties/description/change')
      when 'endpoints'
        $controller[id.to_i].notify('properties/endpoints/change')
    end  
  end

  def create; sync; end
  def update; sync; end
  def delete; sync; end
end #}}}

class NotificationsHandler < Riddl::Utils::Notifications::Producer::HandlerBase #{{{
  def sync
    id = ::File::basename(::File::dirname(@notifications)).to_i
    $controller[id.to_i].unserialize!
    $controller[id.to_i].notify('properties/handlers/change')
  end

  def create; sync; end
  def delete; sync; end
  def update; sync; end
end #}}}
