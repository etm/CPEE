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
  end

  attr_reader :callbacks

  def start# {{{
    unless @positions.empty?
      @instance.search(@positions)
    end
    @instance.start
  end# }}}

  def stop# {{{
    t = @instance.stop
    t.run
    @callbacks.delete_if{|k,c| c.callback(nil); true}
  end# }}}

  def position# {{{
    XML::Smart::modify(@directory + 'properties.xml') do |doc|
      doc.namespaces = { 'p' => 'http://riddl.org/ns/common-patterns/properties/1.0' }
      pos = doc.find("/p:properties/p:positions").first
      pos.children.delete_all!
      @positions = @instance.positions
      @instance.positions.each do |p|
        pos.add("#{p.position}",[p.detail,p.passthrough].compact.join(';'))
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
      
      node = doc.find("/p:properties/p:endpoints").first
      node.children.delete_all!
      @instance.endpoints.each do |k,v|
        node.add(k.to_s,v)
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
    voteid = Digest::MD5.hexdigest(rand(Time.now).to_s)
    continue = Wee::Continue.new
    item = @votes[what]
    if item
      @votes_results[voteid] = []
      inum = 0
      item.each do |key,url|
        if url.class == String
          inum += 1
        elsif url.class == Riddl::Utils::Notifications::Producer::WS
          inum += 1 unless url.closed?
        end  
      end
      puts "Inum: #{inum}"

      item.each do |key,url|

        Thread.new(key,url,content.dup) do |k,u,c|
          callback = Digest::MD5.hexdigest(rand(Time.now).to_s)
          c['callback'] = callback
          vo = build_notification(k,what,c,'vote')
          puts k
          if u.class == String
            client = Riddl::Client.new(u)
            params = vo.map{|k,v|Riddl::Parameter::Simple.new(k,v)}
            params << Riddl::Header.new("CPEE-Callback",callback)
            status, result, headers = client.post params

            if headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true'
              @callbacks[callback] = Callback.new("vote #{vo.find{|a,b| a == 'notification'}[1]}", self, :vote_callback, :http, continue, voteid, callback, inum)
            else
              vote_callback(result,continue,voteid,callback, inum)
            end
          elsif u.class == Riddl::Utils::Notifications::Producer::WS
            @callbacks[callback] = Callback.new("vote #{vo.find{|a,b| a == 'notification'}[1]}",self,:vote_callback,:ws,continue,voteid,callback,inum)
            e = XML::Smart::string("<vote/>")
            vo.each do |k,v|
              e.root.add(k,v)
            end
            u.send(e.to_s)
          end
        end

      end
      continue.wait

    end
    nil
  end# }}}

  def vote_callback(result,continue,voteid,callback,num)# {{{
    @callbacks.delete(callback)
    @votes_results[voteid] << (result && result[0] && result[0].value == 'true')
    if (num == @votes_results[voteid].length)
      stop if @votes_results[voteid].include?(false)
      @votes_results.delete(voteid)
      continue.continue
    end  
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

  def state
    @instance.state
  end  

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
