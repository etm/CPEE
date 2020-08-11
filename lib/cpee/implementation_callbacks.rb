require 'json'

module CPEE
  module Callbacks

    def self::implementation(id,opts)
      Proc.new do
        run CPEE::Callbacks, opts if get
        on resource do
          run CPEE::ExCallback, opts if get || put || post || delete
        end
      end
    end

    class ExCallback < Riddl::Implementation #{{{
      def response
        controller = @a[0]
        id = @r[0].to_i
        callback = @r[2]
        controller[id].mutex.synchronize do
          if controller[id].callbacks.has_key?(callback)
            controller[id].callbacks[callback].callback(@p,@h)
          else
            @status = 503
          end
        end
      end
    end #}}}

    class Callbacks < Riddl::Implementation #{{{
      def response
        controller = @a[0]
        opts = @a[1]
        id = @r[0].to_i
        unless controller[id]
          @status = 404
          return
        end
        Riddl::Parameter::Complex.new("info","text/xml") do
          cb = XML::Smart::string("<callbacks details='#{opts[:mode]}'/>")
          if opts[:mode] == :debug
            controller[id].callbacks.each do |k,v|
              cb.root.add("callback",{"id" => k},"[#{v.protocol.to_s}] #{v.info}")
            end
          end
          cb.to_s
        end
      end
    end #}}}

  end
end
