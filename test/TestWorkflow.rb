require ::File.dirname(__FILE__) + '/../lib/Wee'
require ::File.dirname(__FILE__) + '/TestHandlerWrapper'

class TestWorkflow < Wee
  handlerwrapper TestHandlerWrapper

  search Wee::Position.new(:a1_1, :at)
  endpoint :endpoint1 => 'http://www.heise.de'
  context :x => 'begin_'
  
  control flow do
    activity [1], :call, :endpoint1 do |result|
      @x += result
    end
    parallel :wait => 2 do
      parallel_branch do
        activity [2,1], :call, :endpoint1
      end
      parallel_branch do
        activity [2,2], :call, :endpoint1
      end
    end
    activity [3], :manipulate do
      @x += '_end'
    end
    choose do
      alternative(@x != nil) do
        activity [4,1], :call, :endpoint1
      end
      otherwise do
        activity [4,2], :call, :endpoint1
      end
    end
  end
end
