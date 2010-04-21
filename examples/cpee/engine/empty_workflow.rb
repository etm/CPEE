require ::File.dirname(__FILE__) + '/../../../lib/Wee'
require ::File.dirname(__FILE__) + '/handler_rescue'


class EmptyWorkflow < Wee
  handler RescueHandler

  control flow do
    # control flow will be set externally
  end
end

