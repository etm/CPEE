require 'rack'
require 'pp'
require '../../../riddl/lib/ruby/server'
require ::File.dirname(__FILE__) + '/lib/instances'

use Rack::ShowStatus
options[:Port] = 9296
$0 = "dist-wee2-main"

$controller = WeeController.new

run Riddl::Server.new(::File.dirname(__FILE__) + '/main.desc') {
  on resource do
    run Instances if get '*'
    run NewInstance if post 'instance-name'
    on resource do
      run DeleteInstance if delete
    end  
  end
}
