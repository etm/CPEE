require 'Wee'
require 'MyHandlerFactory'

class Workflow < Wee
  include MyHandlerFactory
  
  search true, [:a1_1]                          # Define searchmodus=true and positions to start from
  endpoint :endpoint1 => 'http://www.heise.de'  # Define endpoint for activity calls
  endpoint :endpoint2 => 'http://www.orf.at'
  context :x => 'X_Value', :y => 'Y_Value'      # Set context variables
  endstate :normal                              # define a default endstate

  def execute
    activity :a1_1, :call, :endpoint1 do |result|    # Call an endpoint and use the result
      @y = result;                                   # Alter a defined context variable
    end
    activity :a1_2, :call, :endpoint2, @x, @y       # Call an endpoint with parameters
    context :z => 'Z_Value'                         # Defines a new context variable
    context :x => 'X_NewValue'                      # Alternative way to set a context variable
    parallel :wait => 1 do                               # Define a parallel execution, waiting for all branches to complete before further processing
      parallel_branch do                            # Define a parallel execution branch
        activity :a2_1_1, :call, :endpoint1
        activity :a2_1_2, :call, :endpoint1
        activity :a2_1_3, :call, :endpoint1
        activity :a2_1_4, :call, :endpoint1
        activity :a2_1_5, :call, :endpoint1
        activity :a2_1_6, :call, :endpoint1
        activity :a2_1_7, :call, :endpoint1
      end
      parallel_branch do
        activity :a2_2_1, :call, :endpoint1
      end
    end
    activity :a3, :manipulate do                    # Define a free codeblock to be executed
      @z = 'Z_NewValue'
    end
    switch do
      alternative(false) do
        activity :a4b, :manipulate do
          $LOG.debug('Workflow.execute'){"Switch NOT successflu, has taken false-path"}
        end
      end
      alternative(true) do
        activity :a4b, :manipulate do
          $LOG.debug('Workflow.execute'){"Switch successful, has taken true-path"}
        end
      end
      alternative do
        activity :a4c, :manipulate do
          $LOG.debug('Workflow.execute'){"Switch NOT successful, has taken else-path"}
        end
      end
    end

    return [endstate, position, context]            # Return the ending environment
  end
end
