$:.unshift File.join(File.dirname(__FILE__),'..', '..','lib')

require 'test/unit'
require 'TestWorkflow'
# implemented as a combination of the Cancelling Structured Partial Join and the Exclusive Choice Pattern
class TestInterleavedParallelRouting < Test::Unit::TestCase
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


  def test_loop
    $wf.replace do
      activity :a1, :manipulate do
        @x = 0
      end
      cycle("@x < 3") do
        activity :a2, :call, endpoint1 do
          @x += 1
        end
      end
      activity :a3, :call, endpoint1
    end
    $wf.search= false
    $wf_thread = Thread.new { $wf_result = $wf.start };
    sleep(0.1)
    assert($message.include?("Handle call: position=[a2]"), "Pos a2 should be called by now, see message=[#{$message}]");
    $released +="release a2";
    sleep(0.1)
    assert($message.scan("Handle call: position=[a2]").length == 2, "Pos a2 should have been called 2 times, see message=[#{$message}]");
    $released +="release a2";
    sleep(0.1)
    assert($message.scan("Handle call: position=[a2]").length == 3, "Pos a2 should have been called 2 times, see message=[#{$message}]");
    $released +="release a2";
    sleep(0.1)
    assert($message.include?("Handle call: position=[a3]"), "Pos a3 should be called by now, see message=[#{$message}]");
  end
  def test_loop_search
    $wf.replace do
      activity :a1, :manipulate do
        @x = 0
      end
      cycle("@x < 3") do
        activity :a2_1, :call, endpoint1
        activity :a2_2, :manipulate do
          @x += 1
        end
      end
      activity :a3, :call, endpoint1
    end
    $wf.search= {true => Wee::SearchPos.new(:a2_2, :at)};
    $wf.context({:x => 0})
    $wf_thread = Thread.new { $wf_result = $wf.start };
    sleep(0.1)
    assert(!$message.include?("Activity a1 done"), "pos a1 should not be done, see $message=#{$message}");
    assert($message.include?("Activity a2_2 done"), "pos a2_2 not properly ended, see $message=#{$message}");
    assert($message.include?("Handle call: position=[a2_1]"), "Pos a2_1 should be called by now, see message=[#{$message}]");
    $released +="release a2_1";
    sleep(0.1)
    assert($message.scan("Handle call: position=[a2_1]").length == 2, "Pos a2_1 should have been called 2 times, see message=[#{$message}]");
    $released +="release a2_1";
    sleep(0.1)
    assert($message.include?("Handle call: position=[a3]"), "Pos a3 should be called by now, see message=[#{$message}]");
  end
  def test_loop_jump_over
    $wf.replace do
      activity :a1, :manipulate do
        @x = 0
      end
      cycle("@x < 3") do
        activity :a2_1, :call, endpoint1
        activity :a2_2, :manipulate do
          @x += 1
        end
      end
      activity :a3, :call, endpoint1
    end
    $wf.search= {true => Wee::SearchPos.new(:a3, :at)};
    $wf.context({:x => 0})
    $wf_thread = Thread.new { $wf_result = $wf.start };
    sleep(0.1)
    assert($message.include?("Handle call: position=[a3]"), "Pos a3 should be called by now, see message=[#{$message}]");
  end
end
