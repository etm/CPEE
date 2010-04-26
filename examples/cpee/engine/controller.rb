require ::File.dirname(__FILE__) + '/empty_workflow'
require 'xml/smart'
require 'yaml'

class Object; def to_yaml_style; :inline; end; end

class Controller

  def initialize(id,url)
    @directory = ::File.dirname(__FILE__) + "/../instances/#{id}/"
    @events = {}
    @votes = {}
    @votes_results = {}
    @callbacks = {}
    @instance = EmptyWorkflow.new(id,url)
    @positions = []
    self.unserialize!
    @thread = nil
  end

  attr_reader :callbacks

  def start# {{{
    Thread.abort_on_exception = true
    @thread = Thread.new do
      Thread.current.abort_on_exception = true
      unless @positions.empty?
        @instance.search(@positions)
      end
      @instance.start
    end
  end# }}}

  def stop# {{{
    t = @instance.stop
    t.run
    @callbacks.delete_if{|k,c| c.callback(nil); true}
    t.join
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
        node.add(k.to_s,YAML::dump(v).sub(/^--- /,''))
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

    hw = nil
    XML::Smart::open(@directory + 'properties.xml') do |doc|
      doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }

      @instance.context.clear
      doc.find("/p:properties/p:context-variables/p:*").each do |e|
        @instance.context e.name.to_s.to_sym => YAML::load(e.text) rescue nil
      end

      @instance.endpoints.clear
      doc.find("/p:properties/p:endpoints/p:*").each do |e|
        @instance.endpoint e.name.to_s.to_sym => e.text
      end
      
      begin
        hw = eval(doc.find("string(/p:properties/p:handlerwrapper)"))
        @instance.handlerwrapper = hw
      rescue => e  
        @instance.handlerwrapper = DefaultHandlerWrapper
      end  

      doc.find("/p:properties/p:endpoints/p:*").each do |e|
        @instance.endpoint e.name.to_s.to_sym => e.text
      end
    
      @positions = []
      doc.find("/p:properties/p:positions/p:*").each do |e|
        @positions << ::Wee::Position.new(e.name.to_s.to_sym,:at,e.text)
      end

      @instance.description doc.find("string(/p:properties/p:dsl)")
    end

    if hw != @instance.handlerwrapper
      XML::Smart::modify(@directory + 'properties.xml') do |doc|
        doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }
        node = doc.find("/p:properties/p:handlerwrapper").first
        node.text = @instance.handlerwrapper.to_s
      end 
    end
  end# }}}

  def notify(what,content={})# {{{
    item = @events[what]
    if item
      item.each do |key,url|
        ev = build_notification(key,what,content,'event')

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

  def call_vote(what,content={})# {{{
    item = @votes[what]
    if item
      item.each do |key,url|
        callback = Digest::MD5.hexdigest(rand(Time.now).to_s)
        content['callback'] = callback
        vo = build_notification(key,what,content,'vote')

        if url.class == String
          client = Riddl::Client.new(url)
          params = vo.map{|k,v|Riddl::Parameter::Simple.new(k,v)}
          params << Riddl::Header.new("CPEE-Callback",callback)
          status, result, headers = client.post params

          if headers["CPEE-Callback"] && headers["CPEE-Callback"] == true
            continue = Wee::Continue.new
            @callbacks[callback] = Callback.new("vote #{vo['notification']}",self,:vote_callback,:http,continue,callback)
            @votes_results[callback] = nil
            continue.wait
          else
            @votes_results[callback] = (result[0] && result[0].value == 'true')
          end
        elsif url.class == Riddl::Utils::Notifications::Producer::WS
          continue = Wee::Continue.new
          @callbacks[callback] = Callback.new("vote #{vo.find{|a,b| a == 'notification'}[1]}",self,:vote_callback,:ws,continue,callback)
          @votes_results[callback] = nil
          e = XML::Smart::string("<vote/>")
          vo.each do |k,v|
            e.root.add(k,v)
          end
          url.send(e.to_s)
          continue.wait
        end
      end
    end
  end# }}}

  def vote_result(callback)# {{{
    @votes_results.delete(callback)
  end# }}}

  def vote_callback(result,continue,callback)# {{{
    continue.continue
    @votes_results[callback] = (result && result[0] && result[0].value == 'true')
  end# }}}

  def add_ws(key,socket)# {{{
    @events.each do |a|
      if a[1].has_key?(key)
        a[1][key] = socket
      end  
    end
    @votes.each do |a|
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
    @votes.each do |a|
      if a[1].has_key?(key)
        a[1][key] = nil
      end
    end

  end# }}}
  
private

  def build_notification(key,what,content,type)# {{{
    res = []
    res << ['key'         , key]
    res << ['topic'       , ::File::dirname(what)]
    res << [type          , ::File::basename(what)]
    res << ['notification', content.to_yaml.sub('--- ','')]
    res << ['uid'         , Digest::MD5.hexdigest(Kernel::rand().to_s)]
    res << ['fp'          , Digest::MD5.hexdigest(res.join(''))]
    # TODO add secret to fp
  end# }}}
end
