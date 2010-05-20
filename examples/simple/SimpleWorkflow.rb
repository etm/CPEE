require ::File.dirname(__FILE__) + '/../../lib/Wee'
require ::File.dirname(__FILE__) + '/../../lib/BasicHandler'

class SimpleWorkflow < Wee
  handlerwrapper BasicHandler
  
  endpoint :ep1 => "orf.at"
  context :a => 17

  control flow do
    activity :a1, :call, :ep1, :a => @a, :b => 2
  end
end
