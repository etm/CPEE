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
      elsif [Array, NilClass, Integer, Float, TrueClass, FalseClass, Date].inclu
        value
      elsif value.respond_to?(:to_s)
        value.to_s
      else
        ''
      end
    end

  end

end
