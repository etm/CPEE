require ::File.dirname(__FILE__) + '/MarkUS_V3.0'

class StateGET < Riddl::Implementation
  
  def response
    pp "StateGET, r0=#{@r[0]}"
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    Riddl::Parameter::Simple.new("state", wf.state)
  end
end

class StatePUT < Riddl::Implementation
  include MarkUSModule

  def response
    pp "StatePUT, r0=#{@r[0]}, p0=#{@p[0].value}"
    instance_id = @r[0].to_i
    if @p[0].value == "stop"
      pp "Stopping instance no #{instance_id}"
      $controller.stop instance_id
    end
    if @p[0].value == "start"
      pp "Starting instance no #{instance_id}"
      $controller.start instance_id
    end
    Riddl::Parameter::Simple.new("state", $controller[instance_id].state);
  end
end