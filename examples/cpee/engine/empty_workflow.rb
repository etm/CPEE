require ::File.dirname(__FILE__) + '/../../../lib/Wee'
Dir[::File.dirname(__FILE__) + "/handlerwrappers/*"].each do |h|
  require h
end  

class EmptyWorkflow < Wee
  handlerwrapper DefaultHandlerWrapper

  control flow do
    # control flow will be set externally
  end
end

