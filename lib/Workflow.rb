require 'Wee'
require 'MyHandler'

class Workflow < Wee
  handler MyHandler
  
  search true => Wee::SearchPos.new(:a1_1, :at, 'id_123')      # Define searchmodus=true and positions to start from
  endpoint :endpoint1 => 'http://www.heise.de'  # Define endpoint for activity calls
  endpoint :endpoint2 => 'http://www.orf.at'
  endpoint :endpoint3 => 'http://www.google.com'
  context :x => 'X_Value', :y => 'Y_Value'      # Set context variables
  context :a => 'XXXX'
  endstate :normal                              # define a default endstate

  control flow do
    activity :a1, :call, endpoint1
    activity :a2, :call, endpoint1 do |result|
      @x += result;
    end
    activity :a3, :call, endpoint1, @x
  end
end
