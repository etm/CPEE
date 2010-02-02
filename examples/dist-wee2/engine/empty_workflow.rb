require ::File.dirname(__FILE__) + '/../../../lib/Wee'
require ::File.dirname(__FILE__) + '/handler'

class EmptyWorkflow < Wee
  handler Handler

  control flow do
    # control flow will be set externally
  end
end

