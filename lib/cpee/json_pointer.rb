# This file is part of CPEE.
#
# CPEE is free software: you can redistribute it and/or modify it under the terms
# of the GNU Lesser General Public License as published by the Free Software Foundation,
# either version 3 of the License, or (at your option) any later version.
#
# CPEE is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
# PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public License along with
# CPEE (file LICENSE in the main directory).  If not, see
# <http://www.gnu.org/licenses/>.

require 'ostruct'

module CPEE

  module JSONPointer

    def self::parse(pointer) #{{{
      raise ArgumentError, "invalid JSON pointer #{pointer.inspect}" unless pointer.is_a?(String) && pointer.start_with?('/')
      pointer[1..-1].split('/',-1).map { |s| s.gsub('~1','/').gsub('~0','~') }
    end #}}}

    def self::symbolize(value) #{{{
      case value
        when Hash; value.each_with_object({}) { |(k,v),h| h[k.to_sym] = symbolize(v) }
        when Array; value.map { |v| symbolize(v) }
        else value
      end
    end #}}}

    def self::container?(node) #{{{
      node.is_a?(Hash) || node.is_a?(Array) || node.is_a?(OpenStruct)
    end #}}}

    def self::array_index(node, seg) #{{{
      return node.length if seg == '-'
      raise ArgumentError, "invalid array index #{seg.inspect}" unless seg =~ /\A(0|[1-9]\d*)\z/
      i = seg.to_i
      raise ArgumentError, "array index #{i} out of range" if i > node.length
      i
    end #}}}

    def self::get(node, seg) #{{{
      case node
        when Hash
          node.key?(seg.to_sym) ? node[seg.to_sym] : node[seg]
        when Array
          node[array_index(node, seg)]
        when OpenStruct
          node[seg.to_sym]
      end
    end #}}}

    def self::put(node, seg, value) #{{{
      case node
        when Hash
          node[node.key?(seg) && !node.key?(seg.to_sym) ? seg : seg.to_sym] = value
        when Array
          node[array_index(node, seg)] = value
        when OpenStruct
          node[seg.to_sym] = value
      end
    end #}}}

    def self::argument(value) #{{{
      return value unless value.is_a?(Hash)
      (defined?(::ParaStruct) ? ::ParaStruct : OpenStruct).new(:name => value[:name].to_s.to_sym, :value => value[:value])
    end #}}}

    # /arguments/<name>/... -> /arguments/<index>/value/... (argument is created if missing)
    def self::argument_by_name(root, segs) #{{{
      return segs unless segs.length >= 2 && segs[0] == 'arguments' && segs[1] !~ /\A(\d+|-)\z/
      args = (get(root, 'arguments') || []).dup
      put(root, 'arguments', args)
      idx = args.index { |a| a.respond_to?(:name) && a.name.to_s == segs[1] }
      if idx.nil?
        args << argument(:name => segs[1], :value => nil)
        idx = args.length - 1
      end
      ['arguments', idx.to_s, 'value'] + segs[2..-1]
    end #}}}

    # containers on the path are copied before writing, only root is modified in place
    def self::set(root, pointer, value) #{{{
      raise ArgumentError, 'root is not a Hash' unless root.is_a?(Hash)
      segs = argument_by_name(root, parse(pointer))
      value = symbolize(value)
      value = value.to_s.sub(/^:/,'').to_sym if segs == ['method'] && !value.nil?
      value = argument(value) if segs.length == 2 && segs[0] == 'arguments'
      value = value.map { |a| argument(a) } if segs == ['arguments'] && value.is_a?(Array)

      node = root
      segs[0..-2].each do |seg|
        child = get(node, seg)
        child = {} if child.nil?
        raise ArgumentError, "#{pointer}: #{seg.inspect} is not a container" unless container?(child)
        child = child.dup
        put(node, seg, child)
        node = child
      end
      put(node, segs.last, value)
      root
    end #}}}

  end

end
