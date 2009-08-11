$:.unshift File.join(File.dirname(__FILE__),'..', '..','lib')

require 'test/unit'
require 'TestWorkflow'
# unknown/not implemented
class TestMultiMerge < Test::Unit::TestCase
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


  def test_multimerge
    # unknown
  end
    
end
