require ::File.dirname(__FILE__) + '/MarkUS_V3.0'

class DescriptionGET < Riddl::Implementation
  def response
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    Riddl::Parameter::Simple.new("description",wf.description)
  end
end

class DescriptionPUT < Riddl::Implementation
  def response
    instance_id = @r[0].to_i
    description = @p[0].value
    wf = $controller[instance_id]
    wf.description description
  end
end
