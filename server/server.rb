#!/usr/bin/ruby
$0    = "CPEE"

require 'pp'
require 'fileutils'
require 'rubygems'
require 'riddl/server'
require 'riddl/client'
require 'riddl/utils/notifications_producer'
require 'riddl/utils/properties'
require 'riddl/utils/fileserve'
require 'riddl/utils/declaration'
require 'riddl/utils/downloadify'
require File.expand_path(File.dirname(__FILE__) + '/engine/implementation')

### sets $basepath
### defaults $host => localhost, $port => 9298, $mode => debug
### reads server.config.rb, so this file can be use to change these values
Riddl::Server::config!(File.expand_path(File.dirname(__FILE__)))

### construct and run server
Riddl::Server.new($basepath + '/server.declaration.xml') do
  accessible_description true
  cross_site_xhr true

  a_schema, a_strans = Riddl::Utils::Properties::schema($basepath + '/instances/properties.schema.active')
  i_schema, i_strans = Riddl::Utils::Properties::schema($basepath + '/instances/properties.schema.inactive')
  f_schema, f_strans = Riddl::Utils::Properties::schema($basepath + '/instances/properties.schema.finished')
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
        instance       = $basepath + '/instances/' + r[:r][0] + '/'
        properties     = Riddl::Utils::Properties::file(instance + 'properties.xml')
        schema, strans = case $controller[r[:r][0].to_i].state
          when :ready, :stopped; [i_schema,i_strans]
          when :running, :stopping; [a_schema,a_strans]
          when :finished; [f_schema,f_strans]
        end
        use Riddl::Utils::Properties::implementation(properties, schema, strans, PropertiesHandler, r[:match].count, $mode)
      end
      on resource 'notifications' do |r|
        ndir = $basepath + '/instances/' + r[:r][0] + '/notifications/'
        use Riddl::Utils::Notifications::Producer::implementation(ndir,xsls, NotificationsHandler, $mode)
      end
      on resource 'callbacks' do
        run Callbacks, $mode if get
        on resource do
          run ExCallback if get || put || post || delete
        end  
      end  
    end  
    on resource 'downloadify' do
      on resource do
        run Riddl::Utils::Downloadify if get 'dfin'
        run Riddl::Utils::Downloadify if post 'dfin'
      end
    end
    on resource 'xsls' do
      on resource do
        run Riddl::Utils::FileServe, "xsls" if get
      end  
    end  
  end
end.loop!
