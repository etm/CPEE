require ::File.dirname(__FILE__) + '/../../lib/Wee'
require ::File.dirname(__FILE__) + '/../../lib/BasicHandler'

class SimpleWorkflow < Wee
  handler BasicHandler
  
  endpoint :ep1 => "orf.at"

  control flow do
    activity :a1, :call, :ep1, :a => 1, :b => 2
  end
end
