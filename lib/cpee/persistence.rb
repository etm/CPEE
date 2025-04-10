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

require_relative 'attributes_helper'
require_relative 'message'

module CPEE

  module Persistence
    @@obj = 'instance'
    def self::obj #{{{
      @@obj
    end #}}}
    def self::obj=(it) #{{{
      @@obj = it
    end #}}}

    def self::wait(opts)
      CPEE::Message::wait(opts[:redis],opts[:redis_dyn].call('Temporary Storage Transaction Subscriber'))
    end

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
        opts[:redis]
      )
    end #}}}
    def self::extract_set(id,opts,item) #{{{
      opts[:redis].smembers(@@obj + ":#{id}/#{item}").map do |e|
        [e,opts[:redis].get(@@obj + ":#{id}/#{item}/#{e}")]
      end
    end #}}}
    def self::extract_list(id,opts,item) #{{{
      opts[:redis].zrange(@@obj + ":#{id}/#{item}",0,-1).map do |e|
        [e,opts[:redis].get(@@obj + ":#{id}/#{item}/#{e}")]
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
      opts[:redis].get(@@obj + ":#{id}/#{item}")
    end #}}}

    def self::exists?(id,opts) #{{{
      opts[:redis].exists?(@@obj + ":#{id}/state")
    end #}}}
    def self::is_member?(id,opts,item,value) #{{{
      opts[:redis].sismember(@@obj + ":#{id}/#{item}",value)
    end  #}}}

    def self::each_object(opts)
      opts[:redis].zrevrange(@@obj + 's',0,-1).each do |instance|
        yield instance
      end
    end

    def self::new_object(opts)
      id = opts[:redis].zrevrange(@@obj + 's', 0, 0).first.to_i + 1
      opts[:redis].zadd(@@obj + 's',id,id)
      id
    end
    def self::new_static_object(id,opts)
      opts[:redis].set(File.join(@@obj + ":#{id}",'state'),'')
      nil
    end
    def self::new_object(opts)
      id = opts[:redis].zrevrange(@@obj + 's', 0, 0).first.to_i + 1
      opts[:redis].zadd(@@obj + 's',id,id)
      id
    end

    def self::keys_extract_zset(opts,id,item)
      path = @@obj + ":#{id}/#{item}"
      opts[:redis].zrange(path,0,-1).map do |e|
        File.join(path,e)
      end
    end
    def self::keys_extract_set(opts,id,item)
      path = @@obj + ":#{id}/#{item}"
      opts[:redis].smembers(path).map do |e|
        File.join(path,e)
      end
    end
    def self::keys_extract_set_raw(opts,path)
      opts[:redis].smembers(path).map do |e|
        File.join(File.dirname(path),e)
      end
    end
    def self::keys_extract_name(opts,id,*item)
      [@@obj + ":#{id}/#{File.join(*item)}"]
    end

    def self::keys(id,opts)
      res = []
      res += Persistence::keys_extract_zset(opts,id,'dataelements')
      res += Persistence::keys_extract_name(opts,id,'dataelements')
      res += Persistence::keys_extract_zset(opts,id,'attributes')
      res += Persistence::keys_extract_name(opts,id,'attributes')
      res += Persistence::keys_extract_zset(opts,id,'endpoints')
      res += Persistence::keys_extract_name(opts,id,'endpoints')
      pos = Persistence::keys_extract_set(opts,id,'positions')
      res += pos
      pos.each do |p|
        res << File.join(p,'@passthrough')
      end
      res += Persistence::keys_extract_name(opts,id,'positions')
      hnd = Persistence::keys_extract_set(opts,id,'handlers')
      res += hnd
      res += Persistence::keys_extract_name(opts,id,'handlers')
      hnd.each do |h|
        res << File.join(h,'url')
        res += Persistence::keys_extract_set_raw(opts,h)
      end
      cbs = Persistence::keys_extract_set(opts,id,'callbacks')
      res += cbs
      res += Persistence::keys_extract_name(opts,id,'callbacks')
      cbs.each do |c|
        ckey = Persistence::keys_extract_set_raw(opts,c)
        res << File.join(ckey,'position')
        res << File.join(ckey,'label')
        res << File.join(ckey,'uuid')
        res << File.join(ckey,'type')
      end
      res += Persistence::keys_extract_name(opts,id,'dsl')
      res += Persistence::keys_extract_name(opts,id,'dslx')
      res += Persistence::keys_extract_name(opts,id,'status','message')
      res += Persistence::keys_extract_name(opts,id,'status','id')
      res += Persistence::keys_extract_name(opts,id,'executionhandler')
      res += Persistence::keys_extract_name(opts,id,'description')
      res += Persistence::keys_extract_name(opts,id,'state')
      res += Persistence::keys_extract_name(opts,id,'state','@changed')
      res += Persistence::keys_extract_name(opts,id,'transformation','endpoints')
      res += Persistence::keys_extract_name(opts,id,'transformation','endpoints','@type')
      res += Persistence::keys_extract_name(opts,id,'transformation','description')
      res += Persistence::keys_extract_name(opts,id,'transformation','description','@type')
      res += Persistence::keys_extract_name(opts,id,'transformation','dataelements')
      res += Persistence::keys_extract_name(opts,id,'transformation','dataelements','@type')
      res
    end

    def self::set_handler(id,opts,key,url,values,update=false) #{{{
      exis = opts[:redis].smembers(@@obj + ":#{id}/handlers/#{key}")

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
      opts[:redis].smembers(@@obj + ":#{id}/handlers/#{key}")
    end #}}}
    def self::exists_handler?(id,opts,key) #{{{
      opts[:redis].exists?(@@obj + ":#{id}/handlers/#{key}")
    end #}}}
    def self::extract_handlers(id,opts) #{{{
      opts[:redis].smembers(@@obj + ":#{id}/handlers").map do |e|
        [e, opts[:redis].get(@@obj + ":#{id}/handlers/#{e}/url")]
      end
    end #}}}
  end

end
