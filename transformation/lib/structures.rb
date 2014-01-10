module ProcessTransformation

class Link #{{{
  attr_reader :from, :to, :condition
  def initialize(from,to,cond=nil)
    @from  = from
    @to = to
    @condition = cond
  end
end #}}}

class Node #{{{ 
  @@niceid = -1
  attr_reader :id, :type, :label, :niceid, :incoming, :outgoing
  attr_reader :endpoints, :methods, :parameters
  attr_accessor :script
  def initialize(id,type,label,incoming,outgoing)
    @id = id
    @niceid = (@@niceid += 1)
    @type = type
    @label = label
    @endpoints = []
    @methods = []
    @script = ''
    @parameters = {}
    @incoming = incoming
    @outgoing = outgoing
  end
end # }}}

class Graph #{{{
  attr_reader :flow, :nodes

  def initialize
    @nodes = {}
    @flow = []
  end

  def add_node(n)
    @nodes[n.id] = n
  end  

  def incoming_condition(n)
    @flow.find_all { |x| x.to == n.id }
  end

  def add_flow(l)
    @flow << l
  end

  def next_nodes(from)
    links = @flow.find_all { |x| x.from == from.id }
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

class Parallel #{{{
  attr_reader :id, :sub
  def initialize(id)
    @id = id
    @sub = []
  end
  def new_branch
    (@sub << []).last
  end
end  #}}}

class Alternative < Array #{{{
  attr_reader :condition
  def initialize(cond)
    @condition = cond
  end
end #}}}

class Conditional #{{{
  attr_reader :id, :sub, :type
  def initialize(id,type)
    @id = id
    @sub = []
    @type = type
  end  
  def new_branch(cond)
    (@sub << Alternative.new(cond)).last
  end
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
