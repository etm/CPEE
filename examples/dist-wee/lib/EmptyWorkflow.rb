require ::File.dirname(__FILE__) + '/../../../lib/Wee'
require ::File.dirname(__FILE__) + '/../../../lib/BasicHandler'

class EmptyWorkflow < Wee
  handler BasicHandler
  
  context :delay => 5
  context :longdelay => 99
  context :text => "Hello out there"

  endpoint :hotel => 'http://www.marriot.com'
  endpoint :flight => 'http://www.aerlingus.com'
  endpoint :twitter => 'http://sumatra.pri.univie.ac.at/services/twitter.php'
  
  control flow do
  end
end

