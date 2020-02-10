#!/usr/bin/ruby
require_relative 'azure_logger'

Riddl::Server.new(File.join(__dir__,'/log.xml'), :host => 'localhost', :port => 9398) do
  accessible_description true
  cross_site_xhr true
  interface 'events' do
	  run Logging if post 'event'
  end
end.loop!
