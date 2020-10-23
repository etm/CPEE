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
    def self::write_instance(id,opts) #{{{
      Dir.mkdir(File.join(opts[:instances],id.to_s)) rescue nil
      FileUtils.copy(opts[:backend_run],File.join(opts[:instances],id.to_s))
      dsl = CPEE::Persistence::extract_item(id,opts,'dsl')
      hw = CPEE::Persistence::extract_item(id,opts,'handlerwrapper')
      endpoints = CPEE::Persistence::extract_list(id,opts,'endpoints')
      dataelements = CPEE::Persistence::extract_list(id,opts,'dataelements')
      positions = CPEE::Persistence::extract_set(id,opts,'positions')
      positions.map! do |k, v|
        [ k, v, CPEE::Persistence::extract_item(id,opts,File.join('positions',k,'@passthrough')) ]
      end
      File.open(File.join(opts[:instances],id.to_s,opts[:backend_opts]),'w') do |f|
        YAML::dump({
          :host => opts[:host],
          :url => opts[:url],
          :redis_path => opts[:redis_path],
          :redis_db => opts[:redis_db],
          :global_handlerwrappers => opts[:global_handlerwrappers],
          :handlerwrappers => opts[:handlerwrappers]
        },f)
      end
      template = ERB.new(File.read(opts[:backend_template]), trim_mode: '-')
      res = template.result_with_hash(dsl: dsl, handlerwrapper: hw, dataelements: dataelements, endpoints: endpoints, positions: positions)
      File.write(File.join(opts[:instances],id.to_s,opts[:backend_instance]),res)
    end #}}}

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
          :values => values,
          :attributes => ah.translate(attributes,dataelements,endpoints),
        },
        opts[:redis]
      )
    end #}}}
    def self::extract_set(id,opts,item) #{{{
      opts[:redis].smembers("instance:#{id}/#{item}").map do |e|
        [e,opts[:redis].get("instance:#{id}/#{item}/#{e}")]
      end
    end #}}}
    def self::extract_list(id,opts,item) #{{{
      opts[:redis].zrange("instance:#{id}/#{item}",0,-1).map do |e|
        [e,opts[:redis].get("instance:#{id}/#{item}/#{e}")]
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
        opts[:redis]
      )
    end #}}}
    def self::extract_item(id,opts,item) #{{{
      opts[:redis].get("instance:#{id}/#{item}")
    end #}}}

    def self::set_handler(id,opts,key,url,values,update=false) #{{{
      exis = opts[:redis].smembers("instance:#{id}/handlers/#{key}")

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
        opts[:redis]
      )

      200
    end #}}}
    def self::extract_handler(id,opts,key) #{{{
      opts[:redis].smembers("instance:#{id}/handlers/#{key}")
    end #}}}
    def self::exists_handler?(id,opts,key) #{{{
      opts[:redis].exists?("instance:#{id}/handlers/#{key}")
    end #}}}
    def self::extract_handlers(id,opts) #{{{
      opts[:redis].smembers("instance:#{id}/handlers").map do |e|
        [e, opts[:redis].get("instance:#{id}/handlers/#{e}/url")]
      end
    end #}}}
  end

end
