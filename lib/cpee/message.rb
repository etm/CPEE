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

  module Message
    @@who = 'cpee'
    @@type = 'instance'
    def self::who #{{{
      @@who
    end #}}}
    def self::who=(it) #{{{
      @@who = it
    end #}}}
    def self::type #{{{
      @@type
    end #}}}
    def self::type=(it) #{{{
      @@type = it
    end #}}}

    def self::set_workers(workers)
      @@tworkers = (workers < 1 && workers > 99 ? 1 : workers).freeze
      @@last = -1
    end

    def self::target
      @@last < @@tworkers-1 ? @@last += 1 : @@last = 0
    end

    def self::send(type, event, cpee, instance, instance_uuid, instance_name, content={}, backend=nil, tt=nil)
      target = '%02i' % (tt || CPEE::Message::target)
      topic = ::File::dirname(event)
      name = ::File::basename(event)
      payload = {
        @@who => cpee,
        @@type + '-url' => File.join(cpee,instance.to_s),
        @@type => instance,
        'topic' => topic,
        'type' => type,
        'name' => name,
        'timestamp' =>  Time.now.xmlschema(3),
        'content' => content
      }
      payload[@@type + '-uuid'] = instance_uuid if instance_uuid
      payload[@@type + '-name'] = instance_name if instance_name

      backend.publish(type.to_s + ':' + target + ':' + event.to_s,
        instance.to_s + ' ' +
        JSON::generate(payload)
      )
    end

    def self::send_url(type, event, cpee, content={}, backend)
      EM.defer do
        topic = ::File::dirname(event)
        name = ::File::basename(event)
        payload = {
          @@who => cpee,
          'topic' => topic,
          'type' => type,
          'name' => name,
          'timestamp' =>  Time.now.xmlschema(3),
          'content' => content
        }
        client = Riddl::Client.new(backend)
        client.post [
          Riddl::Parameter::Simple::new('type',type),
          Riddl::Parameter::Simple::new('topic',topic),
          Riddl::Parameter::Simple::new('event',name),
          Riddl::Parameter::Complex::new('notification','application/json',JSON::generate(payload))
        ]
      end
    end
  end

end
