#\ -p 9292
require 'pp'
require 'fileutils'
require '../../../riddl/lib/ruby/server'
require '../../../riddl/lib/ruby/utils/properties'
require '../../../riddl/lib/ruby/utils/fileserve'
require 'engine/MarkUS_V3.0'
require 'engine/implementation'

use Rack::ShowStatus
$0 = "dist-wee2"

run Riddl::Server.new(::File.dirname(__FILE__) + '/declaration.xml') {
  accessible_description true

  a_schema, a_strans = Riddl::Utils::Properties::schema(::File.dirname(__FILE__) + '/instances/properties.schema.active')
    i_schema, i_strans = Riddl::Utils::Properties::schema(::File.dirname(__FILE__) + '/instances/properties.schema.inactive')
  
  on resource do
    run Riddl::Utils::Declaration::Description, description_string if get 'riddl-description-request'
    run Instances if get '*'
    run NewInstance if post 'instance-name'
    on resource do
      run Info if get
      run DeleteInstance if delete
      on resource 'properties' do |r|
        instance = File.dirname(__FILE__) + '/instances/' + r[:r][0] + '/'
        properties     = Riddl::Utils::Properties::file(instance + 'properties.xml')
        schema, strans = File.exists?(instance + 'properties.schema.active') ? [a_schema,a_strans] : [i_schema,i_strans]

        use Riddl::Utils::Properties::implementation(properties, schema, strans)
      end
    end  
    on resource 'xsls' do
      on resource do
        run Riddl::Utils::FileServe, "xsls"  if get
      end  
    end  
  end
}
