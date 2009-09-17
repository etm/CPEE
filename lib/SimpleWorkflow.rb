require 'Wee'
require 'MyHandler'

class SimpleWorkflow < Wee
  handler MyHandler
  
  control flow do
    
  end
end
