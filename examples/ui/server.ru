require 'rack'
require ::File.dirname(__FILE__) + '/../../../riddl/lib/ruby/server'
require ::File.dirname(__FILE__) + '/../../../riddl/lib/ruby/utils/fileserve'
require ::File.dirname(__FILE__) + '/../../../riddl/lib/ruby/utils/erbserve'
require ::File.dirname(__FILE__) + '/lib/monitor'
require 'pp'

use Rack::ShowStatus
options = {:Port => 9296, :Host => "0.0.0.0", :AccessLog => []}
$0 = "wee-ui"

run(
  Riddl::Server.new(::File.dirname(__FILE__) + '/description.xml') do
    on resource do
      run Riddl::Utils::FileServe, 'implementation/index.html' if get
      on resource 'monitor' do
          run MonitorGET if get
      end
      on resource do
        run Riddl::Utils::FileServe, 'implementation/details.html' if get
        on resource 'monitor' do
          run MonitorGET if get
          run MonitorPOST if post 'log-format'
        end
      end
      on resource "styles" do
        run Riddl::Utils::ERBServe, 'styles' if get
      end
      on resource 'remote' do
        run  Riddl::Utils::FileServe, 'implementation/remote.txt' if get
      end
      on resource 'static' do
        run Riddl::Utils::FileServe, 'static' if get
      end
    end
  end
)
