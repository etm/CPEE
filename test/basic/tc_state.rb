$:.unshift File.join(File.dirname(__FILE__),'..', '..','lib')

require 'test/unit'
require 'TestWorkflow'

class TestState < Test::Unit::TestCase
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
  def test_check_state
    s = $wf.state
    assert(s.is_a?(Symbol), "state is not a symbol")
    assert(s == :ready, "state is not set to :ready, it is #{s}")
  end
  def test_check_stop_state
    $wf_thread = Thread.new { $wf_result = $wf.start };
    $wf.stop
    $wf_thread.join
    assert($wf.state == :stopped, "state is not set to :stopped after workflow being stopped, it is #{$wf.state}")
  end
end
