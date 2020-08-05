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

    def self::send(redis, what, instance, content={})
      redis.publish('event:' + what, JSON::generate({ 'instance' => instance, 'topic' => ::File::dirname(what), 'type' => 'event', 'name' => ::File::basename(what), 'content' => content }))
    end

    def self::vote(redis, what, instance, content={})
      redis.publish('vote:' + what, JSON::generate({ 'instance' => instance, 'topic' => ::File::dirname(what), 'type' => 'vote', 'name' => ::File::basename(what), 'content' => content }))
    end

  end

end
