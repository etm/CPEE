#!/usr/bin/ruby
require 'rubygems'
require 'riddl/server'
require 'riddl/utils/xsloverlay'
require 'riddl/utils/fileserve'

Riddl::Server.new(File.dirname(__FILE__) + '/declaration.xml', :port => 9297) do

  interface 'xsloverlay' do
    run Riddl::Utils::XSLOverlay, "/xsls/instances.xsl"  if get && declaration_resource == '/'
    run Riddl::Utils::XSLOverlay, "/xsls/info.xsl"       if get && declaration_resource == '/{}'
    run Riddl::Utils::XSLOverlay, "/xsls/properties.xsl" if get && declaration_resource == '/{}/properties'
  end

  interface 'xsls' do
    on resource do
      run Riddl::Utils::FileServe, "xsls" if get
    end  
  end

end.loop!
