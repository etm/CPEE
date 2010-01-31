require ::File.dirname(__FILE__) + '/MarkUS_V3.0'

class EndpointsGET < Riddl::Implementation
  include MarkUSModule

  def response
    pp "EndpointsGET, r0=#{@r[0]}"
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    Riddl::Parameter::Complex.new("eps","text/html") do
      div_ do
        wf.endpoints.each do |id, value|
          a_ "#{id}", :href => id, :style => "display:block"
        end
      end
    end
  end
end
class EndpointsPOST < Riddl::Implementation
  
  def response
    pp "EndpointsPOST, r0=#{@r[0]}, p0=#{@p[0].value}, p1=#{@p[1].value}"
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    wf.endpoint @p[0].value.to_sym => @p[1].value
    Riddl::Parameter::Simple.new("name", @p[0].value.to_sym)
  end
end

class EndpointsDELETE < Riddl::Implementation

  def response
    pp "EndpointsDELTE, r0=#{@r[0]}, p0=#{@p[0].value}"
    @status = 405
  end
end

class EndpointGET < Riddl::Implementation
  def response
    pp "EndpointGET, r0=#{@r[0]}, r3=#{@r[3]}"
    ep_id = @r[3].to_sym
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    if wf.endpoints.has_key? ep_id
      Riddl::Parameter::Simple.new("value", wf.endpoints[ep_id])
    else
      @status = 404
    end
  end
end
class EndpointPUT < Riddl::Implementation
  def response
    pp "EndpointPUT, r0=#{@r[0]}, r3=#{@r[3]}, p0=#{@p[0]}"
    ep_id = @r[3].to_sym
    ep_value = @p[0].value
    instance_id = @r[0].to_i
    wf = $controller[instance_id]

    if wf.endpoints.has_key? ep_id
      wf.endpoint ep_id => ep_value
    else
      @status = 404
    end
  end
end

