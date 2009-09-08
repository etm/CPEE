require 'rack'
require  '../../../riddl/lib/ruby/server'
require 'pp'

use Rack::ShowStatus
options = {:Port => 9293, :Host => "0.0.0.0", :AccessLog => []}
$0 = "wee-ui"

$controller = WeeController.new


run(
  Riddl::Server.new("description.xml") do
    on resource do
      run IndexGET if method :get => '*'
      on resource do
        run DetailGET if method :get => '*'
        on resource 'monitor' do
          run MonitorGET if method :get => '*'
          run MonitorPOST if method :post => 'log-format'
        end
      end
      on resource 'static' do
        on resource do
          run Dispatcher if method :get => '*'
        end
      end
    end
  end
)
