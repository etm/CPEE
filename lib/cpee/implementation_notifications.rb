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
      end
    end #}}}

     class CreateSubscription < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
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
    end #}}}

    class UpdateSubscription < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        key = @r.last

        url = @p[0].name == 'url' ? @p.shift.value : nil
        while @p.length > 0
          topic = @p.shift.value
          base = @p.shift
          type = base.name
          values = base.value.split(',').map { |i| File.join(topic,type[0..-2],i) }
          CPEE::Persistence::set_handler(id,opts,key,url,values,true)
        end

        Riddl::Parameter::Simple.new('key',key)
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

        DeleteSubscription::set(id,opts,key)
        nil
      end
    end #}}}

    class SSE < Riddl::SSEImplementation #{{{
      def onopen
        @id = @a[0]
        @opts = @a[1]
        @key = @r[-2]
        @conn = Redis.new(path: @opts[:redis_path], db: @opts[:redis_db])
        EM.defer do
          @conn.subscribe("forward:#{@id}/#{@key}") do |on|
            on.message do |what, message|
              send message
            end
          end
        end
        EM.defer do
          until closed?
            send_with_id 'keepalive', 'true'
            sleep 10
          end
        end
      end

      def onclose
        @conn.close
        DeleteSubscription::set(@id,@opts,@key)
      end
    end #}}}

  end
end
