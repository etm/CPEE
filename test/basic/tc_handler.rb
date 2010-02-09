require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'



class TestCaseHandler < Test::Unit::TestCase
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

  def test_handler
    assert_raise RuntimeError do
      $wf.handler = String
    end
    assert_nothing_raised do
      $wf.handler = TestHandler
    end
  end
  def test_handlerargs
    $wf.handlerargs  ("1", "2")
    assert($wf.handlerargs.is_a?(Array), "Handler arguments is not an array, it is a #{$wf.handlerargs.inspect}")
  end
end
