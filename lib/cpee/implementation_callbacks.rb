require 'json'

module CPEE
  module Callbacks

    def self::implementation(id,opts)
      Proc.new do
        run CPEE::Callbacks::Callbacks, id, opts if get
        on resource do
          run CPEE::Callbacks::ExCallback, id, opts if get || put || post || delete
        end
      end
    end

    class Callbacks < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        Riddl::Parameter::Complex.new("callbacks","text/xml") do
          ret = XML::Smart::string <<-END
            <callbacks/>
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

        ret = {}
        ret['values'] = @p.map do |e|
          # write complex in file
          [e.name, e.class == Riddl::Parameter::Simple ? [:simple,e.value] : [:complex,e.mimetype,'link to tmpfile'] ]
        end
        ret['headers'] =  @h

        CPEE::Message::send(
          :callback-response,
          callback,
          opts[:url],
          id,
          {},
          {},
          ret,
          opts[:redis]
        )
      end
    end #}}}

  end
end
