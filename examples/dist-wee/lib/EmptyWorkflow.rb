require ::File.dirname(__FILE__) + '/../../../lib/Wee'
require ::File.dirname(__FILE__) + '/../../../lib/BasicHandler'

class EmptyWorkflow < Wee
  handler BasicHandler
  context :x => 1
  context :y => 2
  endpoint :hotel => 'http://www.marriot.com'
  endpoint :flight => 'http://www.aerlingus.com'
  
  control flow do
  end
end

