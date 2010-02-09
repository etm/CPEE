require 'pp'
require ::File.dirname(__FILE__) + '/RescueHandler'
require ::File.dirname(__FILE__) + '/MarkUS_V3.0'


class HandlerPOST < Riddl::Implementation
  def response
    pp "HandlerPOST, r0=#{@r[0]}, p0=#{@p[0].value}, p1=#{@p[1].value}"
    instance_id = @r[0].to_i
    classname = @p[0].value
    arg = [@p[1].value]
    wf = $controller[instance_id]
    wf.handler=Kernel.const_get(classname)
    p "HandlerPOST => #{arg}"
    wf.handlerargs=arg
    p "HandlerPOST2 => #{wf.handlerargs}"
  end
end

class HandlerGET < Riddl::Implementation
  include MarkUSModule

  def response
    pp "HandlerGET, r0=#{@r[0]}, r[-1]=#{@r[-1]}"
    instance_id = @r[0].to_i
    wf = $controller[instance_id]
    args = wf.handlerargs
    args = args.is_a?(Array) ? args : [args]
    Riddl::Parameter::Complex.new("handlers","text/html") do
      div_ do
        args.each do |value|
          a_ "#{value}", :href => value, :style => "display:block"
        end
      end
    end
  end
end
