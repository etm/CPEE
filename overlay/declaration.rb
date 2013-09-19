#!/usr/bin/ruby
require 'rubygems'
require 'riddl/server'
require 'riddl/utils/xsloverlay'
require 'riddl/utils/fileserve'

Riddl::Server.new(File.dirname(__FILE__) + '/declaration.xml', :port => 9297) do
  accessible_description false

  interface 'xsloverlay' do
    run Riddl::Utils::XSLOverlay, "/xsls/instances.xsl"     if get('xmlin') && declaration_resource == '/'
    run Riddl::Utils::XSLOverlay, "/xsls/info.xsl"          if get('xmlin') && declaration_resource == '/{}'
    run Riddl::Utils::XSLOverlay, "/xsls/properties.xsl"    if get('xmlin') && declaration_resource == '/{}/properties'
    run Riddl::Utils::XSLOverlay, "/xsls/notifications.xsl" if get('xmlin') && declaration_resource == '/{}/notifications'
    run Riddl::Utils::XSLOverlay, "/xsls/subscriptions.xsl" if get('xmlin') && declaration_resource == '/{}/notifications/subscriptions'
    run Riddl::Utils::XSLOverlay, "/xsls/values.xsl"        if get('xmlin') && declaration_resource == '/{}/properties/values'
    run Riddl::Utils::XSLOverlay, "/xsls/subs.xsl"          if get('xmlin') && declaration_resource == '/{}/notifications/subscriptions/{}'
    run Riddl::Utils::XSLOverlay, "/xsls/callback.xsl"      if get('xmlin') && declaration_resource == '/{}/callbacks'
    run Riddl::Utils::XSLOverlay, "/xsls/topics.xsl"        if get('xmlin') && declaration_resource == '/{}/notifications/topics'
  end

  interface 'xsls' do
    on resource do
      run Riddl::Utils::FileServe, "xsls" if get
    end  
  end

end.loop!
