require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

class TestState < Test::Unit::TestCase
  include TestMixin

  def test_check_state
    s = @wf.state
    assert(s.is_a?(Symbol), "state is not a symbol")
    assert(s == :ready, "state is not set to :ready, it is #{s}")
  end
  def test_check_stop_state
    @wf.start
    @wf.stop.join
    assert(@wf.state == :stopped || @wf.state == :finished, "state is not set to :stopped after workflow being stopped, it is #{@wf.state}")
  end
end
