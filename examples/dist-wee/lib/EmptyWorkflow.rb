require ::File.dirname(__FILE__) + '/../../../lib/Wee'
require ::File.dirname(__FILE__) + '/../../../lib/BasicHandler'

class EmptyWorkflow < Wee
  handler BasicHandler
  
  context :delay => 5
  context :longdelay => 99

  endpoint :hotel => 'http://www.marriot.com'
  endpoint :flight => 'http://www.aerlingus.com'
  
  control flow do
  end
end

