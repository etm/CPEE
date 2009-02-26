require 'Wee'
require 'MyHandler'

class Workflow < Wee
  include MyHandler

  search true, [:a2_1_1, :a2_2_4]
  endpoint :endpoint1 => 'http://www.heise.de'
  endpoint :endpoint2 => 'http://www.orf.at'
  context :x => '', :y => 0
  endstatus :success # :stopped

  def execute
    puts "=== Staring execution ==="
    activity :a1_1, :call, :endpoint1 do |result|
      @x = result;
    end
    activity :a1_2, :call, :endpoint1
    activity :a1_3, :manipulate do
      @y = 1;
    end
    parallel :wait do
      parallel_branch do
        activity :a2_1_1, :call, :endpoint1
        activity :a2_1_2, :call, :endpoint1
        activity :a2_1_3, :call, :endpoint1
        activity :a2_1_4, :call, :endpoint1
        activity :a2_1_5, :call, :endpoint1
      end
      parallel_branch do
        activity :a2_2_1, :call, :endpoint1
        activity :a2_2_2, :call, :endpoint1 # stopped
        activity :a2_2_3, :call, :endpoint1
        activity :a2_2_4, :call, :endpoint1
        activity :a2_2_5, :call, :endpoint1
      end
    end
    activity :a3, :call, :endpoint1
    return [endstatus,context]
  end
end
