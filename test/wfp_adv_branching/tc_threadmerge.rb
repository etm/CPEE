require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'
# unknown/not implemented
class TestWFPThreadMerge < Test::Unit::TestCase
  def setup
    $message = ""
    $released = ""
    @wf = TestWorkflow.new
  end
  def teardown
    @wf.stop
    $message = ""
    $released = ""
  end

  def test_thread_merge
    # unknown
  end
end
