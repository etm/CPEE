require ::File.dirname(__FILE__) + '/empty_workflow'
require 'xml/smart'
require 'multi_json'

class Controller

  def initialize(id,url)
    @directory = ::File.dirname(__FILE__) + "/../instances/#{id}/"
    @events = {}
    @votes = {}
    @votes_results = {}
    @communication = {}
    @callbacks = {}
    @instance = EmptyWorkflow.new(id,url)
    @positions = []
    @thread = nil
    @mutex = Mutex.new
    Dir[@directory + 'notifications/*/subscription.xml'].each do |sub|
      key = ::File::basename(::File::dirname(sub))
      self.unserialize_event!(:cre,key)
    end
    unless ['stopped','ready'].include?(self.unserialize_data!)
      XML::Smart::modify(@directory + 'properties.xml') do |doc|
        doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }
        doc.find("/p:properties/p:state").first.text = 'stopped'
      end
    end
  end

  attr_reader :callbacks
  attr_reader :mutex

  def start # {{{
    @thread.join if !@thread.nil? && @thread.alive?
    unless @positions.empty?
      @instance.search(@positions)
    end
    @thread = @instance.start
  end # }}}

  def stop # {{{
    t = @instance.stop
    t.run
    @callbacks.delete_if{|k,c| c.callback(nil); true}
    @thread.join if !@thread.nil? && @thread.alive?
  end # }}}

  def serialize! # {{{
    XML::Smart::modify(@directory + 'properties.xml') do |doc|
      doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }
      
      node = doc.find("/p:properties/p:data-elements").first
      node.children.delete_all!
      @instance.data.each do |k,v|
        node.add(k.to_s,MultiJson::encode(v))
      end
      
      node = doc.find("/p:properties/p:endpoints").first
      node.children.delete_all!
      @instance.endpoints.each do |k,v|
        node.add(k.to_s,v)
      end
      
      node = doc.find("/p:properties/p:status/p:id").first
      node.text = @instance.status.id
      node = doc.find("/p:properties/p:status/p:message").first
      node.text = @instance.status.message

      node = doc.find("/p:properties/p:state").first
      node.text = @instance.state
    end 
  end # }}}
  def serialize_position! # {{{
    XML::Smart::modify(@directory + 'properties.xml') do |doc|
      doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }
      pos = doc.find("/p:properties/p:positions").first
      pos.children.delete_all!
      @positions = @instance.positions
      @instance.positions.each do |p|
        pos.add("#{p.position}",[p.detail,p.passthrough].compact.join(';'))
      end
    end
  end # }}}

  def unserialize_event!(op,key)# {{{
    case op
      when :del
        @communication.delete(key)
        @events.each do |eve,keys|
          keys.delete_if{|k,v| key == k}
        end  
        @votes.each do |eve,keys|
          keys.delete_if do |k,v|
            if key == k
              @callbacks.each{|voteid,cb|cb.delete_if!(eve,k)}
              true
            end  
          end
        end  
      when :upd 
        if File.exists?(@directory + 'notifications/' + key + '/subscription.xml')
          url = @communication[key]
          evs = []
          vos = []
          @events.each { |e,v| evs << e }
          @votes.each { |e,v| vos << e }
          XML::Smart::open(@directory + 'notifications/' + key + '/subscription.xml') do |doc|
            doc.namespaces = { 'n' => 'http://riddl.org/ns/common-patterns/notifications-producer/1.0' }
            turl = doc.find('string(/n:subscription/@url)') 
            url = turl == '' ? url : turl
            @communication[key] = url
            doc.find('/n:subscription/n:topic').each do |t|
              t.find('n:event').each do |e|
                @events["#{t.attributes['id']}/#{e}"] ||= {}
                @events["#{t.attributes['id']}/#{e}"][key] = url
                evs.delete("#{t.attributes['id']}/#{e}")
              end
              t.find('n:vote').each do |e|
                @votes["#{t.attributes['id']}/#{e}"] ||= {}
                @votes["#{t.attributes['id']}/#{e}"][key] = url
                vos.delete("#{t.attributes['id']}/#{e}")
              end
            end
          end
          evs.each { |e| @votes[e].delete(key) }
          vos.each do |e| 
            @callbacks.each{|voteid,cb|cb.delete_if!(e,key)}
            @votes[e].delete(key)
          end  
        end  
      when :cre
        XML::Smart::open(@directory + 'notifications/' + key + '/subscription.xml') do |doc|
          doc.namespaces = { 'n' => 'http://riddl.org/ns/common-patterns/notifications-producer/1.0' }
          turl = doc.find('string(/n:subscription/@url)') 
          url = turl == '' ? nil : turl
          @communication[key] = url
          doc.find('/n:subscription/n:topic').each do |t|
            t.find('n:event').each do |e|
              @events["#{t.attributes['id']}/#{e}"] ||= {}
              @events["#{t.attributes['id']}/#{e}"][key] = (url == "" ? nil : url)
            end
            t.find('n:vote').each do |e|
              @votes["#{t.attributes['id']}/#{e}"] ||= {}
              @votes["#{t.attributes['id']}/#{e}"][key] = url
            end
          end
        end  
    end    
  end # }}} 
  def unserialize_data! # {{{
    hw = nil
    state = nil

    XML::Smart::open(@directory + 'properties.xml') do |doc|
      doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }

      state = doc.find("string(/p:properties/p:state)")

      @instance.data.clear
      doc.find("/p:properties/p:data-elements/p:*").each do |e|
        ### when json decode fails, just use it as a string
        @instance.data[e.name.to_s.to_sym] = begin
          MultiJson.decode(e.text)
        rescue
          e.text
        end
      end

      @instance.endpoints.clear
      doc.find("/p:properties/p:endpoints/p:*").each do |e|
        @instance.endpoints[e.name.to_s.to_sym] = e.text
      end
      
      begin
        hw = eval(doc.find("string(/p:properties/p:handlerwrapper)"))
        @instance.handlerwrapper = hw
      rescue => e  
        @instance.handlerwrapper = DefaultHandlerWrapper
      end  

      @positions = []
      doc.find("/p:properties/p:positions/p:*").each do |e|
        val = e.text.split(';')
        @positions << ::Wee::Position.new(e.name.to_s.to_sym,val[0].to_sym,val[1])
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

    state
  end # }}}

  def notify(what,content={})# {{{
    item = @events[what]
    if item
      item.each do |ke,ur|
        Thread.new(ke,ur) do |key,url|
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
    end
  end # }}}

  def call_vote(what,content={})# {{{
    voteid = Digest::MD5.hexdigest(Kernel::rand().to_s)
    item = @votes[what]
    if item && item.length > 0
      continue = Wee::Continue.new
      @votes_results[voteid] = []
      inum = 0
      item.each do |key,url|
        if url.class == String
          inum += 1
        elsif url.class == Riddl::Utils::Notifications::Producer::WS
          inum += 1 unless url.closed?
        end  
      end

      item.each do |key,url|

        Thread.new(key,url,content.dup) do |k,u,c|
          callback = Digest::MD5.hexdigest(Kernel::rand().to_s)
          c['callback'] = callback
          notf = build_notification(k,what,c,'vote')
          if u.class == String
            client = Riddl::Client.new(u)
            params = notf.map{|ke,va|Riddl::Parameter::Simple.new(ke,va)}
            params << Riddl::Header.new("CPEE-Callback",callback)
            @mutex.synchronize do
              status, result, headers = client.post params
              if headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true'
                @callbacks[callback] = Callback.new("vote #{notf.find{|a,b| a == 'notification'}[1]}", self, :vote_callback, what, k, :http, continue, voteid, callback, inum)
              else
                vote_callback(result,continue,voteid,callback, inum)
              end
            end  
          elsif u.class == Riddl::Utils::Notifications::Producer::WS
            @callbacks[callback] = Callback.new("vote #{notf.find{|a,b| a == 'notification'}[1]}", self, :vote_callback, what, k, :ws, continue, voteid, callback, inum)
            e = XML::Smart::string("<vote/>")
            notf.each do |ke,va|
              e.root.add(ke,va)
            end
            u.send(e.to_s)
          end
        end

      end
      continue.wait

      !@votes_results.delete(voteid).include?(false)
    else  
      true
    end
  end # }}}

  def vote_callback(result,continue,voteid,callback,num)# {{{
    @callbacks.delete(callback)
    if result == :DELETE
      @votes_results[voteid] << true
    else
      @votes_results[voteid] << (result && result[0] && result[0].value == 'true')
    end  
    if (num == @votes_results[voteid].length)
      continue.continue
    end  
  end # }}}

  def add_ws(key,socket)# {{{
    @communication[key] = socket
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
  end # }}}

  def del_ws(key)# {{{
    @communication[key] = nil
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
  end # }}}

  def state
    @instance.state
  end  

private

  def build_notification(key,what,content,type)# {{{
    res = []
    res << ['key'         , key]
    res << ['topic'       , ::File::dirname(what)]
    res << [type          , ::File::basename(what)]
    res << ['notification', MultiJson.encode(content)]
    res << ['uid'         , Digest::MD5.hexdigest(Kernel::rand().to_s)]
    res << ['fp'          , Digest::MD5.hexdigest(res.join(''))]
    # TODO add secret to fp
  end # }}}

end
