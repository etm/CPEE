require ::File.dirname(__FILE__) + '/MarkUS_V3.0'

class DescriptionGET < Riddl::Implementation
  def response
    pp "DescriptionGET, r0=#{@r[0]}"
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    pp "Description: #{wf.description}"
    Riddl::Parameter::Simple.new("description",wf.description)
  end
end

class DescriptionPUT < Riddl::Implementation
  def response
    pp "DescriptionPUT, r0=#{@r[0]}, p0=#{@p[0].value}"
    instance_id = @r[0].to_i
    description = @p[0].value
    wf = $controller[instance_id]
    pp "description will be set to #{description}"
    wf.description description
  end
end
