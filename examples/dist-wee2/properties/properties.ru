#\ -p 9295
require 'pp'
require '../../../../riddl/lib/ruby/server'
require '../../../../riddl/lib/ruby/utils/properties'

use Rack::ShowStatus
$0 = "dist-wee2-properties"

run Riddl::Server.new(File.dirname(__FILE__) + '/properties.xml') {
  a_schema, a_strans = Riddl::Utils::Properties::schema(File.dirname(__FILE__) + '/instances/properties.schema.active')
  i_schema, i_strans = Riddl::Utils::Properties::schema(File.dirname(__FILE__) + '/instances/properties.schema.inactive')

  on resource do |r|
    ### header RIDDL_DECLARATION_PATH holds the full path used in the declaration
    ### from there we get the instance, which is not present in the path used for properties
    instance = if r[:h]['RIDDL_DECLARATION_PATH']
      File.dirname(__FILE__) + '/instances/' + r[:h]['RIDDL_DECLARATION_PATH'].split('/')[1] + '/'
    else 
      File.dirname(__FILE__) + '/instance_test/'
    end  
    properties     = Riddl::Utils::Properties::file(instance + 'properties.xml')
    schema, strans = File.exists?(instance + 'properties.schema.active') ? [a_schema,a_strans] : [i_schema,i_strans]

    use Riddl::Utils::Properties::implementation(properties, schema, strans)
  end
}
