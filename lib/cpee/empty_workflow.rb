require 'weel'
require ::File.dirname(__FILE__) + '/../../server/handlerwrappers/default'

class EmptyWorkflow < WEEL
  handlerwrapper DefaultHandlerWrapper

  control flow do
    # control flow will be set externally
  end
end
