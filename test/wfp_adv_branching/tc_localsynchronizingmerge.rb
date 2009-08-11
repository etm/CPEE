$:.unshift File.join(File.dirname(__FILE__),'..', '..','lib')

require 'test/unit'
require 'TestWorkflow'

class TestLocalSynchronizingMerge < Test::Unit::TestCase
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


  def test_localsyncmerge
    $wf.replace do
      parallel :wait do
        parallel_branch do
          activity :a1_1, :call, endpoint1
        end
        parallel_branch do
          choose do
            alternative(false) do
              activity :a2_1, :call, endpoint1
            end
            otherwise do
              Thread.new() do
                activity :a2_2, :call, endpoint1
              end
            end
          end
        end
      end
      activity :a3, :call, endpoint1
    end
    $wf.search= false
    $wf_thread = Thread.new { $wf_result = $wf.start };
    sleep(0.02)
    assert($message.include?("Handle call: position=[a1_1]"), "Pos a1_1 should be called by now, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a2_2]"), "Pos a2_2 should be called by now, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a3]"), "Pos a3 should not be called by now, see message=[#{$message}]");
    $released +="release a1_1";
    sleep(0.02)
    assert($message.include?("Activity a1_1 done"), "pos a1_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Handle call: position=[a3]"), "Pos a3 should be called by now, see message=[#{$message}]");
  end

end
