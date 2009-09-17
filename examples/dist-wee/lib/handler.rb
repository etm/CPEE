require 'pp'
require ::File.dirname(__FILE__) + '/MonitoringHandler'

class HandlerPOST < Riddl::Implementation
  def response
    pp "HandlerPOST, r0=#{@r[0]}, p0=#{@p[0].value}, p1=#{@p[1].value}"
    instance_id = @r[0].to_i
    classname = @p[0].value
    arg = @p[1].value
    wf = $controller[instance_id]
    wf.handler=Kernel.const_get(classname)
    wf.handlerargs(arg)
  end
end
