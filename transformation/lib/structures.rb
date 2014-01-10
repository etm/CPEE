module ProcessTransformation

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

  def next_node(from)
    if (nodes = next_nodes(from)).length == 1
      nodes.first
    else
      raise "#{from.inspect} - multiple outgoing connections"
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

class Loop #{{{
  attr_reader :id, :sub, :type
  def initialize(id,type)
    @id = id
    @type = type
    @sub = []
  end  
end #}}}

end
