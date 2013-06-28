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
require ::File.dirname(__FILE__) + '/handler_properties'
require ::File.dirname(__FILE__) + '/handler_notifications'
require ::File.dirname(__FILE__) + '/callback'
require ::File.dirname(__FILE__) + '/empty_workflow'

module CPEE

  class ValueHelper
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
  end


  class Controller

    def initialize(id,opts)
      @directory = opts[:instances] + "/#{id}/"
      @id = id
      @events = {}
      @votes = {}
      @votes_results = {}
      @communication = {}
      @callbacks = {}
      @instance = EmptyWorkflow.new(self,opts[:url])
      @positions = []
      @thread = nil
      @mutex = Mutex.new

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
        @directory + '/notifications/'
      )

      @notifications.subscriptions.keys.each do |key|
        self.unserialize_notifications!(:cre,key)
      end
      unless ['stopped','ready','finished'].include?(@properties.data.find("string(/p:properties/p:state)"))
        @properties.modify do |doc|
          doc.find("/p:properties/p:state").first.text = 'stopped'
        end  
      end
      unserialize_handlerwrapper!
      unserialize_dataelements!
      unserialize_endpoints!
      unserialize_dsl!
      unserialize_positions!
    end

    attr_reader :id
    attr_reader :properties
    attr_reader :notifications
    attr_reader :callbacks
    attr_reader :mutex
    
    def start # {{{
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
          c.callback(nil)
          true
        else  
          false
        end
      end  
      @thread.join if !@thread.nil? && @thread.alive?
      @callback = [] # everything should be empty now
    end # }}}

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
      @properties.activate_schema(:inactive) if @instance.state == :stopped
      @properties.activate_schema(:active)   if @instance.state == :running || @instance.state == :stopping
      if [:finished, :stopped].include?(@instance.state)
        @properties.modify do |doc|
          node = doc.find("/p:properties/p:state").first
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
            @notifications.subscriptions[key].view do |doc|
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
          @notifications.subscriptions[key].view do |doc|
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
      state = @properties.data.find("string(/p:properties/p:state)")
      if call_vote("properties/state/change", :instance => @id, :newstate => state)
        case state
          when 'stopping'
            stop
          when 'running'
            start
          when 'simulating'  
            sim
        end
      else
        if node = @properties.data.find("/p:properties/p:state").first
          case state
            when 'stopping'; node.text = 'running'
            when 'running'; node.text = 'stopped'
          end
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
      @properties.modify do |doc|
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
      @instance.description = dsl.text
    end #}}}

    def notify(what,content={})# {{{
      item = @events[what]
      if item
        item.each do |ke,ur|
          Thread.new(ke,ur) do |key,url|
            ev = build_notification(key,what,content,'event')
            if url.class == String
              client = Riddl::Client.new(url)
              client.post ev.map{|k,v|Riddl::Parameter::Simple.new(k,v)} rescue nil
            elsif url.class == Riddl::Utils::Notifications::Producer::WS
              e = XML::Smart::string("<event/>")
              ev.each do |k,v|
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

  private

    def build_notification(key,what,content,type)# {{{
      res = []
      res << ['key'         , key]
      res << ['topic'       , ::File::dirname(what)]
      res << [type          , ::File::basename(what)]
      res << ['notification', ValueHelper::generate(content)]
      res << ['uid'         , Digest::MD5.hexdigest(Kernel::rand().to_s)]
      res << ['fp'          , Digest::MD5.hexdigest(res.join(''))]
      # TODO add secret to fp
    end # }}}

  end

end  
