require 'json'

module CPEE
  module Callbacks

    def self::implementation(id,opts)
      Proc.new do
        run CPEE::Callbacks, id, opts if get
        on resource do
          run CPEE::ExCallback, id, opts if get || put || post || delete
        end
      end
    end

    class Callbacks < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Complex.new("callbacks","text/xml") do
          ret = XML::Smart::string <<-END
            <subscriptions xmlns='http://riddl.org/ns/common-patterns/notifications-producer/2.0'/>
          END
          CPEE::Persistence::extract_list(id,opts,'callbacks').each do |de|
            ret.root.add('callback', de[1], :id => de[0])
          end
          ret.to_s
        end
      end
    end #}}}

    class ExCallback < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        callback = @r[-1]

        {
          'options' => {},
          'values' ={},

        @p.map do 'e'
          # write complex in file
          [e.name, e.class == Riddl::Parameter::Simple ? [:simple,e.value] : [:complex,e.mimetype,'link to tmpfile'] ]


        CPEE::Message::send(
          :callback,
          File.join('activity','callback''),
          opts[:url],
          id,
          {},
          {},
          @p.map,
          opts[:redis]
        )
      end
    end #}}}

  end
end
