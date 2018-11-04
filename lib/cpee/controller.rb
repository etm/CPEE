# This file is part of CPEE.
#
# CPEE is free software: you can redistribute it and/or modify it under the terms
# of the GNU General Public License as published by the Free Software Foundation,
# either version 3 of the License, or (at your option) any later version.
#
# CPEE is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
# PARTICULAR PURPOSE.  See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along with
# CPEE (file COPYING in the main directory).  If not, see
# <http://www.gnu.org/licenses/>.

require 'json'
require 'pp'
require 'securerandom'
require ::File.dirname(__FILE__) + '/handler_properties'
require ::File.dirname(__FILE__) + '/handler_notifications'
require ::File.dirname(__FILE__) + '/callback'
require ::File.dirname(__FILE__) + '/empty_workflow'

module CPEE

  class ValueHelper #{{{
    def self::generate(value)
      if [String, Integer, Float, TrueClass, FalseClass, Date].include? value.class
        value.to_s
      elsif  [Hash, Array].include? value.class
        JSON::generate(value)
      elsif value.respond_to?(:to_s)
        value.to_s
      end
    end

    def self::parse(value)
      case value.downcase
        when 'true'
          true
        when 'false'
          false
        when 'nil', 'null'
          nil
        else
          begin
            JSON::parse(value)
          rescue
            (Integer value rescue nil) || (Float value rescue nil) || value.to_s rescue nil || ''
          end
      end
    end
  end #}}}

  class AttributesHelper #{{{
    def translate(__attributes__,__dataelements__,__endpoints__)
      @data       = WEEL::ReadHash.new(__dataelements__)
      @endpoints  = WEEL::ReadHash.new(__endpoints__)
      @attributes = WEEL::ReadHash.new(__attributes__)
      __attributes__.transform_values do |v|
        v.gsub(/(!(attributes|data|endpoints)\.[\w_]+)/) do |m|
          eval(m[1..-1])
        end
      end
    end

    def data
      @data
    end

    def endpoints
      @endpoints
    end

    def attributes
      @attributes
    end
  end #}}}

  class Controller

    def initialize(id,opts)
      @directory = opts[:instances] + "/#{id}/"
      @id = id
      @events = {}
      @votes = {}
      @votes_results = {}
      @communication = {}
      @callbacks = {}
      @positions = []
      @attributes = {}
      @attributes_helper = AttributesHelper.new
      @thread = nil
      @mutex = Mutex.new
      @opts = opts

      @properties = Riddl::Utils::Properties::Backend.new(
        {
          :inactive => opts[:properties_schema_inactive],
          :active   => opts[:properties_schema_active],
          :finished => opts[:properties_schema_finished]
        },
        @directory + '/properties.xml',
        opts[:properties_init]
      )
      @notifications =  Riddl::Utils::Notifications::Producer::Backend.new(
        opts[:topics],
        @directory + '/notifications/',
        opts[:notifications_init]
      )
      unless ['stopped','ready','finished'].include?(@properties.data.find("string(/p:properties/p:state)"))
        @properties.modify do |doc|
          doc.find("/p:properties/p:state").first.text = 'stopped'
        end
      end
      @uuid = sync_uuid!
      if @properties.data.find("string(/p:properties/p:state)") == "finished"
        @instance = nil
      else
        @instance = EmptyWorkflow.new(self)

        @notifications.subscriptions.keys.each do |key|
          self.unserialize_notifications!(:cre,key)
        end

        unserialize_handlerwrapper!
        unserialize_dataelements!
        unserialize_endpoints!
        unserialize_dsl!
        unserialize_positions!
        unserialize_attributes!
      end
    end

    def help
      "\033[1m\033[31mpm or public_methods(false)\033[0m\033[0m\n  Methods.\n" +
      "\033[1m\033[31miv or instance_variables\033[0m\033[0m\n  Attributes.\n" +
      "\033[1m\033[31mgc or GC.stat\033[0m\033[0m\n  GC stats to look for memleaks. Google for 'GC.stat ruby'.\n"
    end
    def pm
      public_methods(false)
    end
    def iv
      instance_variables
    end
    def gc
      x = GC.stat
      y = {}
      y[:heap_live_slots]         = x[:heap_live_slots]
      y[:total_allocated_objects] = x[:total_allocated_objects]
      y[:total_freed_objects]     = x[:total_freed_objects]
      y
    end

    attr_reader :id
    attr_reader :properties
    attr_reader :notifications
    attr_reader :callbacks
    attr_reader :mutex
    attr_reader :attributes
    attr_reader :uuid

    def console(cmd)
      x = eval(cmd)
      x.class == String ? x : x.pretty_inspect
    end

    def attributes_translated
      @attributes_helper.translate(attributes,dataelements,endpoints)
    end

    def host
      @opts[:host]
    end
    def base_url
      @opts[:url]
    end
    def instance_url
      File.join(@opts[:url].to_s,@id.to_s)
    end
    def base
      base_url
    end
    def instance
      instance_url
    end
    def endpoints
      @instance.endpoints
    end
    def dataelements
      @instance.data
    end

    def sim # {{{
      @thread.join if !@thread.nil? && @thread.alive?
      @thread = @instance.sim
    end # }}}

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
      @callbacks.delete_if do |k,c|
        # only remove vote_callbacks, the other stuff is removed by
        # the instance stopping cleanup
        if c.method == :vote_callback
          c.callback
          true
        else
          false
        end
      end
      @thread.join if !@thread.nil? && @thread.alive?
      @callback = [] # everything should be empty now
    end # }}}

    def info
      @properties.data.find("string(/p:properties/p:attributes/p:info)")
    end

    def finalize_if_finished
      if @instance.state == :finished
        #@instance = nil
      end
    end

    def serialize_dataelements! #{{{
      @properties.modify do |doc|
        node = doc.find("/p:properties/p:dataelements").first
        node.children.delete_all!
        @instance.data.each do |k,v|
          node.add(k.to_s,ValueHelper::generate(v))
        end
      end
    end #}}}
    def serialize_endpoints! #{{{
      @properties.modify do |doc|
        node = doc.find("/p:properties/p:endpoints").first
        node.children.delete_all!
        @instance.endpoints.each do |k,v|
          node.add(k.to_s,v)
        end
      end
    end #}}}
    def serialize_state! # {{{
      @properties.activate_schema(:finished) if @instance.state == :finished
      @properties.activate_schema(:inactive) if @instance.state == :stopped || @instance.state == :ready
      @properties.activate_schema(:active)   if @instance.state == :running || @instance.state == :simulating
      if [:finished, :stopped, :ready].include?(@instance.state)
        @properties.modify do |doc|
          node = doc.find("/p:properties/p:state").first
          node.attributes['changed'] = Time.now.xmlschema
          node.text = @instance.state
        end
      end
    end # }}}
    def serialize_positions! # {{{
      @properties.modify do |doc|
        pos = doc.find("/p:properties/p:positions").first
        pos.children.delete_all!
        @positions = @instance.positions
        @instance.positions.each do |p|
          pos.add("#{p.position}",[p.detail,p.passthrough].compact.join(';'))
        end
      end
    end # }}}
    def serialize_status! #{{{
      @properties.modify do |doc|
        node = doc.find("/p:properties/p:status/p:id").first
        node.text = @instance.status.id
        node = doc.find("/p:properties/p:status/p:message").first
        node.text = @instance.status.message
      end
    end #}}}

    def unserialize_notifications!(op,key)# {{{
      case op
        when :del
          @notifications.subscriptions[key].delete if @notifications.subscriptions.include?(key)

          @communication[key].io.close_connection if @communication[key].class == Riddl::Utils::Notifications::Producer::WS
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
          if @notifications.subscriptions.include?(key)
            url = @communication[key]
            evs = []
            vos = []
            @events.each { |e,v| evs << e }
            @votes.each { |e,v| vos << e }
            @notifications.subscriptions[key].read do |doc|
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
            evs.each { |e| @events[e].delete(key) if @events[e] }
            vos.each do |e|
              @callbacks.each{|voteid,cb|cb.delete_if!(e,key)}
              @votes[e].delete(key) if @votes[e]
            end
          end
        when :cre
          @notifications.subscriptions[key].read do |doc|
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

    def unserialize_attributes! #{{{
      @attributes = {}
      @properties.data.find("/p:properties/p:attributes/p:*").map do |ele|
        @attributes[ele.qname.name.to_sym] = ele.text
      end
      uuid = @properties.data.find("/p:properties/p:attributes/p:uuid")
      if uuid.empty? || uuid.length != 1 || @properties.data.find("/p:properties/p:attributes/p:uuid[.=\"#{@uuid}\"]").empty?
        @properties.modify do |doc|
          attr = doc.find("/p:properties/p:attributes").first
          attr.find('p:uuid').delete_all!
          attr.prepend('uuid',@uuid)
        end
      end
    end #}}}
    def unserialize_dataelements! #{{{
      @instance.data.clear
      @properties.data.find("/p:properties/p:dataelements/p:*").each do |e|
        @instance.data[e.qname.to_sym] = ValueHelper::parse(e.text)
      end
    end #}}}
    def unserialize_endpoints! #{{{
      @instance.endpoints.clear
      @properties.data.find("/p:properties/p:endpoints/p:*").each do |e|
        @instance.endpoints[e.qname.to_sym] = e.text
      end
    end #}}}
    def unserialize_state! #{{{
      state = 'ready'
      @properties.modify do |doc|
        node = doc.find("/p:properties/p:state").first
        node.attributes['changed'] = Time.now.xmlschema
        state = node.text
      end
      if call_vote("state/change", :instance => @id, :info => info, :state => state)
        case state
          when 'stopping'
            stop
          when 'running'
            start
          when 'simulating'
            sim
          when 'ready'
            @instance.state_signal
        end
      else
        if node = @properties.data.find("/p:properties/p:state").first
          node.text = @instance.state_signal
        end
      end
    end #}}}
    def unserialize_handlerwrapper! #{{{
      hw = nil
      begin
        hw = eval(@properties.data.find("string(/p:properties/p:handlerwrapper)"))
        @instance.handlerwrapper = hw
      rescue => e
        @instance.handlerwrapper = DefaultHandlerWrapper
      end
      if hw != @instance.handlerwrapper
        @properties.modify do |doc|
          node = doc.find("/p:properties/p:handlerwrapper").first
          node.text = @instance.handlerwrapper.to_s
        end
      end
    end #}}}
    def unserialize_positions! #{{{
      @positions = []
      @properties.data.find("/p:properties/p:positions/p:*").each do |e|
        val = e.text.split(';')
        @positions << ::WEEL::Position.new(e.qname.to_s.to_sym,val[0].to_sym,val[1])
      end
    end #}}}
    def unserialize_dsl! #{{{
      @instance.description = @properties.data.find("string(/p:properties/p:dsl)")
    end #}}}
    def unserialize_description! #{{{
      dsl = nil
      nots = []
      @properties.modify do |doc|
        begin
          dsl   = doc.find("/p:properties/p:dsl").first
          dslx  = doc.find("/p:properties/p:dslx").first
          desc  = doc.find("/p:properties/p:description").first
          tdesc = doc.find("/p:properties/p:transformation/p:description").first
          tdata = doc.find("/p:properties/p:transformation/p:dataelements").first
          tendp = doc.find("/p:properties/p:transformation/p:endpoints").first

          tdesctype = tdesc.attributes['type']
          tdatatype = tdata.attributes['type']
          tendptype = tendp.attributes['type']

          if desc.children.empty?
            tdesctype = tdatatype = tendptype = 'clean'
          end

          ### description transformation, including dslx to dsl
          addit = if tdesctype == 'copy' || tdesc.empty?
            desc.children.first.to_doc.root
          elsif tdesctype == 'rest' && !tdesc.empty?
            srv = Riddl::Client.interface(tdesc.text,@opts[:transformation_service])
            status, res = srv.post [
              Riddl::Parameter::Complex.new("description","text/xml",desc.children.first.dump),
              Riddl::Parameter::Simple.new("type","description")
            ]
            if status >= 200 && status < 300
              XML::Smart::string(res[0].value.read).root
            else
              raise 'Could not extract dslx'
            end
          elsif tdesctype == 'xslt' && !tdesc.empty?
            trans = XML::Smart::open_unprotected(tdesc.text)
            desc.children.first.to_doc.transform_with(trans).root
          elsif tdesctype == 'clean'
            XML::Smart::open_unprotected(@opts[:empty_dslx]).root
          else
            nil
          end
          unless addit.nil?
            dslx.children.delete_all!
            dslx.add addit
            trans = XML::Smart::open_unprotected(@opts[:transformation_dslx])
            dsl.text = dslx.to_doc.transform_with(trans)
            @instance.description = dsl.text
          end

          ### dataelements extraction
          addit = if tdatatype == 'rest' && !tdata.empty?
            srv = Riddl::Client.interface(tdata.text,@opts[:transformation_service])
            status, res = srv.post [
              Riddl::Parameter::Complex.new("description","text/xml",desc.children.first.dump),
              Riddl::Parameter::Simple.new("type","dataelements")
            ]
            if status >= 200 && status < 300
              res
            else
              raise 'Could not extract dataelements'
            end
          elsif tdatatype == 'xslt' && !tdata.empty?
            trans = XML::Smart::open_unprotected(tdata.text)
            desc.children.first.to_doc.transform_with(trans)
          elsif tdatatype == 'clean'
            []
          else
            nil
          end
          unless addit.nil?
            node = doc.find("/p:properties/p:dataelements").first
            node.children.delete_all!
            @instance.data.clear
            addit.each_slice(2).each do |k,v|
              @instance.data[k.value.to_sym] = ValueHelper::parse(v.value)
              node.add(k.value,ValueHelper::generate(v.value))
            end
            nots << ["dataelements/change", {:instance => instance, :changed => JSON::generate(@instance.data)}]
          end

          ### endpoints extraction
          addit = if tendptype == 'rest' && !tdata.empty?
            srv = Riddl::Client.interface(tendp.text,@opts[:transformation_service])
            status, res = srv.post [
              Riddl::Parameter::Complex.new("description","text/xml",desc.children.first.dump),
              Riddl::Parameter::Simple.new("type","endpoints")
            ]
            if status >= 200 && status < 300
              res
            else
              raise 'Could not extract endpoints'
            end
          elsif tendptype == 'xslt' && !tdata.empty?
            trans = XML::Smart::open_unprotected(tendp.text)
            desc.children.first.to_doc.transform_with(trans)
          elsif tendptype == 'clean'
            []
          else
            nil
          end
          unless addit.nil?
            node = doc.find("/p:properties/p:endpoints").first
            node.children.delete_all!
            @instance.endpoints.clear
            addit.each_slice(2).each do |k,v|
              @instance.endpoints[k.value.to_sym] = ValueHelper::parse(v.value)
              node.add(k.value,ValueHelper::generate(v.value))
            end
            nots << ["endpoints/change", {:instance => instance, :changed => JSON::generate(@instance.endpoints)}]
          end
          nots << ["description/change", { :instance => instance }]
        rescue => err
          nots << ["description/error", { :instance => instance, :message => err.message }]
        end
      end
      nots
    end #}}}

    def sync_uuid! #{{{
      val = SecureRandom.uuid
      uuid = @properties.data.find("/p:properties/p:attributes/p:uuid")
      if uuid.empty?
        @properties.modify { |doc| doc.find("/p:properties/p:attributes").first.prepend('p:uuid',val) }
        val
      else
        uuid.first.text
      end
    end #}}}

    def notify(what,content={})# {{{
      item = @events[what]

      if item
        item.each do |ke,ur|
          Thread.new(ke,ur) do |key,url|
            notf = build_notification(key,what,content,'event')
            if url.class == String
              client = Riddl::Client.new(url,'http://riddl.org/ns/common-patterns/notifications-consumer/1.0/consumer.xml')
              params = notf.map{|ke,va|Riddl::Parameter::Simple.new(ke,va)}
              params << Riddl::Header.new("CPEE-BASE",self.base)
              params << Riddl::Header.new("CPEE-INSTANCE",self.instance)
              client.post params
            elsif url.class == Riddl::Utils::Notifications::Producer::WS
              e = XML::Smart::string("<event/>")
              notf.each do |k,v|
                e.root.add(k,v)
              end
              url.send(e.to_s) rescue nil
            end
          end
        end
      end
    end # }}}

    def call_vote(what,content={})# {{{
      voteid = Digest::MD5.hexdigest(Kernel::rand().to_s)
      item = @votes[what]
      if item && item.length > 0
        continue = WEEL::Continue.new
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
            notf = build_notification(k,what,c,'vote',callback)
            if u.class == String
              client = Riddl::Client.new(u,'http://riddl.org/ns/common-patterns/notifications-consumer/1.0/consumer.xml')
              params = notf.map{|ke,va|Riddl::Parameter::Simple.new(ke,va)}
              params << Riddl::Header.new("CPEE-BASE",self.base_url)
              params << Riddl::Header.new("CPEE-INSTANCE",self.instance_url)
              params << Riddl::Header.new("CPEE-CALLBACK",self.instance_url + '/callbacks/' + callback)
              @mutex.synchronize do
                status, result, headers = client.post params
                if headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true'
                  @callbacks[callback] = Callback.new("vote #{notf.find{|a,b| a == 'notification'}[1]}", self, :vote_callback, what, k, :http, continue, voteid, callback, inum)
                else
                  vote_callback(result,nil,continue,voteid,callback,inum)
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

    def vote_callback(result,options,continue,voteid,callback,num)# {{{
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

    def add_websocket(key,socket)# {{{
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

  private

    def build_notification(key,what,content,type,callback=nil)# {{{
      res = []
      res << ['key'                             , key]
      res << ['topic'                           , ::File::dirname(what)]
      res << [type                              , ::File::basename(what)]
      res << ['notification'                    , ValueHelper::generate(content)]
      res << ['callback'                        , callback] unless callback.nil?
      res << ['fingerprint-with-consumer-secret', Digest::MD5.hexdigest(res.join(''))]
      # TODO add secret to fp
    end # }}}

  end

end
