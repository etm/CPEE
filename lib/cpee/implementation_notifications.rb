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
              run CPEE::Notifications::UpdateSubscription, id, opts if put 'details'
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
        while @p.length > 0
          topic = @p.shift.value
          base = @p.shift
          type = base.name
          values = base.value.split(',').map { |i| File.join(topic,type[0..-2],i) }
          CPEE::Persistence::set_handler(id,opts,key,url,values)
        end

        Riddl::Parameter::Simple.new('key',key)
      end
    end #}}}

    class DeleteSubscription < Riddl::Implementation #{{{
      def response
        backend = @a[0]
        handler = @a[1]
        key     = @r.last

        backend.subscriptions[key].delete
        handler.key(key).delete unless handler.nil?
        return
      end
    end #}}}

    class UpdateSubscription < Riddl::Implementation #{{{
      def response
        backend = @a[0]
        handler = @a[1]
        key     = @r.last

        url  = @p[0].name == 'url' ? @p.shift.value : nil

        # TODO check if message is valid (with producer secret)
        unless backend.subscriptions[key]
          @status = 404
          return # subscription not found
        end

        topics = []
        backend.subscriptions[key].modify do |doc|
          if url.nil?
            doc.find('/n:subscription/@url').delete_all!
          else
            doc.root.attributes['url'] = url
          end
          doc.root.children.delete_all!
          while @p.length > 1
            topic = @p.shift.value
            base = @p.shift
            type = base.name
            items = base.value.split(',')
            t = if topics.include?(topic)
              doc.find("/n:subscription/n:topic[@id='#{topic}']").first
            else
              topics << topic
              doc.root.add('topic', :id => topic)
            end
            items.each do |i|
              t.add(type[0..-2], i)
            end
          end
        end

        handler.key(key).topics(topics).update unless handler.nil?
        nil
      end
    end #}}}

    class SSE < Riddl::WebSocketImplementation #{{{
      def onopen
        @backend = @a[0]
        @handler = @a[1]
        @key     = @r[-2]
        @handler.key(@key).ws_open(self) unless @handler.nil?
      end

      def onmessage(data)
        @handler.key(@key).ws_message(data) unless @handler.nil?
      end

      def onclose
        @handler.key(@key).ws_close() unless @handler.nil?
      end
    end #}}}

  end
end
