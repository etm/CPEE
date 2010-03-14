require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'

class TestWFPSequence < Test::Unit::TestCase
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

  def test_sequence
    @wf.description do
      activity :a1_1, :call, :endpoint1
      activity :a1_2, :call, :endpoint1
      activity :a1_3, :call, :endpoint1
    end
    @wf.search false
    @wf.start
    $released +="release a1_1";
    sleep(0.02)
    assert($message.include?("Activity a1_1 done"), "pos a1_1 not properly ended, see $message=#{$message}");
    $released +="release a1_2";
    sleep(0.02)
    assert($message.include?("Activity a1_2 done"), "pos a1_2 not properly ended, see $message=#{$message}");
    $released +="release a1_3";
    sleep(0.02)
    assert($message.include?("Activity a1_3 done"), "pos a1_3 not properly ended, see $message=#{$message}");
  end
end
