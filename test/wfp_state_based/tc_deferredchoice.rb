require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

# implemented as a combination of the Cancelling Structured Partial Join and the Exclusive Choice Pattern
class TestWFPDeferredChoice < Test::Unit::TestCase
  include TestMixin

  def test_sequence
    @wf.description do
      parallel :wait=>1 do
        parallel_branch do
          activity :a1_1, :call, :endpoint1 do
            data.choice = 1
          end
        end
        parallel_branch do
          activity(:a1_2, :call, :endpoint1, :call => Proc.new{sleep 1.0}) do
            data.choice = 2
          end
        end
      end
      choose do
        alternative(data.choice == 1) do
          activity :a2_1, :call, :endpoint1
        end
        alternative(data.choice == 2) do
          activity :a2_2, :call, :endpoint1
        end
      end
    end
    @wf.start.join
    wf_assert('CALL a1_1')
    wf_assert('CALL a1_2')
    wf_sassert('Da1_1NLNa1_2Ca2_1Da2_1|finished|')
    data = @wf.data
    assert(data[:choice] == 1, "data[:choice] has not the correct value [#{data[:x]}]")
  end
end
