require ::File.dirname(__FILE__) + '/controller'

$controller = {}
Dir['instances/*/properties.xml'].map{|e|::File::basename(::File::dirname(e))}.each do |id|
  $controller[id.to_i] = Controller.new(id,$url)
end

class Callback #{{{
  def initialize(info,handler,method,event,key,protocol,*context)
    @info = info
    @event = event
    @key = key
    @context = context
    @handler = handler
    @protocol = protocol
    @method = method.class == Symbol ? method : :callback
  end

  attr_reader :info, :protocol

  def delete_if!(event,key)
    @handler.send @method, :DELETE, *@context if @key == key && @event == event
    nil
  end

  def callback(result)
    @handler.send @method, result, *@context
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
      cb = XML::Smart::string("<?xml-stylesheet href='/xsls/callbacks.xsl' type='text/xsl'?><callbacks details='#{@a[0]}'/>")
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
    url = @a[0]
    name = @p[0].value
    id = Dir['instances/*/properties.xml'].map{|e|File::basename(File::dirname(e)).to_i}.sort.last
    id = (id.nil? ? 1 : id  + 1)
    1.upto id do |i|
      begin
        Dir.mkdir("instances/#{i}")
        id = i
        break
      rescue => details
      end
    end  
    FileUtils.cp('instances/properties.init',"instances/#{id}/properties.xml")
    FileUtils.cp_r('instances/notifications.init',"instances/#{id}/notifications")
    XML::Smart.modify("instances/#{id}/properties.xml") do |doc|
      doc.find("/p:properties/p:name",{'p'=>'http://riddl.org/ns/common-patterns/properties/1.0'}).first.text = name
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
        if state == 'stopping'
          $controller[id.to_i].stop
        end
        if state == 'running'
          $controller[id.to_i].start
        end
      end
    else
      $controller[id.to_i].unserialize_context!
    end
    case @property
      when 'handlerwrapper'
        $controller[id.to_i].notify('properties/description/handlerwrapper')
      when 'description'
        $controller[id.to_i].notify('properties/description/change')
      when 'endpoints'
        $controller[id.to_i].notify('properties/endpoints/change')
      when 'context-variables'
        $controller[id.to_i].notify('properties/context-variables/change')
      else
        nil
    end
  end

  def create; sync; end
  def update; sync; end
  def delete; sync; end
end #}}}

class NotificationsHandler < Riddl::Utils::Notifications::Producer::HandlerBase #{{{
  def ws_open(socket)
    id = ::File::basename(::File::dirname(@notifications)).to_i
    $controller[id.to_i].add_ws(@key,socket)
  end
  def ws_close
    id = ::File::basename(::File::dirname(@notifications)).to_i
    $controller[id.to_i].del_ws(@key)
  end
  def ws_message(socket,data)
    id = ::File::basename(::File::dirname(@notifications)).to_i
    begin
      doc = XML::Smart::string(data)
      callback = doc.find("string(/vote/@id)")
      result = doc.find("string(/vote)")
      $controller[id.to_i].callbacks[callback].callback(result == 'true' ? true : false)
      $controller[id.to_i].callbacks.delete(callback)
    rescue
      puts "Invalid message over websocket"
    end
  end

  def create
    id = ::File::basename(::File::dirname(@notifications)).to_i
    $controller[id.to_i].unserialize_event!(:cre,@key)
    $controller[id.to_i].notify('properties/handlers/change')
  end
  def delete
    id = ::File::basename(::File::dirname(@notifications)).to_i
    $controller[id.to_i].unserialize_event!(:del,@key)
    $controller[id.to_i].notify('properties/handlers/change')
  end
  def update
    id = ::File::basename(::File::dirname(@notifications)).to_i
    $controller[id.to_i].unserialize_event!(:upd,@key)
    $controller[id.to_i].notify('properties/handlers/change')
  end
end #}}}

module ActiveSupport # {{{
  module JSON
    class << self
      def translate_json_objects(obj)
        res = nil
        case obj
          when Array
            res = Array.new
            obj.each do |e|
              res << translate_json_objects(e)
            end
          when Hash
            if obj.length == 1 && obj.keys.first =~ /!map:([A-Z][a-zA-Z0-9_]*)/
              newobj = eval($1)
              res = newobj.new_from_obj(translate_json_objects(obj[obj.keys.first]))
            else
              res = Hash.new
              obj.each do |k,v|
                res[k] = translate_json_objects(v)
              end
            end
          else
            res = obj
        end
        res
      end
      def decode_translate(json)
        translate_json_objects(decode(json))
      end
    end
  end
end # }}}
