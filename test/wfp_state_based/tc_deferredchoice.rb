require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'
# implemented as a combination of the Cancelling Structured Partial Join and the Exclusive Choice Pattern
class TestDeferredChoice < Test::Unit::TestCase
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


  def test_sequence
    $wf.replace do
      parallel :wait=>1 do
        parallel_branch do
          activity :a1_1, :call, endpoint1 do
            context :choice => 1
          end
        end
        parallel_branch do
          activity :a1_2, :call, endpoint1 do
            context :choice => 2
          end
        end
      end
      choose do
        alternative(@choice == 1) do
          activity :a2_1, :call, endpoint1
        end
        alternative(@choice == 2) do
          activity :a2_2, :call, endpoint1
        end
      end
    end
    $wf.search false
    $wf_thread = Thread.new { $wf_result = $wf.start };
    sleep(0.02)
    assert($message.include?("Handle call: position=[a1_1]"), "Pos a1_1 should be called by now, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a1_2]"), "Pos a1_1 should be called by now, see message=[#{$message}]");
    $released +="release a1_1";
    sleep(0.02)
    assert($message.include?("Activity a1_1 done"), "pos a1_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Handle call: position=[a2_1]"), "Pos a2_1 should be called by now, see message=[#{$message}]");
  end
end
