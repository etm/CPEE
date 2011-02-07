require ::File.dirname(__FILE__) + '/../../lib/Wee'
require ::File.dirname(__FILE__) + '/SimpleHandlerWrapper'

class SimpleWorkflow < Wee
  handlerwrapper SimpleHandlerWrapper
  
  endpoint :ep1 => "orf.at"
  data :a => 17

  control flow do
    activity :a1, :call, :ep1, :a => data.a, :b => 2 do
      data.a += 3
    end
  end
end
