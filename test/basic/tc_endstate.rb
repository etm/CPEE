$:.unshift File.join(File.dirname(__FILE__),'..', '..','lib')

require 'test/unit'
require 'TestWorkflow'

class TestEndpoint < Test::Unit::TestCase
  def setup
    $message = ""
    $released = ""
    $wf = TestWorkflow.new
    $wf.endstate=:normal;
  end
  def teardown
    $wf.stop
    $message = ""
    $released = ""
    $wf_thread.join if defined?($wf_thread)
  end
  def test_check_endstate
    es = $wf.endstate
    assert(es.is_a?(Symbol), "Endstate is not a symbol")
    assert(es == :normal, "Endstate is set to :normal")
  end
  def test_change_endstate
    $wf.endstate= :test
    assert($wf.endstate.is_a?(Symbol), "Endstate is not a symbol")
    assert($wf.endstate == :test, "Endstate is not set to :test")
  end
  def test_check_stop_endstate
    $wf_thread = Thread.new { $wf_result = $wf.start };
    $wf.stop
    $wf_thread.join
    assert($wf.endstate == :stopped, "Endstate is not set to :stopped after workflow being stopped")
  end
end
