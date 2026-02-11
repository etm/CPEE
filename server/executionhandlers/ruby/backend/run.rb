require 'cpee/constants'
require 'yaml'
opts = YAML::load_file(File.join(__dir__,'opts.yaml'))
opts[:pidf] = __FILE__ + '.pid'
opts[:pid] = Process.pid

opts[:global_executionhandlers] = CPEE::GLOBAL_EXECUTIONHANDLERS unless opts[:global_executionhandlers]
['controller.rb','connection.rb'].each do |f|
  global_thing = File.join(opts[:global_executionhandlers],opts[:executionhandler],f)
  thing        = File.join(opts[:executionhandlers],       opts[:executionhandler],f)
  if File.exist? global_thing
    require global_thing
  elsif File.exist? thing
    require thing
  end
end

require_relative 'instance'
controller = Controller.new(File.basename(__dir__).to_i, __dir__, opts)
controller.instance = Instance.new controller

File.write(opts[:pidf],opts[:pid])

%w{TERM HUP INT}.each do |sig|
  Signal.trap(sig) do
    puts "Caught #{sig}!"
    controller.stop
  end
end

controller.start
File.unlink(opts[:pidf])
