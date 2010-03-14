require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'

class TestState < Test::Unit::TestCase
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
  def test_check_state
    s = @wf.state
    assert(s.is_a?(Symbol), "state is not a symbol")
    assert(s == :ready, "state is not set to :ready, it is #{s}")
  end
  def test_check_stop_state
    @wf.start
    @wf.stop
    assert(@wf.state == :stopped, "state is not set to :stopped after workflow being stopped, it is #{@wf.state}")
  end
end
