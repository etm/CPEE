require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

class TestWFPMultiChoice < Test::Unit::TestCase
  include TestMixin

  def test_multichoice_chained
    @wf.data :x => 1
    @wf.description do
      choose do
        alternative(data.x == 1) do
          activity :a1_1, :call, :endpoint1
        end
        alternative(data.x > 0) do
          activity :a1_2, :call, :endpoint1
        end
      end
      activity :a2, :call, :endpoint1
    end
    @wf.start.join
    wf_sassert('|running|Ca1_1Da1_1Ca1_2Da1_2Ca2Da2|finished|')
  end
  def test_multichoice_parallel
    @wf.data :x => 1
    @wf.description do
      choose do
        parallel do
          parallel_branch do
            alternative(data.x == 1) do
              activity :a1_1, :call, :endpoint1
            end
          end
          parallel_branch do
            alternative(data.x > 0) do
              activity :a1_2, :call, :endpoint1, :call => Proc.new{sleep 0.1}
            end
          end
        end
      end
      activity :a2, :call, :endpoint1
    end
    @wf.start.join
    wf_assert('CALL a1_1')
    wf_assert('CALL a1_2')
    wf_sassert('Da1_1Da1_2Ca2Da2|finished|')
  end
end
