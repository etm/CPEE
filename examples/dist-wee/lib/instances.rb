require 'lib/MarkUS_V3.0'

class InstancesGET < Riddl::Implementation
  include MarkUSModule

  def response
    pp "InstanceGET"
    Riddl::Parameter::Complex.new("wis","text/html") do
      div_ do
        $controller.instances.each do |id, value|
          a_ id, :href => id, :style => "display:block"
        end
      end
    end
  end
end

class InstancesPOST < Riddl::Implementation
  def response
    pp "InstancePOST"
    Riddl::Parameter::Simple.new("id", $controller.make_instance)
  end
end

class InstancesDELETE < Riddl::Implementation
  def response
    begin
      pp "InstanceDELETE, p0 = #{@p[0].value}"
      id = @p[0].value.to_i;

      raise Exception.new("invalid instance_id given") unless ($controller.instances.has_key? id)
      $controller.remove_instance id
    rescue
      @status = 404 # http ERROR named 'Not found'
      puts $ERROR_INFO
    end
  end
end