require ::File.dirname(__FILE__) + '/../../../lib/Wee'
require ::File.dirname(__FILE__) + '/../../../lib/BasicHandler'

class EmptyWorkflow < Wee
  handler BasicHandler

  control flow do
  end
end

