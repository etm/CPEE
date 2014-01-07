#!/usr/bin/ruby
require 'xml/smart'
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
  def initialize(id,type,label,incoming,outgoing)
    @id = id
    @niceid = (@@niceid += 1)
    @type = type
    @label = label
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

  def print_Node(n,res)
    n   = res.add('d:call', 'id' => n.label, 'endpoint' => '')
    p   = n.add('d:parameters')
          p.add('d:method')
    par = p.add('d:parameters')
  end
  private :print_Node

  def print_Parallel(n,res)
    s1 = res.add('parallel')
    n.sub.each do |branch|
      s2 = s1.add('parallel_branch')
      generate_for_list(branch,s2)
    end
  end
  private :print_Parallel

  def print_Conditional(n,res)
    s1 = res.add('choose')
    n.sub.each do |branch|
      s2 = s1.add('d:alternative','condition' => '')
      generate_for_list(branch,s2)
    end
  end
  private :print_Conditional
end

graph = Graph.new
start = nil
tree = []

doc = XML::Smart.open(ARGV[0])
doc.register_namespace 'xsi', "http://www.w3.org/2001/XMLSchema-instance"
doc.register_namespace 'b',   "http://www.omg.org/bpmn20" 
doc.register_namespace 'bm',  "http://www.omg.org/spec/BPMN/20100524/MODEL" 
doc.register_namespace 'bdi', "http://www.omg.org/spec/BPMN/20100524/DI" 
doc.register_namespace 'dc',  "http://www.omg.org/spec/DD/20100524/DC" 
doc.register_namespace 'di',  "http://www.omg.org/spec/DD/20100524/DI" 
doc.register_namespace 'dr',  "http://www.jboss.org/drools" 

# assign all important nodes to objects
doc.find("/bm:definitions/bm:process/bm:*[@id and @name]").each do |e|
  n = Node.new(e.attributes['id'],e.qname.name.to_sym,e.attributes['name'],e.find('count(bm:incoming)'),e.find('count(bm:outgoing)'))
  graph.add_node n
  start = n if n.type == :startEvent && start == nil
end

# extract all sequences to a sequencelist
doc.find("/bm:definitions/bm:process/bm:sequenceFlow").each do |e|
  source = e.attributes['sourceRef']
  target = e.attributes['targetRef']
  graph.add_flow Link.new(source, target)
end

graph.build_tree tree, start

xml = CPEEStructureMapping.new(tree).generate

puts xml.to_s
