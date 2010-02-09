require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'

class TestMultiChoice < Test::Unit::TestCase
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


  def test_multichoice_chained
    $wf.replace do
      context :x => 1
      choose do
        alternative(@x == 1) do
          activity :a1_1, :call, :endpoint1
        end
        alternative(@x > 0) do
          activity :a1_2, :call, :endpoint1
        end
      end
      activity :a2, :call, :endpoint1
    end
    $wf.search false
    $wf_thread = Thread.new { $wf_result = $wf.start };
    sleep(0.02)
    assert($message.include?("Handle call: position=[a1_1]"), "Pos a1_1 should be called by now, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a1_2]"), "Pos a1_2 should not have been called by now, see message=[#{$message}]");
    $released +="release a1_1";
    sleep(0.02)
    assert($message.include?("Activity a1_1 done"), "pos a1_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Handle call: position=[a1_2]"), "Pos a1_2 should be called by now, see message=[#{$message}]");
    $released +="release a1_2";
    sleep(0.02)
    assert($message.include?("Activity a1_2 done"), "pos a1_2 not properly ended, see $message=#{$message}");
    $released +="release a2";
    sleep(0.02)
    assert($message.include?("Activity a2 done"), "pos a2 not properly ended, see $message=#{$message}");
  end
  def test_multichoice_parallel
    $wf.replace do
      context :x => 1
      parallel do
        choose do
          parallel_branch do
            alternative(@x == 1) do
              activity :a1_1, :call, :endpoint1
            end
          end
          parallel_branch do
            alternative(@x > 0) do
              activity :a1_2, :call, :endpoint1
            end
          end
        end
      end
      activity :a2, :call, :endpoint1
    end
    $wf.search false
    $wf_thread = Thread.new { $wf_result = $wf.start };
    sleep(0.02)
    assert($message.include?("Handle call: position=[a1_1]"), "Pos a1_1 should be called by now, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a1_2]"), "Pos a1_2 should be called by now, see message=[#{$message}]");
    $released +="release a1_1";
    sleep(0.02)
    assert($message.include?("Activity a1_1 done"), "pos a1_1 not properly ended, see $message=#{$message}");
    assert(!$message.include?("Handle call: position=[a2]"), "Pos a2 should not have been called by now, see message=[#{$message}]");
    $released +="release a1_2";
    sleep(0.02)
    assert($message.include?("Activity a1_2 done"), "pos a1_2 not properly ended, see $message=#{$message}");
    $released +="release a2";
    sleep(0.02)
    assert($message.include?("Activity a2 done"), "pos a2 not properly ended, see $message=#{$message}");
  end
end
