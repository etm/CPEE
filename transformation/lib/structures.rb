# encoding: UTF-8

module ProcessTransformation

class Link #{{{
  attr_accessor :from, :to
  attr_reader :condition
  def initialize(from,to,cond=nil)
    @from  = from
    @to = to
    @condition = cond
  end
end #}}}

module Container
  def container?
    @container || false
  end
end

class Node #{{{ 
  include Container
  @@niceid = -1
  attr_reader :id, :label, :niceid
  attr_reader :endpoints, :methods, :parameters
  attr_accessor :script, :script_id, :script_var, :incoming, :outgoing, :type
  def initialize(id,type,label,incoming,outgoing)
    @id = id
    @niceid = (@@niceid += 1)
    @type = type
    @label = label
    @endpoints = []
    @methods = []
    @script = ''
    @script_id = nil
    @script_var = 'result'
    @parameters = {}
    @incoming = incoming
    @outgoing = outgoing
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
  def initialize(incoming)
    super '-1', :break, 'BREAK', incoming, []
  end
end

class Alternative < Array #{{{
  include Container
  attr_accessor :condition
  attr_reader :id
  def condition?; true; end
  def initialize(id)
    @container = true
    @id = id
    @condition = []
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
class BlindLoop < Array #{{{
  include Container
  def condition?; false; end
  attr_accessor :id, :type
  def initialize(id)
    @container = true
    @id = id
    @type = :loop
  end  
end #}}}
class Loop < Array #{{{
  include Container
  attr_accessor :id, :type, :condition
  def condition?; true; end
  def initialize(id)
    @container = true
    @id = id
    @type = :loop
    @condition = []
  end  
end #}}}

class Parallel #{{{
  include Container
  include Struct
  include Enumerable
  attr_reader :id, :sub
  attr_accessor :type
  def initialize(id,type)
    @container = true
    @id = id
    @type = type
    @sub = []
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
  attr_accessor :type
  def initialize(id,mode,type)
    @container = true
    @id = id
    @sub = []
    @mode = mode
    @type = type
  end  
  def new_branch
    (@sub << Alternative.new(@id)).last
  end
end #}}}

class Graph #{{{
  attr_reader :flow, :nodes

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

    def remove_empty
      self.delete_if{|t| t.empty? }
    end

    def first_node
      self.first.first
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

    def finished?
      self.reduce(0){|sum,t| sum += t.length} == 0
    end

    def same_first
      (n = self.map{|t| t.first }.uniq).length == 1 ? n.first : nil
    end

    def include_in_all?(e)
      num = 0
      self.each{|n| num += 1 if n.include?(e)} 
      num == self.length
    end

    def loops
      Traces.new self.find_all{ |t| t.first == t.last }
    end

    def eliminate(loops)
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
            maxcut = self[i].length
          end
        end  
        loops << self[i].shift(maxcut)
      end
    end

    def extend
      # find largest common
      max = nil
      self.shortest.each do |e| 
        if self.include_in_all?(e)
          max = e
        else  
          break
        end
      end

      # if last is largest common append break
      # else append from last to largest common
      self.each do |t|
        if t.last == max && t.first != max
          # t << Break.new(1)
        else
          last = t.last
          t.last.incoming = 1
          if t.index(last) && t.index(max)
            (t.index(last) + 1).upto(t.index(max)) do |i|
              t << t[i]
            end 
          end
        end  
      end

      max.incoming = self.length
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
      trcs.delete_if { |t| t.uniq.length < t.length }

      # find common node (except loops)
      enode = nil
      trcs.first.each do |n|
        if trcs.include_in_all?(n)
          enode = n
          break
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
