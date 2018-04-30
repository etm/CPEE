#!/usr/bin/ruby
require 'rubygems'
require 'cpee/implementation'

Riddl::Server.new(CPEE::SERVER, :host => 'localhost', :port => 8298) do |opts|
  opts[:instances]          = File.join(__dir__,'instances')
  opts[:handlerwrappers]    = File.join(__dir__,'handlerwrappers')
  opts[:notifications_init] = File.join(__dir__,'resources','notifications')
  opts[:properties_init]    = File.join(__dir__,'resources','properties.init')

  accessible_description true
  cross_site_xhr true

  use CPEE::implementation(opts)
end.loop!
