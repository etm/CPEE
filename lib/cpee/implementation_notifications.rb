require 'json'

module CPEE
  module Notifications

    def self::implementation(id,opts)
      Proc.new do
        on resource "notifications" do
          run CPEE::Notifications::Overview if get
          on resource "topics" do
            run CPEE::Notifications::Topics, opts if get
          end
          on resource "subscriptions" do
            run CPEE::Notifications::Subscriptions, id, opts if get
            run CPEE::Notifications::CreateSubscription, id, opts if post 'subscribe'
            on resource do
              run CPEE::Notifications::Subscription, id, opts if get
              run CPEE::Notifications::UpdateSubscription, id, opts if put 'subscribe'
              run CPEE::Notifications::DeleteSubscription, id, opts if delete
              on resource 'sse' do
                run CPEE::Notifications::SSE, id, opts if sse
              end
            end
          end
        end
      end
    end

    class Overview < Riddl::Implementation #{{{
      def response
        Riddl::Parameter::Complex.new("overview","text/xml") do
          <<-END
            <overview xmlns='http://riddl.org/ns/common-patterns/notifications-producer/2.0'>
              <topics/>
              <subscriptions/>
            </overview>
          END
        end

      end
    end #}}}

    class Topics < Riddl::Implementation #{{{
      def response
        opts = @a[0]
        Riddl::Parameter::Complex.new("overview","text/xml") do
          File.read(opts[:topics])
        end
      end
    end #}}}

    class Subscriptions < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Complex.new("subscriptions","text/xml") do
          ret = XML::Smart::string <<-END
            <subscriptions xmlns='http://riddl.org/ns/common-patterns/notifications-producer/2.0'/>
          END
          CPEE::Persistence::extract_handlers(id,opts).each do |de|
            ret.root.add('subscription').tap do |n|
              n.attributes['id'] = de[0]
              n.attributes['url'] = de[1] if de[1] && !de[1].empty?
            end
          end
          ret.to_s
        end
      end
    end #}}}

    class Subscription < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        key = @r[-1]
        if CPEE::Persistence::exists_handler?(id,opts,key)
          Riddl::Parameter::Complex.new("subscriptions","text/xml") do
            ret = XML::Smart::string <<-END
              <subscription xmlns='http://riddl.org/ns/common-patterns/notifications-producer/2.0'/>
            END
            url = CPEE::Persistence::extract_item(id,opts,File.join('handler',key,'url'))
            ret.root.attributes['url'] = url if url && !url.empty?
            items = {}
            CPEE::Persistence::extract_handler(id,opts,key).each do |h|
              t, i, v = h.split('/')
              items[t] ||= []
              items[t] << [i,v]
            end
            items.each do |k,v|
              ret.root.add('topic').tap do |n|
                n.attributes['id'] = k
                v.each do |e|
                  n.add *e
                end
              end
            end
            ret.to_s
          end
        else
          @status = 404
       end
      end
    end #}}}

     class CreateSubscription < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]

        if opts[:statemachine].readonly? id
          @status = 423
        else
          key = Digest::MD5.hexdigest(Kernel::rand().to_s)

          url = @p[0].name == 'url' ? @p.shift.value : nil
          values = []
          while @p.length > 0
            topic = @p.shift.value
            base = @p.shift
            type = base.name
            values += base.value.split(',').map { |i| File.join(topic,type[0..-2],i) }
          end
          @header = CPEE::Persistence::set_handler(id,opts,key,url,values)

          Riddl::Parameter::Simple.new('key',key)
        end
      end
    end #}}}

    class UpdateSubscription < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        key = @r.last

        if CPEE::Persistence::exists_handler?(id,opts,key)
          url = @p[0].name == 'url' ? @p.shift.value : nil
          values = []
          while @p.length > 0
            topic = @p.shift.value
            base = @p.shift
            type = base.name
            values += base.value.split(',').map { |i| File.join(topic,type[0..-2],i) }
          end
          @header = CPEE::Persistence::set_handler(id,opts,key,url,values,true)
        else
          @status = 404
        end
      end
    end #}}}

    class DeleteSubscription < Riddl::Implementation #{{{
      def self::set(id,opts,key)
        CPEE::Persistence::set_handler(id,opts,key,"",[],true)
      end

      def response
        id = @a[0]
        opts = @a[1]
        key = @r.last

        if CPEE::Persistence::exists_handler?(id,opts,key)
          DeleteSubscription::set(id,opts,key)
        else
          @status = 404
        end
        nil
      end
    end #}}}

    def self::sse_distributor(opts) #{{{
      conn = Redis.new(path: opts[:redis_path], db: opts[:redis_db])
      conn.psubscribe('forward:*','event:state/change') do |on|
        on.pmessage do |pat, what, message|
          if pat == 'forward:*'
            _, id, key = what.match(/forward(-end)?:([^\/]+)\/(.+)/).captures
            opts.dig(:sse_connections,id.to_i,key)&.send message
          elsif pat == 'event:state/change'
            mess = JSON.parse(message[message.index(' ')+1..-1])
            state = mess.dig('content','state')
            if state == 'finished' || state == 'abandoned'
              opts.dig(:sse_connections,mess.dig('instance').to_i)&.each do |key,sse|
                EM.add_timer(2) do # just to be sure that all messages arrived
                  sse.close
                end
              end
            end
          end
        end
      end
      conn.close
    end #}}}
    def self::sse_heartbeat(opts) #{{{
      opts.dig(:sse_connections).each do |id,keys|
        keys.each do |key,sse|
          sse.send_with_id('heartbeat', '42') unless sse&.closed?
        end
      end
    end #}}}
    class SSE < Riddl::SSEImplementation #{{{
      def onopen
        @opts = @a[1]
        @id = @a[0]
        @key = @r[-2]
        if !@opts[:statemachine].readonly?(@id) && CPEE::Persistence::exists_handler?(@id,@opts,@key)
          @opts[:sse_connections][@id] ||= {}
          @opts[:sse_connections][@id][@key] = self
          true
        else
          false
        end
      end

      def onclose
        @opts.dig(:sse_connections,@id)&.delete(@key)
        @opts.dig(:sse_connections)&.delete(@id) if @opts.dig(:sse_connections,@id)&.length == 0
        DeleteSubscription::set(@id,@opts,@key)
      end
    end #}}}

  end
end
