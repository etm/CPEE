require 'rack'
require 'pp'
require '../../../riddl/lib/ruby/server'
require '../../../riddl/lib/ruby/utils/properties'

use Rack::ShowStatus
options[:Port] = 9295
$0 = "dist-wee2-properties"

run Riddl::Server.new(File.dirname(__FILE__) + '/properties.desc') {
  schema, strans = Riddl::Utils::Properties::Helper::schema(File.dirname(__FILE__) + '/properties.schema')

  on resource do |r|
    ### header RIDDL_DECLARATION_PATH holds the full path used in the declaration
    ### from there we get the instance, which is not present in the path used for properties
    fproperties = File.dirname(__FILE__) + '/Data/' + r[:h]['RIDDL_DECLARATION_PATH'].split('/')[1] + '/properties.xml'
    properties  = Riddl::Utils::Properties::Helper::properties(fproperties)

    run Riddl::Utils::Properties::All, properties, schema, strans if get
    run Riddl::Utils::Properties::Query, properties, schema, strans if get 'query'
    on resource 'schema' do
      run Riddl::Utils::Properties::Schema, properties, schema, strans if get
      on resource 'rng' do
        run Riddl::Utils::Properties::RngSchema, properties, schema, strans if get
      end  
    end
    on resource 'values' do
      run Riddl::Utils::Properties::Keys, properties, schema, strans if get
      run Riddl::Utils::Properties::AddPair, properties, schema, strans if post 'key-value-pair'
      on resource do |res|
        run Riddl::Utils::Properties::AddPair, properties, schema, strans if post 'key-value-pair'
        run Riddl::Utils::Properties::Values, properties, schema, strans if get
        run Riddl::Utils::Properties::Delete, properties, schema, strans if delete
        run Riddl::Utils::Properties::Put, properties, schema, strans if put 'value'
      end
    end  
  end
}
