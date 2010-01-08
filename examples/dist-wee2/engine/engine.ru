#\ -p 9296
require 'fileutils'
require 'pp'
require '../../../../riddl/lib/ruby/server'
require '../../../../riddl/lib/ruby/utils/fileserve'

require ::File.dirname(__FILE__) + '/engine/implementation'

use Rack::ShowStatus
$0 = "dist-wee2-main"

run Riddl::Server.new(::File.dirname(__FILE__) + '/engine.xml') {
  on resource do
    run Instances if get '*'
    run NewInstance if post 'instance-name'
    on resource do
      run Info if get
      run DeleteInstance if delete
    end  
    on resource 'xsls' do
      on resource do
        run Riddl::Utils::FileServe, "xsls"  if get
      end  
    end  
  end
}
