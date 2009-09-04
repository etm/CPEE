require 'rack'
require '../../../riddl/lib/ruby/server'
require 'pp'
require 'lib/WeeController'
require 'lib/EmptyWorkflow'
require 'lib/MarkUS_V3.0'

use Rack::ShowStatus

$controller = WeeController.new

class InstancesGET < Riddl::Implementation 
  include MarkUSModule

  def response
    Riddl::Parameter::Complex.new("wis","text/html") do
      div_ do
        $controller.instances.each do |id, value|
          a_ id, :href => "#{id}/"
        end
      end
    end
  end
end

class Bar < Riddl::Implementation
end

run(
  Riddl::Server.new("description.xml") do
    on resource do
      run InstancesGET if method :get => '*'      # deliver list of running workflow instances (id)
      run Bar if post '*'     # start new instance and return instance-id
      on resource do          # wf instance level      
        on resource 'status' do
          run Bar if get '*'  # returns the status
          run Bar if post 'control-message' # start or stop the instance
        end
      end
    end
  end
)
