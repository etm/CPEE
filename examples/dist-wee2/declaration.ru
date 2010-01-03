require 'rack'
require 'fileutils'
require 'pp'
require '../../../riddl/lib/ruby/server'
require '../../../riddl/lib/ruby/client'
require '../../../riddl/lib/ruby/utils/declaration'

use Rack::ShowStatus
options[:Port] = 9297
$0 = "dist-wee2-declaration"

riddl = Riddl::Wrapper.new('declaration.xml')
unless riddl.declaration?
  puts 'Not a RIDDL declaration.' 
  exit
end
unless riddl.validate!
  puts "Does not conform to specification."
  exit
end

d = riddl.declaration
s = d.description_xml(true)

run Riddl::Server.new(s) {
  process_out false
  on resource do
    run Riddl::Utils::Declaration::Description, s if get 'riddl-description-request'
    run Riddl::Utils::Declaration::Orchestrate, riddl unless get 'riddl-description-request'
  end
}
