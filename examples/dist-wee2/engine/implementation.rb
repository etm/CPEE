require ::File.dirname(__FILE__) + '/controller'

$controller = {}
Dir['instances/*/properties.xml'].map{|e|File::basename(File::dirname(e))}.each do |id|
  $controller[id] = Controller.new(id)
end

class Instances < Riddl::Implementation
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
end

class NewInstance < Riddl::Implementation
  def response
    name = @p[0].value
    id = Dir['instances/*/properties.xml'].map{|e|File::basename(File::dirname(e))}.sort.last.to_i + 1
    Dir.mkdir("instances/#{id}")
    FileUtils.cp('instances/properties.init',"instances/#{id}/properties.xml")
    FileUtils.ln_sf('../properties.schema.inactive',"instances/#{id}/properties.schema.inactive")
    XML::Smart.modify("instances/#{id}/properties.xml") do |doc|
      doc.find("/p:properties/p:name",{'p'=>'http://riddl.org/ns/common-patterns/properties/1.0'}).first.text = name
    end

    $controller[id] = Controller.new(id)

    Riddl::Parameter::Simple.new("id", id)
  end
end

class Info < Riddl::Implementation
  def response
    unless File.exists?("instances/#{@r[0]}")
      @status = 400
      return
    end
    Riddl::Parameter::Complex.new("info","text/xml") do
      i = XML::Smart::string <<-END
        <?xml-stylesheet href="../xsls/info.xsl" type="text/xsl"?>
        <info instance='#{@r[0]}'>
          <properties/>
          <callbacks>0</callbacks>
        </info>
      END
      i.to_s
    end
  end
end

class DeleteInstance < Riddl::Implementation
  def response
    unless File.exists?("instances/#{@r[0]}")
      @status = 400
      return
    end
    FileUtils.rm_r("instances/#{@r[0]}")
    $controller.delete(@r[0])
  end
end
