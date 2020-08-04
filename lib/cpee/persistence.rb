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

module CPEE

  module Persistence
    def self::set_list(id,opts,item,values,deleted=[]) #{{{
      ah = AttributesHelper.new
      attributes = Persistence::extract_list(id,opts,'attributes').to_h
      dataelements = Persistence::extract_list(id,opts,'dataelements').to_h
      endpoints = Persistence::extract_list(id,opts,'endpoints').to_h
      CPEE::Message::send(
        opts[:redis],
        File.join(item,'change'),
        id,
        {
          :instance_name => Persistence::extract_item(id,opts,'attributes/info'),
          :instance => id,
          :instance_uuid => Persistence::extract_item(id,opts,'attributes/uuid'),
          :changed => values.keys,
          :deleted => deleted,
          :values => values,
          :attributes => ah.translate(attributes,dataelements,endpoints),
          :timestamp => Time.now.xmlschema(3)
        }
      )
    end #}}}
    def self::extract_list(id,opts,item) #{{{
      opts[:redis].smembers("instance:#{id}/#{item}").map do |e|
        [e,opts[:redis].get("instance:#{id}/#{item}/#{e}")]
      end
    end #}}}

    def self::set_item(id,opts,item,value) #{{{
      content = {
        :instance_name => Persistence::extract_item(id,opts,'attributes/info'),
        :instance => id,
        :instance_uuid => Persistence::extract_item(id,opts,'attributes/uuid'),
        :timestamp => Time.now.xmlschema(3)
      }
      value.each do |k,v|
        content[k.to_sym] = v
      end
      CPEE::Message::send(
        opts[:redis],
        File.join(item,'change'),
        id,
        content
      )
    end #}}}
    def self::extract_item(id,opts,item) #{{{
      opts[:redis].get("instance:#{id}/#{item}")
    end #}}}

    def self::set_positions(id,opts,content) #{{{
      payload = {
        :instance_name => Persistence::extract_item(id,opts,'attributes/info'),
        :instance => id,
        :instance_uuid => Persistence::extract_item(id,opts,'attributes/uuid'),
        :timestamp => Time.now.xmlschema(3)
      }
      CPEE::Message::send(
        opts[:redis],
        'position/change',
        id,
        content
      )
    end #}}}

    def self::set_handler(id,opts,key,url,values,update=false) #{{{
      exis = opts[:redis].smembers("instance:#{id}/handler/#{key}")

      if update == false && exis.length > 0
        return 405
      end

      ah = AttributesHelper.new
      attributes = Persistence::extract_list(id,opts,'attributes').to_h
      dataelements = Persistence::extract_list(id,opts,'dataelements').to_h
      endpoints = Persistence::extract_list(id,opts,'endpoints').to_h

      deleted = exis - values

      CPEE::Message::send(
        opts[:redis],
        'handler/change',
        id,
        {
          :instance_name => Persistence::extract_item(id,opts,'attributes/info'),
          :instance => id,
          :instance_uuid => Persistence::extract_item(id,opts,'attributes/uuid'),
          :key => key,
          :url => url,
          :changed => values,
          :deleted => deleted,
          :attributes => ah.translate(attributes,dataelements,endpoints),
          :timestamp => Time.now.xmlschema(3)
        }
      )

      200
    end #}}}
    def self::extract_handler(id,opts,key) #{{{
      opts[:redis].smembers("instance:#{id}/handler/#{key}")
    end #}}}
    def self::extract_handlers(id,opts) #{{{
      opts[:redis].smembers("instance:#{id}/handler").map do |e|
        [e, opts[:redis].get("instance:#{id}/handler/#{e}/url")]
      end
    end #}}}
  end

end
