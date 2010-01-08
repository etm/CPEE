#\ -p 9297
require 'fileutils'
require 'pp'
require '../../../../riddl/lib/ruby/server'
require '../../../../riddl/lib/ruby/client'
require '../../../../riddl/lib/ruby/utils/declaration'

use Rack::ShowStatus
$0 = "dist-wee2-declaration"

declaration, description = Riddl::Utils::Declaration::helper('declaration.xml',true)

run Riddl::Server.new(description) {
  process_out false
  on resource do
    run Riddl::Utils::Declaration::Description, description if get 'riddl-description-request'
    run Riddl::Utils::Declaration::Orchestrate, declaration unless get 'riddl-description-request'
  end
}
