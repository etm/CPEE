#!/usr/bin/ruby
$port = 9298
$host = 'http://localhost'
$mode = :debug # :production

if File.exists?(File.expand_path(File.dirname(__FILE__) + '/server.config.rb'))
  require File.expand_path(File.dirname(__FILE__) + '/server.config')
end  

$0    = "CPEE"
$url  = $host + ':' + $port.to_s

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

rsrv = Riddl::Server.new(::File.dirname(__FILE__) + '/server.declaration.xml',File.expand_path(::File.dirname(__FILE__))) do
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

########################################################################################################################
# parse arguments
########################################################################################################################
verbose = false
operation = "start"
ARGV.options { |opt|
  opt.summary_indent = ' ' * 4
  opt.banner = "Usage:\n#{opt.summary_indent}ruby server.rb [options] start|stop|restart|info\n"
  opt.on("Options:")
  opt.on("--verbose", "-v", "Do not daemonize. Write ouput to console.") { verbose = true }
  opt.on("--help", "-h", "This text.") { puts opt; exit }
  opt.separator(opt.summary_indent + "start|stop|restart|info".ljust(opt.summary_width+1) + "Do operation start, stop, restart or get information")
  opt.parse!
}
unless %w{start stop restart info}.include?(ARGV[0])
  puts ARGV.options
  exit
end
operation = ARGV[0]

########################################################################################################################
# status and info
########################################################################################################################
pid = File.read('server.pid') rescue pid = 666
status = `ps -u #{Process.uid} | grep "#{pid} "`.scan(/ server\.[^\s]+/)
if operation == "info" && status.empty?
  puts "Server (#{$url}) not running"
  exit
end
if operation == "info" && !status.empty?
  puts "Server (#{$url}) running as #{pid}"
  stats = `ps -o "vsz,rss,stime,time" -p #{pid}`.split("\n")[1].strip.split(/ +/)
  puts "Virtual:  #{"%0.2f" % (stats[0].to_f/1024)} MiB"
  puts "Resident: #{"%0.2f" % (stats[1].to_f/1024)} MiB"
  puts "Started:  #{stats[2]}"
  puts "CPU Time: #{stats[3]}"
  exit
end
if operation == "start" && !status.empty?
  puts "Server (#{$url}) already started"
  exit
end

########################################################################################################################
# stop/restart server
########################################################################################################################
if %w{stop restart}.include?(operation)
  if status.empty?
    puts "Server (#{$url}) maybe not started?"
  else
    puts "Server (#{$url}) stopped"
    `kill #{pid}`
    puts "Waiting for 2 seconds to accomplish ..."
    sleep 2 if operation == "restart"
  end
  exit unless operation == "restart"
end

########################################################################################################################
# start server
########################################################################################################################
server = if verbose
  Rack::Server.new(
    :app => rsrv,
    :Port => $port,
    :environment => ($mode == :debug ? 'development' : 'deployment'),
    :server => 'mongrel',
    :pid => File.expand_path(File.dirname(__FILE__) + '/server.pid')
  )
else
  server = Rack::Server.new(
    :app => rsrv,
    :Port => $port,
    :environment => 'none',
    :server => 'mongrel',
    :pid => File.expand_path(File.dirname(__FILE__) + '/server.pid'),
    :daemonize => true
  )
end

puts "Server (#{$url}) started"
server.start
