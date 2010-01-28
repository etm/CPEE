require ::File.dirname(__FILE__) + '/../../../lib/Wee'
require ::File.dirname(__FILE__) + '/../../../lib/BasicHandler'

class EmptyWorkflow < Wee
  handler BasicHandler
  context :timeout=>5
  endpoint :flight => 'http://sumatra.pri.univie.ac.at/services/delay.php'
  
  control flow do
  end
end

