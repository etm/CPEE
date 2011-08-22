require File.expand_path(::File.dirname(__FILE__) + '/../lib/Wee')
require File.expand_path(::File.dirname(__FILE__) + '/TestHandlerWrapper')

class TestWorkflow < Wee
  handlerwrapper TestHandlerWrapper

  endpoint :endpoint1 => 'http://www.heise.de'
  data :x => 'begin_'
  
  control flow do
    activity :a1_1, :call, :endpoint1 do |result|
      data.x += "#{result}"
    end
    parallel :wait => 2 do
      parallel_branch do
        activity :a2_1_1, :call, :endpoint1
      end
      parallel_branch do
        activity :a2_2_1, :call, :endpoint1
      end
    end
    activity :a3, :manipulate do
      data.x += '_end'
    end
    choose do
      alternative data.x != nil do
        activity :a4a, :call, :endpoint1
      end
      otherwise do
        activity :a4b, :call, :endpoint1
      end
    end
  end
end
