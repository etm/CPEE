require 'rack'
require '../../../riddl/lib/ruby/server'
require 'pp'
require 'lib/instances'
require 'lib/state'
require 'lib/WeeController'
require 'lib/EmptyWorkflow'

use Rack::ShowStatus

$controller = WeeController.new

class Bar < Riddl::Implementation
end

run(
  Riddl::Server.new("description.xml") do
    on resource do
      run InstancesGET if method :get => '*'      # deliver list of running workflow instances (id)
      run InstancesPOST if method :post => '*'    # start new instance and return instance-id
      run InstancesDELETE if method :delete => 'instance-id'    # delete an instance
      on resource do          # wf instance level
        on resource 'state' do
          run StateGET if method :get => '*'  # returns the status
          run StatePOST if method :post => 'control-message' # start or stop the instance
        end
      end
    end
  end
)