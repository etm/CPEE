require 'Wee'
require 'WebHandlerFactory'

class WebWorkflow < Wee
  include WebHandlerFactory
  
  search true => [SearchPos.new(:a1_1, :at, 'id_123')]      # Define searchmodus=true and positions to start from
  endpoint :endpoint1 => 'http://www.heise.de'  # Define endpoint for activity calls
  endpoint :endpoint2 => 'http://www.orf.at'
  endpoint :endpoint3 => 'http://www.google.com'
  context :x => 'X_Value', :y => 'Y_Value'      # Set context variables
  endstate :normal                              # define a default endstate

  def execute
    activity :a1_1, :call, :endpoint1 do |result|    # Call an endpoint and use the result
      @y = result;                                   # Alter a defined context variable
    end
    return [endstate, position, context]            # Return the ending environment
  end
end
