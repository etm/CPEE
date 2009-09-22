require ::File.dirname(__FILE__) + '/../lib/Wee'
require ::File.dirname(__FILE__) + '/MyHandler'

class SimpleWorkflow < Wee
  handler MyHandler
  
  control flow do
    activity :a1, :call, "orf.at", 1, 2
  end
end
