require 'rack'
require ::File.dirname(__FILE__) + '/includes/server'
require ::File.dirname(__FILE__) + '/includes/utils/fileserve'
require ::File.dirname(__FILE__) + '/includes/utils/erbserve'
require ::File.dirname(__FILE__) + '/lib/monitor'
require 'pp'

use Rack::ShowStatus
options = {:Port => 9296, :Host => "0.0.0.0", :AccessLog => []}
$0 = "wee-ui"

run(
  Riddl::Server.new(::File.dirname(__FILE__) + '/description.xml') do
    on resource do
      run Riddl::Utils::FileServe, 'implementation/index.xhtml' if get
      on resource 'monitor' do
          run MonitorGET if get 'since'
      end
      on resource do
        run Riddl::Utils::FileServe, 'implementation/details.xhtml' if get
        on resource 'monitor' do
          run MonitorGET if get 'since'
          run MonitorPOST if post 'log-format'
          on resource 'actpos' do
            run MonitorPosGET if get
          end
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
