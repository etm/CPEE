#!/usr/bin/ruby
$url  = 'http://localhost:9298'
$mode = :debug # :production
$0 = "cpee"

if File.exists?(File.expand_path(File.dirname(__FILE__) + '/server.config.rb'))
  require File.expand_path(File.dirname(__FILE__) + '/server.config')
end  

require 'pp'
require 'fileutils'
require 'rubygems'
require 'riddl/server'
require 'riddl/client'
require 'riddl/utils/notifications_producer'
require 'riddl/utils/properties'
require 'riddl/utils/fileserve'
require 'riddl/utils/declaration'
require './engine/implementation'

rsrv = Riddl::Server.new(::File.dirname(__FILE__) + '/server.declaration.xml') do
  accessible_description true
  cross_site_xhr true

  a_schema, a_strans = Riddl::Utils::Properties::schema(::File.dirname(__FILE__) + '/instances/properties.schema.active')
  i_schema, i_strans = Riddl::Utils::Properties::schema(::File.dirname(__FILE__) + '/instances/properties.schema.inactive')
  f_schema, f_strans = Riddl::Utils::Properties::schema(::File.dirname(__FILE__) + '/instances/properties.schema.finished')
  xsls = {
    :overview => '/xsls/overview.xsl',
    :subscriptions => '/xsls/subscriptions.xsl'
  }
  
  on resource do
    run Instances if get '*'
    run NewInstance, $url if post 'instance-name'
    on resource do
      run Info if get
      run DeleteInstance if delete
      on resource 'properties' do |r|
        instance       = ::File.dirname(__FILE__) + '/instances/' + r[:r][0] + '/'
        properties     = Riddl::Utils::Properties::file(instance + 'properties.xml')
        schema, strans = case $controller[r[:r][0].to_i].state
          when :ready, :stopped; [i_schema,i_strans]
          when :running, :stopping; [a_schema,a_strans]
          when :finished; [f_schema,f_strans]
        end
        use Riddl::Utils::Properties::implementation(properties, schema, strans, PropertiesHandler, r[:match].count, $mode)
      end
      on resource 'notifications' do |r|
        ndir = ::File.dirname(__FILE__) + '/instances/' + r[:r][0] + '/notifications/'
        use Riddl::Utils::Notifications::Producer::implementation(ndir,xsls, NotificationsHandler, $mode)
      end
      on resource 'callbacks' do
        run Callbacks, $mode if get
        on resource do
          run ExCallback if get || put || post || delete
        end  
      end  
    end  
    on resource 'xsls' do
      on resource do
        run Riddl::Utils::FileServe, "xsls" if get
      end  
    end  
  end
end

Rack::Handler::Mongrel.run Rack::ShowStatus.new(rsrv), :Port => 9298
