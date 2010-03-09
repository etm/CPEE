require ::File.dirname(__FILE__) + '/empty_workflow'
require 'xml/smart'

class Controller
  def initialize(id)
    @directory = ::File.dirname(__FILE__) + "/../instances/#{id}/"
    @events = {}
    @votes = {}
    @callbacks = {}
    @instance = EmptyWorkflow.new(id)
    self.unserialize!
    @thread = nil
  end

  attr_reader :callbacks

  def start
    Thread.abort_on_exception = true
    @thread = Thread.new do
      Thread.current.abort_on_exception = true
      @instance.start
    end
  end

  def stop
    @instance.stop
    @thread.join
    @thread = nil 
  end

  def serialize!
    XML::Smart::modify(@directory + 'properties.xml') do |doc|
      doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }
      
      node = doc.find("/p:properties/p:context-variables").first
      node.children.delete_all!
      @instance.context.each do |k,v|
        node.add(k.to_s,v.to_s)
      end

      node = doc.find("/p:properties/p:state").first
      node.text = @instance.state
    end 
  end
  def unserialize!
    Dir[@directory + 'notifications/*/subscription.xml'].each do |sub|
      XML::Smart::open(sub) do |doc|
        key = ::File::basename(::File::dirname(sub))
        doc.namespaces = { 'n' => 'http://riddl.org/ns/common-patterns/notifications-producer/1.0' }
        url = doc.find('string(/n:subscription/@url)')
        doc.find('/n:subscription/n:topic').each do |t|
          t.find('n:event').each do |e|
            @events["#{t.attributes['id']}/#{e}"] ||= {}
            @events["#{t.attributes['id']}/#{e}"][key] = url
          end
        end
      end
    end
    XML::Smart::open(@directory + 'properties.xml') do |doc|
      doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }

      @instance.context.clear
      doc.find("/p:properties/p:context-variables/p:*").each do |e|
        @instance.context e.name.to_s.to_sym => e.text
      end

      @instance.endpoints.clear
      doc.find("/p:properties/p:endpoints/p:*").each do |e|
        @instance.endpoint e.name.to_s.to_sym => e.text
      end

      @instance.description doc.find("string(/p:properties/p:dsl)")
    end
  end

  def notify(type,what,content={})
    item = type == :event ? @events[what] : @votes[what]
    if item
      item.each do |key,url|
        topic        = ::File::dirname(what)
        event        = ::File::basename(what)
        notification = []
        cid          = -1
        fp           = ''

        content.each do |k,v|
          notification << "#{k}: #{v.inspect}" 
        end

        client = Riddl::Client.new(url)
        client.post [
          Riddl::Parameter::Simple.new("key",key),
          Riddl::Parameter::Simple.new("topic",topic),
          Riddl::Parameter::Simple.new("event",event),
          Riddl::Parameter::Simple.new("notification",notification.join('; ')),
          Riddl::Parameter::Simple.new("consumer-id",cid),
          Riddl::Parameter::Simple.new("fingerprint-with-consumer-secret",fp)
        ]
      end
    end
  end
end
