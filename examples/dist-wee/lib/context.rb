require ::File.dirname(__FILE__) + '/MarkUS_V3.0'

class ContextGET < Riddl::Implementation
  include MarkUSModule

  def response
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
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    wf.context @p[0].value => @p[1].value
    Riddl::Parameter::Simple.new("name", @p[0].value)
  end
end

class ContextDELETE < Riddl::Implementation

  def response
    @status = 405
  end
end

class ContextVarGET < Riddl::Implementation
  def response
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

