require 'rack'
require  '../../../riddl/lib/ruby/server'

use Rack::ShowStatus

options = {:Port => 9293, :Host => "0.0.0.0", :AccessLog => []}
$0 = "hallo"
run(
  Riddl::Server.new("description.xml") do
    on resource do
    end
  end
)
