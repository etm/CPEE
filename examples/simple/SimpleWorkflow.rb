require ::File.dirname(__FILE__) + '/../../lib/Wee'
require ::File.dirname(__FILE__) + '/../../lib/BasicHandler'

class SimpleWorkflow < Wee
  handler BasicHandler
  
  control flow do
    endpoint :ep1 => "orf.at"
    activity :a1, :call, ep1, :a => 1, :b => 2
  end
end
