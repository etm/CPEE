require 'weel'
Dir[::File.dirname(__FILE__) + "/handlerwrappers/*"].each do |h|
  require h
end  

class EmptyWorkflow < WEEL
  handlerwrapper DefaultHandlerWrapper

  control flow do
    # control flow will be set externally
  end
end

