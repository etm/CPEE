require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'
# unknown/not implemented
class TestThreadSplit < Test::Unit::TestCase
  def setup
    $message = ""
    $released = ""
    $wf = TestWorkflow.new
  end
  def teardown
    $wf.stop
    $message = ""
    $released = ""
    $wf_thread.join if defined?($wf_thread)
  end


  def test_thread_split
    # unknown
  end

end
