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

    def self::send(type, event, cpee, instance, instance_uuid, instance_name, content={}, backend)
      topic = ::File::dirname(event)
      name = ::File::basename(event)
      backend.publish(type.to_s + ':' + event,
        instance.to_s + ' ' +
        JSON::generate(
          { 'cpee' => cpee,
            'instance-url' => File.join(cpee,instance.to_s),
            'instance-uuid' => instance_uuid,
            'instance-name' => instance_name,
            'instance' => instance,
            'topic' => topic,
            'type' => type,
            'name' => name,
            'timestamp' =>  Time.now.xmlschema(3),
            'content' => content
          }
        )
      )
    end

  end

end
