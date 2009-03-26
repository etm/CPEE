require 'Wee'
require 'MyHandlerFactory'

class Workflow < Wee
  include MyHandlerFactory
  
  search true => [SearchPos.new(:a1_2, :at, 'id_123')]      # Define searchmodus=true and positions to start from
  endpoint :endpoint1 => 'http://www.heise.de'  # Define endpoint for activity calls
  endpoint :endpoint2 => 'http://www.orf.at'
  endpoint :endpoint3 => 'http://www.google.com'
  context :x => 'X_Value', :y => 'Y_Value'      # Set context variables
  context :a => 'XXXX'
  endstate :normal                              # define a default endstate

  def execute
    activity :a1_1, :call, :endpoint1 do |result|    # Call an endpoint and use the result
      @y = result;                                   # Alter a defined context variable
    end
    activity :a1_2, :call, :endpoint2, @x, @y       # Call an endpoint with parameters
    context :z => 'Z_Value'                         # Defines a new context variable
    context :x => 'X_NewValue'                      # Alternative way to set a context variable
    parallel :wait => 2 do                          # Define a parallel execution, waiting for 2 branches to complete before further processing
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
        activity :a2_2_2, :call, :endpoint1
        activity :a2_2_3, :call, :endpoint1
        activity :a2_2_4, :call, :endpoint1
        activity :a2_2_5, :call, :endpoint1
      end
    end
    activity :a3, :manipulate do                    # Define a free codeblock to be executed
      @z = 'Z_NewValue'
    end
    switch do
      alternative(true) do
        activity :a4a, :call, :endpoint1
      end
      alternative do
        activity :a4b, :call, :endpoint2
      end
    end

    return [endstate, position, context]            # Return the ending environment
  end

  def replace_execute(&block)
    instance_eval() {
      def execute
        yield(block)
      end
    }
  end
end
