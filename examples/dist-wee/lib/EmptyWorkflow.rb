require ::File.dirname(__FILE__) + '/../../../lib/Wee'
require ::File.dirname(__FILE__) + '/../../../lib/MyHandler'

class EmptyWorkflow < Wee
  handler MyHandler

  control flow do
  end
end

