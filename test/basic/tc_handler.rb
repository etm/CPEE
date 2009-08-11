$:.unshift File.join(File.dirname(__FILE__),'..', '..','lib')

require 'test/unit'
require 'TestWorkflow'



class TestSearch < Test::Unit::TestCase
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
end
