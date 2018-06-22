#!/usr/bin/ruby
require_relative 'elasticsearch_logging'


Riddl::Server.new(File.join(__dir__,'/log.xml'), :host => 'localhost', :port => 9307) do
  accessible_description true
  cross_site_xhr true
  @riddl_opts[:template] ||= File.join(__dir__,'template.xes_yaml')
	@riddl_opts[:esc] = Elasticsearch::Client.new hosts: ['localhost:8400']


  interface 'events' do
	  run Logging, @riddl_opts[:esc], @riddl_opts[:template] if post 'event'
  end
end.loop!
