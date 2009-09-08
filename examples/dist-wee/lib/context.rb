require ::File.dirname(__FILE__) + '/MarkUS_V3.0'

class ContextGET < Riddl::Implementation
  include MarkUSModule

  def response
    pp "ContextGET, r0=#{@r[0]}"
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    Riddl::Parameter::Complex.new("cvs","text/html") do
      div_ do
        wf.context.each do |id, value|
          a_ "#{id}", :href => id, :style => "display:block"
        end
      end
    end
  end
end
class ContextPOST < Riddl::Implementation
  
  def response
    pp "ContextPOST, r0=#{@r[0]}, p0=#{@p[0].value}, p1=#{@p[1].value}"
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    wf.context @p[0].value => @p[1].value
    Riddl::Parameter::Simple.new("name", @p[0].value)
  end
end

class ContextDELETE < Riddl::Implementation

  def response
    pp "ContextDELTE, r0=#{@r[0]}, p0=#{@p[0].value}"
    @status = 405
  end
end

class ContextVarGET < Riddl::Implementation
  def response
    pp "ContextVarGET, r0=#{@r[0]}, r3=#{@r[3]}"
    contextvar_id = @r[3].to_sym
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    if wf.context.has_key? contextvar_id
      Riddl::Parameter::Simple.new("value", wf.context[contextvar_id.to_sym])
    else
      @status = 404
    end
  end
end
class ContextVarPUT < Riddl::Implementation
  def response
    pp "ContextVarPUT, r0=#{@r[0]}, r3=#{@r[3]}, p0=#{@p[0]}"
    contextvar_id = @r[3].to_sym
    contextvar_value = @p[0].value
    instance_id = @r[0].to_i
    wf = $controller[instance_id]

    if wf.context.has_key? contextvar_id
      wf.context contextvar_id.to_sym => contextvar_value
    else
      @status = 404
    end
  end
end

