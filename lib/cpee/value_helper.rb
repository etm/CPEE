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
require 'time'

module CPEE

  class ValueHelper
    def self::generate(value)
      if [String, Integer, Float, TrueClass, FalseClass, Date].include? value.class
        value.to_s
      elsif  [Hash, Array].include? value.class
        JSON::generate(value)
      elsif value.respond_to?(:to_s)
        value.to_s
      end
    end

    def self::parse(value)
      case value.downcase
        when 'true'
          true
        when 'false'
          false
        when 'nil', 'null'
          nil
        else
          begin
            JSON::parse(value)
          rescue
            (Integer value rescue nil) || (Float value rescue nil) || value.to_s rescue nil || ''
          end
      end
    end

    def self::parse_extended(value)
      if [String].include? value.class
        self::parse(value)
      elsif [Array, NilClass, Integer, Float, TrueClass, FalseClass, Date].include? value.class
        value
      elsif value.respond_to?(:to_s)
        value.to_s
      else
        ''
      end
    end

  end

end
