#!/usr/bin/ruby

require 'weel'
require_relative File.join('..','lib','cpee','controller2')
require_relative File.join('handlerwrappers','default')

class Instance < WEEL
  handlerwrapper DefaultHandlerWrapper

  endpoint :timeout => "http://gruppe.wst.univie.ac.at/~mangler/services/timeout.php"
  data :x => nil

  control flow do
    call :a1, :timeout, parameters: { :label => "Step 1", :method => :post, :arguments => [⭐(:name => :timeout, :value => ->{ "2" })] }, finalize: <<-END
			data.x += \"a1,\"
		END
		call :a2, :timeout, parameters: { :label => "Step 2", :method => :post, :arguments => [⭐(:name => :timeout, :value => ->{ "4" })] }, finalize: <<-END
			data.x += \"a2,\"
		END
		call :a3, :timeout, parameters: { :label => "Step 3", :method => :post, :arguments => [⭐(:name => :timeout, :value => ->{ "4" })] }, finalize: <<-END
			data.x += \"a3,\"
		END
  end
end

controller = CPEE::Controller.new(12, :host => 'localhost', :url => '/12')
instance = Instance.new(controller)
execution = instance.start
execution.join()
