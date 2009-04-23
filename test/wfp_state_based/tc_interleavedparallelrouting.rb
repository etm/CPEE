$:.unshift File.join(File.dirname(__FILE__),'..', '..','lib')

require 'test/unit'
require 'TestWorkflow'
# implemented as a combination of the Cancelling Structured Partial Join and the Exclusive Choice Pattern
class TestInterleavedParallelRouting < Test::Unit::TestCase
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


  def test_interleaved
    $wf.replace do
      parallel do
        parallel_branch do
          critical(:section1) do
            activity :a1, :call, endpoint1
          end
          critical(:section1) do
            activity :a3, :call, endpoint1
          end
        end
        parallel_branch do
          critical(:section1) do
            activity :a2, :call, endpoint1
          end
        end
      end
    end
    $wf.search= false
    $wf_thread = Thread.new { $wf_result = $wf.start };
    sleep(0.2)
    assert($message.include?("Handle call: position=[a1]"), "Pos a1 should be called by now, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a2]"), "Pos a2 should not be called by now, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a3]"), "Pos a3 should not be called by now, see message=[#{$message}]");
    $released +="release a1";
    sleep(0.2)
    assert($message.include?("Activity a1 done"), "pos a1 not properly ended, see $message=#{$message}");
    assert($message.include?("Handle call: position=[a2]"), "Pos a2 should be called by now, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a3]"), "Pos a3 should not be called by now, see message=[#{$message}]");
    $released +="release a2";
    sleep(0.2)
    assert($message.include?("Activity a2 done"), "pos a2 not properly ended, see $message=#{$message}");
    assert($message.include?("Handle call: position=[a3]"), "Pos a3 should be called by now, see message=[#{$message}]");
  end
end
