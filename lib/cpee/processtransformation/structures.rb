# encoding: UTF-8
#
# This file is part of CPEE.
#
# Apache License, Version 2.0
# 
# Copyright (c) 2013 Juergen Mangler
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

module CPEE

  module ProcessTransformation

    class Link #{{{
      attr_accessor :from, :to
      attr_reader :condition, :attributes
      def initialize(from,to,cond=nil)
        @from  = from
        @to = to
        @condition = cond
        @attributes = {}
      end
    end #}}}

    module Container
      def container?
        @container || false
      end
    end

    class Node #{{{ 
      include Container
      @@niceid = {}
      attr_reader :id, :label, :niceid
      attr_reader :endpoints, :methods, :parameters, :attributes
      attr_accessor :script, :script_id, :script_var, :script_type, :incoming, :outgoing, :type
      def initialize(context,id,type,label,incoming,outgoing)
        @@niceid[context] ||= -1
        @niceid = (@@niceid[context] += 1)
        @id = id
        @type = type
        @label = label
        @endpoints = []
        @methods = []
        @script = nil
        @script_type = nil
        @script_id = nil
        @script_var = 'result'
        @parameters = {}
        @incoming = incoming
        @outgoing = outgoing
        @attributes = {}
      end
    end # }}} 

    module Struct #{{{
      def each(&a)
        @sub.each{|s| a.call(s)}
      end
      def length
        @sub.length
      end  
    end #}}}

    class Break < Node
      def initialize(context,incoming)
        super context, '-1', :break, 'BREAK', incoming, []
      end
    end

    class Alternative < Array #{{{
      include Container
      attr_accessor :condition, :condition_type
      attr_reader :id, :attributes
      def condition?; true; end
      def initialize(id)
        @container = true
        @id = id
        @condition = []
        @condition_type = nil
        @attributes = {}
      end
    end #}}}
    class Branch < Array #{{{
      include Container
      attr_reader :id
      def condition?; false; end
      def initialize(id)
        @container = true
        @id = id
      end
    end #}}}
    class InfiniteLoop < Array #{{{
      include Container
      def condition?; false; end
      attr_reader :attributes
      attr_accessor :id, :type
      def initialize(id)
        @container = true
        @id = id
        @type = :loop
        @attributes = {}
      end  
    end #}}}
    class Loop < Array #{{{
      include Container
      attr_accessor :id, :type, :condition, :condition_type
      attr_reader :attributes
      def condition?; true; end
      def initialize(id)
        @container = true
        @id = id
        @type = :loop
        @condition = []
        @condition_type = nil
        @attributes = {}
      end  
    end #}}}

    class Parallel #{{{
      include Container
      include Struct
      include Enumerable
      attr_reader :id, :sub
      attr_accessor :type, :wait
      def initialize(id,type,wait='-1')
        @container = true
        @id = id
        @type = type
        @sub = []
        @wait = wait
      end
      def new_branch
        (@sub << Branch.new(@id)).last
      end
    end #}}} 

    class Conditional #{{{
      include Container
      include Struct
      include Enumerable
      attr_reader :container
      attr_reader :id, :sub, :mode
      attr_reader :attributes
      attr_accessor :type
      def initialize(id,mode,type)
        @container = true
        @id = id
        @sub = []
        @mode = mode
        @type = type
        @attributes = {}
      end  
      def new_branch
        (@sub << Alternative.new(@id)).last
      end
    end #}}}

    class Graph #{{{
      attr_reader :flow, :nodes

      def find_node(niceid)
        @nodes.find{|k,v| v.niceid == niceid }
      end

      def initialize
        @nodes = {}
        @links = []
      end

      def clean_up(&bl)
        selnodes = []
        @nodes.each do |k,n|
          ret = bl.call(n)
          selnodes << n if ret
        end
        selnodes.each do |n|
          if n.incoming > 1 || n.outgoing > 1
            raise "#{n.inspect} - not a simple node to remove"
          end  
          to,from = nil
          @links.each do |f|
            to = f if f.to == n.id
            from = f if f.from == n.id
          end
          if to && from
            to.to = from.to
            @links.delete(from)
            @nodes.delete(n.id)
          else
            raise "#{n.inspect} - could not remove flow"
          end  
        end
      end

      def find_script_id(s)
        @nodes.find_all{|k,n| n.script_id == s}
      end

      def add_node(n)
        @nodes[n.id] = n
      end  

      def link(f,t)
        @links.find{ |x| x.from == f && x.to == t }
      end

      def add_link(l)
        @links << l
      end

      def next_nodes(from)
        links = @links.find_all { |x| x.from == from.id }
        links.map{|x| @nodes[x.to] }
      end

      def next_node(from)
        if (nodes = next_nodes(from)).length == 1
          nodes.first
        else
          raise "#{from.inspect} - multiple outgoing connections"
        end  
      end
    end #}}}

      class Tree < Array #{{{
        def condition?; false; end

        def to_s
          "TREE:\n" << print_tree(self)
        end

        def print_tree(ele,indent='  ')
          ret = ''
          ele.each_with_index do |e,i|
            last  = (i == ele.length - 1)
            pchar = last ? '└' : '├'
            if e.container?
              ret << indent + pchar + ' ' + e.class.to_s.gsub(/[^:]*::/,'') + "\n"
              ret << print_tree(e,indent + (last ? '  ' : '│ '))
            elsif e.is_a?(Break) && 
              ret << indent + pchar + ' ' + e.class.to_s.gsub(/[^:]*::/,'') + "\n"
            else
              ret << indent + pchar + ' ' + e.niceid.to_s + "\n"
            end
          end
          ret
        end
        private :print_tree
      end #}}}

      class Traces < Array #{{{
        def initialize_copy(other)
         super
         self.map!{ |t| t.dup }
        end

        def remove(trcs)
          trcs.each do |t|
            self.delete(t)
          end  
        end

        def empty!
          self.delete_if{true}
        end

        def remove_empty
          self.delete_if{|t| t.empty? }
        end

        def first_node
          self.first.first
        end
        def second_nodes
          self.map { |t| t.length > 1 ? t[1] : t[0] }
        end

        def shortest
          self.min_by{|e|e.length}
        end

        def to_s
          "TRACES: " + self.collect { |t| t.empty? ? '∅' : t.collect{|n| "%2d" % n.niceid }.join('→ ') }.join("\n        ")
        end

        def shift_all
          self.each{ |tr| tr.shift }
        end  
        def pop_all
          self.each{ |tr| tr.pop }
        end  

        def finished?
          self.reduce(0){|sum,t| sum += t.length} == 0
        end

        def same_first
          (n = self.map{|t| t.first }.uniq).length == 1 ? n.first : nil
        end

        # future use
        def incoming
          if node = self.same_first
            tcount = 1
            self.each{|t| tcount += 1 if t.first == t.last }
            tcount
          else
            raise "Wrong Question"
          end  
        end

        def include_in_all?(e)
          num = 0
          self.each{|n| num += 1 if n.include?(e)} 
          num == self.length
        end
        def same_position_in_all?(e,i)
          num = 0
          self.each{|n| num += 1 if n[i] == e}
          num == self.length
        end

        def all_loops?
          num = 0
          self.each{|n| num += 1 if n.first == n.last }
          num == self.length
        end


        def add_breaks(context)
          trueloops = self.find_all{ |t| t.last == t.first }.length
          if trueloops == self.length
            self << [self.first_node] ### the blank conditional so that we get a break
          else
            self.each do |t|
              t << Break.new(context,1) unless t.last == t.first ### an explicit break
            end
          end  
        end

        def loops
          lo = Traces.new self.find_all{ |t| t.first == t.last }
          self.each do |t|
            lo << t if lo.second_nodes.include?(t[1])
          end
          lo.uniq
        end

        def eliminate(loops)
          ### find nested loops
          self.each_with_index do |t,i|
            maxcut = 0
            ### find out which common parts the traces share with theloops
            loops.each do |l|
              maxcut.upto(l.length) do |i|
                maxcut = i if t[0...i] == l[0...i]
              end
            end
            ### in case of nested loop (common part occurs at end of loop), include the whole
            0.upto (maxcut-1) do |j|
              if self[i][j] == self[i].last
                loops << self[i].shift(self[i].length)
              end
            end  
          end
          loops.uniq!
          loops.remove_empty
          self.remove_empty

          ### cut from non-nested loops
          self.each_with_index do |t,i|
            maxcut = 0
            ### find out which common parts the traces share with theloops
            loops.each do |l|
              maxcut.upto(l.length) do |i|
                maxcut = i if t[0...i] == l[0...i]
              end
            end
            cutted = self[i].shift(maxcut)
            loops << cutted if cutted.length > 1 ### if only the loop node is left, no need to attach
          end
        end

        def extend
          # find largest common
          max = nil
          sh = self.shortest
          sh = sh[0..-2] if sh.first == sh.last
          sh.each_with_index do |e,i|
            if self.same_position_in_all?(e,i)
              max = e
            else  
              break
            end
          end

          # all before the largest common are just copied, so incoming should be 1
          sh.each do |e|
            break if e == max
            e.incoming = 1
          end  

          # if last is the largest common do nothing
          # else append from last to largest common
          self.each do |t|
            unless t.last == max
              last = t.last
              if t.index(last) && t.index(max)
                (t.index(last) + 1).upto(t.index(max)) do |i|
                  t << t[i]
                end 
              end
            end  
          end

          max.incoming = self.length + 1
          max
        end

        def segment_by_loops(loops)
          # supress loops
          self.delete_if { |t| loops.include?(t) }
          self.eliminate(loops)
          loops.extend
        end  

        def find_endnode
          # supress loops
          trcs = self.dup
          # trcs.delete_if { |t| t.uniq.length < t.length }

          # find common node (except loops)
          enode = nil
          unless trcs.empty?
            trcs.first.each do |n|
              if trcs.include_in_all?(n)
                enode = n
                break
              end  
            end
          end  
          enode
        end  

        def segment_by(endnode)
          # cut shit until common node, return the shit you cut away
          tracesgroup = self.group_by{|t| t.first}.map do |k,trace|
            coltrace = trace.map do |t|
              # slice upto common node, collect the sliced away part
              len = t.index(endnode)
              if len
                cut = t.slice!(0...len)
                cut << t.first
              else # if endnode is nil, then return the whole
                t
              end
            end.uniq
            Traces.new(coltrace)
          end
          [tracesgroup,endnode]
        end
      end #}}}

  end

end
