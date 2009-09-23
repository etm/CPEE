require ::File.dirname(__FILE__) + '/../lib/Wee'
require ::File.dirname(__FILE__) + '/MyHandler'

class SimpleWorkflow < Wee
  handler MyHandler
  
  control flow do
    endpoint :ep1 => "orf.at"
    activity :a1, :call, ep1, 1, 2
  end
end
