require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'
# unknown/not implemented
class TestWFPGeneralizedJoin < Test::Unit::TestCase
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


  def test_generalized_join
    # unknown
  end
end
