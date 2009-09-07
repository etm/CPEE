require 'rack'
require '../../../riddl/lib/ruby/server'
require 'pp'
require 'lib/instances'
require 'lib/state'
require 'lib/context'
require 'lib/WeeController'
require 'lib/EmptyWorkflow'

use Rack::ShowStatus

$controller = WeeController.new

class Bar < Riddl::Implementation
end

run(
  Riddl::Server.new("description.xml") do
    on resource do
      run InstancesGET if method :get => '*'                  # deliver list of running workflow instances (id)
      run InstancesPOST if method :post => '*'                # start new instance and return instance-id
      run InstancesDELETE if method :delete => 'instance-id'  # delete an instance
      on resource do                                          # wf instance level
        on resource 'state' do
          run StateGET if method :get => '*'                  # returns the status
          run StatePUT if method :put => 'control-message'    # start or stop the instance
        end
        on resource 'properties' do
          on resource 'context' do
            run ContextGET if method :get => '*'              # returns the context
            run ContextPOST if method :post => 'context-pair' # adds a context variable
            run ContextDELETE if method :delete => 'context-id' # deletes a context variable
            on resource do
              run ContextVarGET if method :get => '*'         # returns the value of a context var
              run ContextVarPUT if method :put => 'context-value' # sets the value of a context var
            end
          end
        end
      end
    end
  end
)
