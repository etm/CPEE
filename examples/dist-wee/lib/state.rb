require 'lib/MarkUS_V3.0'

class StateGET < Riddl::Implementation
  include MarkUSModule

  def response
    pp "StateGET r0=#{@r[0]}"
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    r = Riddl::Parameter::Simple.new("state", wf.state)
  end
end

class StatePOST < Riddl::Implementation
  include MarkUSModule

  def response
    pp "StatePOST"
  end
end