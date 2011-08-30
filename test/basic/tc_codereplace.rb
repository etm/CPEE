require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

class TestCodeReplace < Test::Unit::TestCase
  include TestMixin

  def test_replace
    @wf.description do
      activity :a_test_1_1, :call, :endpoint1
      activity :a_test_1_2, :call, :endpoint1
      activity :a_test_1_3, :call, :endpoint1
    end
    @wf.search Wee::Position.new(:a_test_1_1, :at)
    @wf.start.join
    wf_assert("CALL a_test_1_1:")
    wf_assert("CALL a_test_1_2:")
    wf_assert("CALL a_test_1_3:")
    wf_sassert("SrunningCa_test_1_1Da_test_1_1Ca_test_1_2Da_test_1_2Ca_test_1_3Da_test_1_3Sfinished")
  end
  #def test_wfdescription_string
  #  ret = @wf.description "activity :b_test_1_1, :call, :endpoint1"
  #  @wf.search Wee::Position.new(:b_test_1_1, :at)
  #  @wf.start.join
  #  wf_assert("DONE b_test_1_1")
  #  wf_sassert("SrunningCb_test_1_1Db_test_1_1Sfinished")
  #end
  def test_wfdescription_block
    ret = @wf.description do
      activity :c_test_1_1, :call, :endpoint1
      activity :c_test_1_2, :call, :endpoint1
    end

    assert(ret.class == Proc, "wf_description should be nil => not available. codeblock was given!")
    @wf.search Wee::Position.new(:c_test_1_2, :at)
    @wf.start.join
    wf_sassert("SrunningCc_test_1_2Dc_test_1_2Sfinished")
  end
end
