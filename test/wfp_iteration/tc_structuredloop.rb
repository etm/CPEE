require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'

# implemented as a combination of the Cancelling Structured Partial Join and the Exclusive Choice Pattern
class TestWFPInterleavedParallelRouting < Test::Unit::TestCase
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

  def test_loop
    @wf.description do
      activity :a1, :manipulate do
        @x = 0
      end
      cycle("@x < 3") do
        activity :a2, :call, :endpoint1 do
          @x += 1
        end
      end
      activity :a3, :call, :endpoint1
    end
    @wf.search false
    @wf.start
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
    @wf.description do
      activity :a1, :manipulate do
        @x = 0
      end
      cycle("@x < 3") do
        activity :a2_1, :call, :endpoint1
        activity :a2_2, :manipulate do
          @x += 1
        end
      end
      activity :a3, :call, :endpoint1
    end
    @wf.search Wee::Position.new(:a2_2, :at)
    @wf.context({:x => 0})
    @wf.start
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
    @wf.description do
      activity :a1, :manipulate do
        @x = 0
      end
      cycle("@x < 3") do
        activity :a2_1, :call, :endpoint1
        activity :a2_2, :manipulate do
          @x += 1
        end
      end
      activity :a3, :call, :endpoint1
    end
    @wf.search Wee::Position.new(:a3, :at)
    @wf.context({:x => 0})
    @wf.start
    sleep(0.1)
    assert($message.include?("Handle call: position=[a3]"), "Pos a3 should be called by now, see message=[#{$message}]");
  end
end
