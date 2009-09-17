require ::File.dirname(__FILE__) + '/../../../lib/Wee'
require ::File.dirname(__FILE__) + '/../../../lib/MyHandler'

class EmptyWorkflow < Wee
  handler MyHandler
  context :x => 1
  context :y => 2
  endpoint :hotel => 'http://www.marriot.com'
  endpoint :flight => 'http://www.aerlingus.com'
  
  control flow do
  end
end

