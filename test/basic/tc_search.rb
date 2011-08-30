require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

class TestSearch < Test::Unit::TestCase
  include TestMixin

  def test_search_impact_single
    @wf.description do
      activity :a1_1, :call, :endpoint1
      activity :a1_2, :call, :endpoint1
      activity :a1_3, :call, :endpoint1
    end
    @wf.search Wee::Position.new(:a1_2, :at)
    @wf.start.join
    wf_sassert("SrunningCa1_2Da1_2Ca1_3Da1_3Sfinished")
  end
  def test_search_impact_dual
    @wf.description do
      activity :a1, :call, :endpoint1
      parallel do
        parallel_branch do
          activity :a2_1, :call, :endpoint1
        end
        parallel_branch do
          activity :a2_2, :call, :endpoint1
        end
      end
      activity :a3, :call, :endpoint1
    end
    @wf.search [Wee::Position.new(:a2_1, :at), Wee::Position.new(:a2_2, :at)]
    @wf.start.join
    wf_assert("DONE a1",false)
    wf_assert("DONE a2_1",true)
    wf_assert("DONE a2_2",true)
    wf_assert("DONE a3",true)
  end
end
