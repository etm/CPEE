require 'rack'
require ::File.dirname(__FILE__) + '/../../../riddl/lib/ruby/server'
require 'pp'
require ::File.dirname(__FILE__) + '/lib/instances'
require ::File.dirname(__FILE__) + '/lib/state'
require ::File.dirname(__FILE__) + '/lib/context'
require ::File.dirname(__FILE__) + '/lib/endpoints'
require ::File.dirname(__FILE__) + '/lib/description'
require ::File.dirname(__FILE__) + '/lib/handler'
require ::File.dirname(__FILE__) + '/lib/WeeController'
require ::File.dirname(__FILE__) + '/lib/EmptyWorkflow'

use Rack::ShowStatus
options = {:Port => 9295, :Host => "0.0.0.0", :AccessLog => []}
$0 = "wee-riddl"

$controller = WeeController.new

run(
  Riddl::Server.new(::File.dirname(__FILE__) + '/description.xml', true) do

    on resource do
      run InstancesGET if method :get => '*'                  # deliver list of running workflow instances (id)
      run InstancesPOST if method :post => 'instance-name'    # start new instance and return instance-id
      run InstancesDELETE if method :delete => 'instance-id'  # delete an instance
      on resource do                                          # wf instance level
        on resource 'state' do
          run StateGET if method :get => '*'                  # returns the status
          run StatePUT if method :put => 'control-message'    # start or stop the instance
          run StatePUTSearch if method :put => 'search-pos'         # set the search position
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
          on resource 'endpoints' do
            run EndpointsGET if method :get => '*'              # returns the endpoints
            run EndpointsPOST if method :post => 'endpoint-pair' # adds a endpoint
            run EndpointsDELETE if method :delete => 'endpoint-id' # deletes a endpoint
            on resource do
              run EndpointGET if method :get => '*'         # returns the value of a context var
              run EndpointPUT if method :put => 'endpoint-value' # sets the value of a context var
            end
          end
          on resource 'description' do
            run DescriptionGET if method :get => '*'            # returns the description
            run DescriptionPUT if method :put => 'description'  # sets the description
          end
          on resource 'handlers' do
            run HandlerPOST if method :post => 'handler-pair'   # set the handler and argument
          end
        end
      end
    end
  end
)
