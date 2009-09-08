require 'rack'
require  '../../../riddl/lib/ruby/server'
require  '../../../riddl/lib/ruby/utils/fileserve'
require 'pp'

use Rack::ShowStatus
options = {:Port => 9293, :Host => "0.0.0.0", :AccessLog => []}
$0 = "wee-ui"

run(
  Riddl::Server.new("description.xml") do
    cross_site_xhr true

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
        run Riddl::Utils::FileServe, 'content' if method :get => '*'
      end
    end
  end
)
