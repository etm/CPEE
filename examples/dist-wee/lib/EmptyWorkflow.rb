require '../../lib/Wee'
require '../../lib/MyHandler'

class EmptyWorkflow < Wee
  handler MyHandler

  control flow do
  end
end

