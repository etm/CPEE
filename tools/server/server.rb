#!/usr/bin/ruby
require 'rubygems'
require 'cpee/implementation'

Riddl::Server.new(CPEE::SERVER, :host => 'localhost', :port => 8298) do
  @riddl_opts[:instances] = ::File.dirname(__FILE__) + '/instances'
  @riddl_opts[:handlerwrappers] = ::File.dirname(__FILE__) + '/handlerwrappers'
  @riddl_opts[:notifications_init] = ::File.dirname(__FILE__) + '/resources/notifications'
  @riddl_opts[:properties_init] = ::File.dirname(__FILE__) + '/resources/properties.init'
  accessible_description true
  cross_site_xhr true

  use CPEE::implementation(@riddl_opts)
end.loop!
