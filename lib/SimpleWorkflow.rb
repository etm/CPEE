require 'Wee'
require 'MyHandler'

class SimpleWorkflow < Wee
  handler MyHandler
  
  control flow do
    activity :a1, :call, "orf.at", 1, 2
  end
end
