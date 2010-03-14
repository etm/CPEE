require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'

class TestWFPExclusiveChoice < Test::Unit::TestCase
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

  def test_exclusive_choice
    @wf.description do
      choose do
        alternative(true) do
          activity :a1_1, :call, :endpoint1
        end
        otherwise do
          activity :a1_2, :call, :endpoint1
        end
        activity :a2, :call, :endpoint1
      end
    end
    @wf.search false
    @wf.start
    sleep(0.02)
    assert($message.include?("Handle call: position=[a1_1]"), "Pos a1_1 should be called by now, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a1_2]"), "Pos a1_2 should not have been called by now, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a2]"), "Pos a2 should not have been called by now, see message=[#{$message}]");
    $released +="release a1_1";
    sleep(0.02)
    assert($message.include?("Activity a1_1 done"), "pos a1_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Handle call: position=[a2]"), "Pos a2 should be called by now, see message=[#{$message}]");
  end
end
