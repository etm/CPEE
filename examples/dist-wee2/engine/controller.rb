require ::File.dirname(__FILE__) + '/empty_workflow'
require 'xml/smart'

class Controller
  def initialize(id)
    @properties = ::File.dirname(__FILE__) + '/../instances/' + id  + '/properties.xml'
    @instance = EmptyWorkflow.new
    @instance.handlerargs = id
    self.unserialize!
    @thread = nil
    @result = nil
  end

  def start
    Thread.abort_on_exception = true
    @thread = Thread.new do
      Thread.current.abort_on_exception = true
      @result = @instance.start
    end
  end

  def stop
    @instance.stop
    @thread.join
    @thread = nil 
  end

  def serialize!
    XML::Smart::modify(@properties) do |doc|
      doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }
      
      node = doc.find("/p:properties/p:context-variables").first
      node.children.delete_all!
      @instance.context.each do |k,v|
        node.add(k.to_s,v.to_s)
      end

      node = doc.find("/p:properties/p:endpoints").first
      node.children.delete_all!
      @instance.endpoints.each do |k,v|
        node.add(k.to_s,v.to_s)
      end

      node = doc.find("/p:properties/p:state").first
      node.text = @instance.state
    end 
  end
  def unserialize!
    XML::Smart::open(@properties) do |doc|
      doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }

      @instance.context.clear
      doc.find("/p:properties/p:context-variables/p:*").each do |e|
        @instance.context e.name.to_s.to_sym => e.text
      end

      @instance.endpoints.clear
      doc.find("/p:properties/p:endpoints/p:*").each do |e|
        @instance.endpoint e.name.to_s.to_sym => e.text
      end

      @instance.wf_description doc.find("string(/p:properties/p:dsl)")
    end
    pp @instance
  end

  attr_reader :result
end
