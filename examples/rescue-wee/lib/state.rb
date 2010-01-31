
class StateGET < Riddl::Implementation
  def response
    pp "StateGET, r0=#{@r[0]}"
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    Riddl::Parameter::Simple.new("state", wf.state)
  end
end

class StatePUT < Riddl::Implementation
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

class StatePUTSearch < Riddl::Implementation
  def response
    pp "StatePUTSearch, r0=#{@r[0]}, p0=#{@p[0].value}, p1=#{@p[1].value}, p2=#{@p[2].value}"
    instance_id = @r[0].to_i
    
    pp "Setting search position of instance no #{instance_id} to #{@p[0].value}"
    if(@p[0].value == "")
      $controller[instance_id].search false;
    else
      $controller[instance_id].search Wee::SearchPos.new(@p[0].value.to_sym, @p[1].value.to_sym, @p[2].value);
    end
    []
  end
end
