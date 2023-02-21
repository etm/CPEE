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
    OBJ = 'instance'

    def self::set_list(id,opts,item,values,deleted=[]) #{{{
      ah = AttributesHelper.new
      attributes = Persistence::extract_list(id,opts,'attributes').to_h
      dataelements = Persistence::extract_list(id,opts,'dataelements').to_h
      endpoints = Persistence::extract_list(id,opts,'endpoints').to_h
      CPEE::Message::send(
        :event,
        File.join(item,'change'),
        opts[:url],
        id,
        Persistence::extract_item(id,opts,'attributes/uuid'),
        Persistence::extract_item(id,opts,'attributes/info'),
        {
          :changed => values.keys,
          :deleted => deleted,
          :values => values.transform_values{|val| JSON::parse(val) rescue val },
          :attributes => ah.translate(attributes,dataelements,endpoints),
        },
        opts[:redis],
        opts[:workers]
      )
    end #}}}
    def self::extract_set(id,opts,item) #{{{
      opts[:redis].smembers(OBJ + ":#{id}/#{item}").map do |e|
        [e,opts[:redis].get(OBJ + ":#{id}/#{item}/#{e}")]
      end
    end #}}}
    def self::extract_list(id,opts,item) #{{{
      opts[:redis].zrange(OBJ + ":#{id}/#{item}",0,-1).map do |e|
        [e,opts[:redis].get(OBJ + ":#{id}/#{item}/#{e}")]
      end
    end #}}}

    def self::set_item(id,opts,item,value) #{{{
      CPEE::Message::send(
        :event,
        File.join(item,'change'),
        opts[:url],
        id,
        Persistence::extract_item(id,opts,'attributes/uuid'),
        Persistence::extract_item(id,opts,'attributes/info'),
        value,
        opts[:redis],
        opts[:workers]
      )
    end #}}}
    def self::extract_item(id,opts,item) #{{{
      opts[:redis].get(OBJ + ":#{id}/#{item}")
    end #}}}

    def self::exists?(id,opts) #{{{
      opts[:redis].exists?(OBJ + ":#{id}/state")
    end #}}}
    def self::is_member?(id,opts,item,value) #{{{
      opts[:redis].sismember(OBJ + ":#{id}/#{item}",value)
    end  #}}}

    def self::each_object(opts)
      opts[:redis].zrevrange(OBJ + 's',0,-1).each do |instance|
        yield instance
      end
    end

    def self::new_object(opts)
      opts[:redis].zrevrange(OBJ + 's', 0, 0).first.to_i + 1
    end

    def self::keys(id,opts,item=nil)
      opts[:redis].keys(File.join(OBJ + ":#{id}",item.to_s,'*'))
    end

    def self::set_handler(id,opts,key,url,values,update=false) #{{{
      exis = opts[:redis].smembers(OBJ + ":#{id}/handlers/#{key}")

      if update == false && exis.length > 0
        return 405
      end

      ah = AttributesHelper.new
      attributes = Persistence::extract_list(id,opts,'attributes').to_h
      dataelements = Persistence::extract_list(id,opts,'dataelements').to_h
      endpoints = Persistence::extract_list(id,opts,'endpoints').to_h

      deleted = exis - values

      CPEE::Message::send(
        :event,
        'handler/change',
        opts[:url],
        id,
        Persistence::extract_item(id,opts,'attributes/uuid'),
        Persistence::extract_item(id,opts,'attributes/info'),
        {
          :key => key,
          :url => url,
          :changed => values,
          :deleted => deleted,
          :attributes => ah.translate(attributes,dataelements,endpoints),
        },
        opts[:redis],
        opts[:workers]
      )

      200
    end #}}}
    def self::extract_handler(id,opts,key) #{{{
      opts[:redis].smembers(OBJ + ":#{id}/handlers/#{key}")
    end #}}}
    def self::exists_handler?(id,opts,key) #{{{
      opts[:redis].exists?(OBJ + ":#{id}/handlers/#{key}")
    end #}}}
    def self::extract_handlers(id,opts) #{{{
      opts[:redis].smembers(OBJ + ":#{id}/handlers").map do |e|
        [e, opts[:redis].get(OBJ + ":#{id}/handlers/#{e}/url")]
      end
    end #}}}
  end

end
