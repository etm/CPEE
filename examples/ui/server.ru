require 'rack'
require ::File.dirname(__FILE__) + '/../../../riddl/lib/ruby/server'
require ::File.dirname(__FILE__) + '/../../../riddl/lib/ruby/utils/fileserve'
require 'pp'

use Rack::ShowStatus
options = {:Port => 9296, :Host => "0.0.0.0", :AccessLog => []}
$0 = "wee-ui"

class IndexGET < Riddl::Implementation
  def response
    Riddl::Parameter::Complex.new("html", "text/html", File.read(::File.dirname(__FILE__)+"/static/index.html"))
  end
end
class DetailGET < Riddl::Implementation
  def response
    Riddl::Parameter::Complex.new("html", "text/html", File.read(::File.dirname(__FILE__)+"/static/details.html"))
  end
end
class RemoteGET < Riddl::Implementation
  def response
    Riddl::Parameter::Complex.new("url", "text/plain", "http://localhost:9295/")
  end
end

run(
  Riddl::Server.new(::File.dirname(__FILE__) + '/description.xml') do
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
      on resource 'remote' do
        run RemoteGET if method :get => '*'
      end
      on resource 'static' do
        run Riddl::Utils::FileServe, 'content' if method :get => '*'
      end
    end
  end
)
