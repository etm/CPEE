require 'json'
require 'pp'

class Link #{{{
  attr_reader :from, :to
  def initialize(from,to)
    @from  = from
    @to = to
  end
end #}}}

class Node #{{{ 
  @@niceid = -1
  attr_reader :id, :type, :label, :niceid, :incoming, :outgoing
  attr_reader :endpoints, :script, :parameters
  def initialize(id,type,label,incoming,outgoing)
    @id = id
    @niceid = (@@niceid += 1)
    @type = type
    @label = label
    @endpoints = []
    @script = ''
    @parameters = {}
    @incoming = incoming
    @outgoing = outgoing
  end
end #}}}

class Graph #{{{
  attr_reader :flow, :nodes

  def initialize
    @nodes = {}
    @flow = []
  end

  def add_node(n)
    @nodes[n.id] = n
  end  

  def add_flow(l)
    @flow << l
  end

  def next_nodes(from)
    nodes = []
    @flow.delete_if do |x| 
      if x.from == from.id
        nodes << x 
        true
      else
        false
      end
    end  
    nodes.map{|x| @nodes[x.to] }
  end
  private :next_nodes

  def next_node(from)
    if (nodes = next_nodes(from)).length == 1
      nodes.first
    else
      raise "#{from.inspect} - multiple outgoing connections"
    end  
  end
  private :next_node

  def build_tree(branch,node)
    while node
      case node.type
        when :parallelGateway, :exclusiveGateway
          return node if node.incoming > 1
          if node.incoming == 1 && node.outgoing > 1
            branch << (x = PStructureMapping.new(node))
            ncollect = next_nodes(node).map do |n|
              build_tree(x.new_branch,n)
            end.flatten
            if ncollect.uniq.length == 1
              ### e.g. multiple nested parallels share one parallel end node, i.e. not wellformed (see test/base4.xml)
              if ncollect.length < ncollect.first.incoming 
                return ncollect
              ### a wellformed (start and end) structure   
              else
                node = ncollect.first
              end  
            else  
              ### shit hits the fan, some syntax error in modelling
              raise "#{x.pretty_inspect}-----> no common end node"
            end  
          end
        when :task, :callActivity
          branch << node
        when :endEvent
          node = nil
        when :startEvent
        else
          raise "#{node.type} not supported yet"
      end

      node = next_node(node) if node
    end
  end

end #}}}

class PStructure #{{{
  attr_reader :id, :sub
  def initialize(id)
    @id = id
    @sub = []
  end
  def new_branch
    (@sub << []).last
  end
end #}}} 
class Parallel < PStructure #{{{
end #}}}
class Conditional < PStructure #{{{
  attr_reader :type
  def initialize(id,type)
    super id
    @type = type
  end  
end #}}}

class PStructureMapping #{{{
  def self.new(node)
    case node.type
      when :parallelGateway
        Parallel.new(node.id)
      when :exclusiveGateway
        Conditional.new(node.id,:exclusive)
      when :inclusiveGateway
        Conditional.new(node.id,:inclusive)
    end
  end
end #}}}

class CPEEStructureMapping
  def initialize(tree)
    @tree = tree
  end
  def generate
    res = XML::Smart.string("<description xmlns='http://cpee.org/ns/description/1.0'/>")
    res.register_namespace 'd', 'http://cpee.org/ns/description/1.0'
    generate_for_list(@tree,res.root)
    res
  end

  def generate_for_list(list,res)
    list.each do |e|
      send("print_#{e.class.name}".to_sym,e,res)
    end
  end
  private :generate_for_list

  def print_Node(node,res)
    n   = res.add('d:call', 'id' => "a#{node.niceid}", 'endpoint' => node.endpoints.join(','))
    p   = n.add('d:parameters')
          p.add('d:label',node.label)
          p.add('d:type',node.type)
          p.add('d:mid',node.id)
    par = p.add('d:parameters')
    node.parameters.each do |k,v|
      par.add(k,v)
    end
    unless node.script.strip == ''
      n.add('manipulate',node.script,'output' => 'result')
    end
  end
  private :print_Node

  def print_Parallel(node,res)
    s1 = res.add('parallel')
    node.sub.each do |branch|
      s2 = s1.add('parallel_branch')
      generate_for_list(branch,s2)
    end
  end
  private :print_Parallel

  def print_Conditional(node,res)
    s1 = res.add('choose')
    node.sub.each do |branch|
      s2 = s1.add('d:alternative','condition' => '')
      generate_for_list(branch,s2)
    end
  end
  private :print_Conditional
end
