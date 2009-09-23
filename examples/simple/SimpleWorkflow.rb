require ::File.dirname(__FILE__) + '/../lib/Wee'
require ::File.dirname(__FILE__) + '/../lib/BasicHandler'

class SimpleWorkflow < Wee
  handler BasicHandler
  
  control flow do
    activity :a1, :call, "orf.at", 1, 2
  end
end
