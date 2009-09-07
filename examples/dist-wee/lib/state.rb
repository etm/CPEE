require 'lib/MarkUS_V3.0'

class StateGET < Riddl::Implementation
  include MarkUSModule

  def response
    pp "StateGET"
    instance_id = @p[0].value
    wf = $controller.get_instance instance_id
    r = Riddl::Parameter::Simple.new("state", wf.state)
  end
end

class StatePOST < Riddl::Implementation
  include MarkUSModule

  def response
    pp "StatePOST"
  end
end