class NameGET < Riddl::Implementation
  def response
    instance_id = @r[0].to_i
    Riddl::Parameter::Simple.new("name",$controller.name[instance_id])
  end
end
