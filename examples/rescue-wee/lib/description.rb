require ::File.dirname(__FILE__) + '/MarkUS_V3.0'

class DescriptionGET < Riddl::Implementation
  def response
    pp "DescriptionGET, r0=#{@r[0]}"
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    pp "Description: #{wf.wf_description}"
    Riddl::Parameter::Simple.new("description",wf.wf_description)
  end
end

class DescriptionPUT < Riddl::Implementation
  def response
    pp "DescriptionPUT, r0=#{@r[0]}, p0=#{@p[0].value}"
    instance_id = @r[0].to_i
    description = @p[0].value
    wf = $controller[instance_id]
    pp "description will be set to #{description}"
    wf.wf_description description
  end
end
