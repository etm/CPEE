require ::File.dirname(__FILE__) + '/empty_workflow'
require 'xml/smart'

class Controller

  def initialize(id)
    @directory = ::File.dirname(__FILE__) + "/../instances/#{id}/"
    @events = {}
    @votes = {}
    @votes_results = {}
    @callbacks = {}
    @instance = EmptyWorkflow.new(id)
    self.unserialize!
    @thread = nil
  end

  attr_reader :callbacks

  def start# {{{
    Thread.abort_on_exception = true
    @thread = Thread.new do
      Thread.current.abort_on_exception = true
      @instance.start
    end
  end# }}}

  def stop# {{{
    @instance.stop
    @thread.join if @thread && @thread.alive?
    @thread = nil 
  end# }}}

  def position# {{{
    XML::Smart::modify(@directory + 'properties.xml') do |doc|
      doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }
      pos = doc.find("/p:properties/p:positions").first
      pos.children.delete_all!
      @instance.positions.each do |p|
        pos.add("#{p.position}","#{p.passthrough}")
      end
    end
  end# }}}

  def serialize!# {{{
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
  end# }}}
  def unserialize!# {{{
    Dir[@directory + 'notifications/*/subscription.xml'].each do |sub|
      XML::Smart::open(sub) do |doc|
        key = ::File::basename(::File::dirname(sub))
        doc.namespaces = { 'n' => 'http://riddl.org/ns/common-patterns/notifications-producer/1.0' }
        url = doc.find('string(/n:subscription/@url)') 
        doc.find('/n:subscription/n:topic').each do |t|
          t.find('n:event').each do |e|
            @events["#{t.attributes['id']}/#{e}"] ||= {}
            if @events["#{t.attributes['id']}/#{e}"].has_key?(key)
              unless url == "" # has maybe already a websocket in key, so don't overwrite it
                @events["#{t.attributes['id']}/#{e}"][key] = url
              end  
            else
              @events["#{t.attributes['id']}/#{e}"][key] = (url == "" ? nil : url)
            end  
          end
          t.find('n:vote').each do |e|
            @votes["#{t.attributes['id']}/#{e}"] ||= {}
            if @votes["#{t.attributes['id']}/#{e}"].has_key?(key)
              unless url == "" # has maybe already a websocket in key, so don't overwrite it
                @votes["#{t.attributes['id']}/#{e}"][key] = url
              end  
            else  
              @votes["#{t.attributes['id']}/#{e}"][key] = (url == "" ? nil : url)
            end  
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
  end# }}}

  def notify(what,content={})# {{{
    item = @events[what]
    if item
      item.each do |key,url|
        ev = build_event(key,what,content)

        if url.class == String
          client = Riddl::Client.new(url)
          client.post ev.map{|k,v|Riddl::Parameter::Simple.new(k,v)}
        elsif url.class == Riddl::Utils::Notifications::Producer::WS
          e = XML::Smart::string("<event/>")
          ev.each do |k,v|
            e.root.add(k,v)
          end
          url.send(e.to_s)
        end  

      end
    end
  end# }}}

  def call_vote(continue,what,content={})
    item = @votes[what]
    if item
      item.each do |key,url|
        ev = build_event(key,what,content)

        if url.class == String
          client = Riddl::Client.new(url)
          callback = Digest::MD5.hexdigest(rand(Time.now).to_s)
          params = ev.map{|k,v|Riddl::Parameter::Simple.new(k,v)}
          params << Riddl::Header.new("CPEE-Callback",callback)
          status, result, headers = client.post params

          if headers["CPEE-Callback"] && headers["CPEE-Callback"] == true
            continue = Continue.new
            @callbacks[callback] = Callback.new("vote",self,:vote_callback,continue)
            @votes_results[callback] = nil
            continue.wait
          else
            @votes_results[callback] = (result[0] && result[0].value == 'true')
          end
            
          return callback
        elsif url.class == Riddl::Utils::Notifications::Producer::WS

        end
      end
    end
  end

  def add_ws(key,socket)# {{{
    @events.each do |a|
      if a[1].has_key?(key)
        a[1][key] = socket
      end  
    end
  end# }}}

  def del_ws(key)# {{{
    @events.each do |a|
      if a[1].has_key?(key)
        a[1][key] = nil
      end  
    end
  end# }}}
  
  def vote_result(callback)
    @votes_results.delete(callback)
  end

  def vote_callback(result,continue)
    continue.continue
    @votes_results[callback] = (result[0] && result[0].value == 'true')
  end

private

  def build_event(key,what,content)# {{{
    res = []
    res << ['key'  , key]
    res << ['topic', ::File::dirname(what)]
    res << ['event', ::File::basename(what)]
    noty = []
    content.each do |k,v|
      noty << "#{k}: #{v.inspect}" 
    end
    res << ['notification', noty.join('; ')]
    res << ['uid'         , Digest::MD5.hexdigest(Kernel::rand().to_s)]
    res << ['fp'          , Digest::MD5.hexdigest(res.join(''))]
  end# }}}

end
