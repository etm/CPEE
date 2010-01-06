#\ -p 9295
require 'pp'
require '../../../riddl/lib/ruby/server'
require '../../../riddl/lib/ruby/utils/properties'

use Rack::ShowStatus
$0 = "dist-wee2-properties"

run Riddl::Server.new(File.dirname(__FILE__) + '/properties.desc') {
  schema, strans = Riddl::Utils::Properties::schema(File.dirname(__FILE__) + '/properties.schema')

  on resource do |r|
    ### header RIDDL_DECLARATION_PATH holds the full path used in the declaration
    ### from there we get the instance, which is not present in the path used for properties
    fproperties = File.dirname(__FILE__) + '/Data/' + r[:h]['RIDDL_DECLARATION_PATH'].split('/')[1] + '/properties.xml'
    properties  = Riddl::Utils::Properties::file(fproperties)

    use Riddl::Utils::Properties::implementation(properties, schema, strans)
  end
}
