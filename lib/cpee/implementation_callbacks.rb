require 'json'

module CPEE
  module Callbacks

    def self::implementation(id,opts)
      Proc.new do
        run CPEE::Callbacks::Callbacks, id, opts if get
        on resource do
          run CPEE::Callbacks::GetCallback, id, opts if get
          run CPEE::Callbacks::DelCallback, id, opts if delete
          run CPEE::Callbacks::ExCallback, id, opts if put
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
          CPEE::Persistence::extract_set(id,opts,'callbacks').each do |de|
            ret.root.add('callback', de[1], :id => de[0])
          end
          ret.to_s
        end
      end
    end # }}}

    class GetCallback < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        callback = @r[-1]

        if opts[:redis].sismember("instance:#{id}/callbacks",callback)
          res = {}
          res[:uuid] = opts[:redis].get("instance:#{id}/callback/#{callback}/uuid")
          res[:type] = opts[:redis].get("instance:#{id}/callback/#{callback}/type")
          res[:position] = opts[:redis].get("instance:#{id}/callback/#{callback}/position")
          res[:label] = opts[:redis].get("instance:#{id}/callback/#{callback}/label")
          if sub = opts[:redis].get("instance:#{id}/callback/#{callback}/subscription")
            res[:subscription] = sub
          end

          Riddl::Parameter::Complex.new("callback","application/json",JSON.generate(res))
        else
          @status = 404
        end
      end
    end #}}}

    class DelCallback < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        callback = @r[-1]

        if opts[:redis].get("instance:#{id}/callback/#{callback}/type") == 'callback'
          CPEE::Message::send(
            :'callback-end',
            callback,
            opts[:url],
            id,
            {},
            {},
            {},
            opts[:redis]
          )
        elsif opts[:redis].get("instance:#{id}/callback/#{callback}/type") == 'vote'
          CPEE::Message::send(
            :'vote-response',
            callback,
            opts[:url],
            id,
            {},
            {},
            'true',
            opts[:redis]
          )
        else
          @status = 404
        end
        nil
      end
    end #}}}

    class ExCallback < Riddl::Implementation #{{{
      def response
        id = @a[0]
        opts = @a[1]
        callback = @r[-1]

        if opts[:redis].get("instance:#{id}/callback/#{callback}/type") == 'callback'
          ret = {}
          ret['values'] = @p.map{ |e|
            [e.name, e.class == Riddl::Parameter::Simple ? [:simple,e.value] : [:complex,e.mimetype,e.value.path] ]
          }
          ret['headers'] =  @h

          CPEE::Message::send(
            :'callback-response',
            callback,
            opts[:url],
            id,
            {},
            {},
            ret,
            opts[:redis]
          )
        elsif opts[:redis].get("instance:#{id}/callback/#{callback}/type") == 'vote'
          if @p.length == 1 && @p[0].name == 'continue' && @p[0].class == Riddl::Parameter::Simple
            CPEE::Message::send(
              :'vote-response',
              callback,
              opts[:url],
              id,
              {},
              {},
              @p[0].value,
              opts[:redis]
            )
          else
            @status = 400
          end
        else
          @status = 503
        end
        nil
      end
    end #}}}

  end
end
