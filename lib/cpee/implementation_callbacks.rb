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
require_relative 'fail'

module CPEE
  module Callbacks

    def self::implementation(id,opts)
      Proc.new do
        if CPEE::Persistence::exists?(id,opts)
          run CPEE::Callbacks::Callbacks, id, opts if get
          on resource do
            run CPEE::Callbacks::GetCallback, id, opts if get
            run CPEE::Callbacks::DelCallback, id, opts if delete
            run CPEE::Callbacks::ExCallback, id, opts if put
          end
        else
          run CPEE::FAIL
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

        if CPEE::Persistence::is_member?(id,opts,'callbacks',callback)
          res = {}
          res[:uuid]     = CPEE::Persistence::extract_item(id,opts,"callback/#{callback}/uuid")
          res[:type]     = CPEE::Persistence::extract_item(id,opts,"callback/#{callback}/type")
          res[:position] = CPEE::Persistence::extract_item(id,opts,"callback/#{callback}/position")
          res[:label]    = CPEE::Persistence::extract_item(id,opts,"callback/#{callback}/label")
          if sub = CPEE::Persistence::extract_item(id,opts,"callback/#{callback}/subscription")
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

        if CPEE::Persistence::extract_item(id,opts,"callback/#{callback}/type") == 'callback'
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
        elsif CPEE::Persistence::extract_item(id,opts,"callback/#{callback}/type") == 'vote'
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

        if CPEE::Persistence::extract_item(id,opts,"callback/#{callback}/type") == 'callback'
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
        elsif CPEE::Persistence::extract_item(id,opts,"callback/#{callback}/type") == 'vote'
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
