#!/usr/bin/ruby
require 'pp'
require 'fileutils'
require 'rubygems'
require 'riddl/server'
require 'riddl/client'
require 'riddl/utils/notifications_producer'
require 'riddl/utils/properties'
require File.expand_path(File.dirname(__FILE__) + '/../lib/cpee/implementation')

Riddl::Server.new(CPEE::SERVER, :port => 9298) do
  accessible_description true
  cross_site_xhr true

  use CPEE::implementation(@riddl_opts)
end.loop!
