$:.unshift File.join(File.dirname(__FILE__),'..', '..','lib')

require 'test/unit'
require 'TestWorkflow'

class TestSequence < Test::Unit::TestCase
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


  def test_sequence
    $wf.replace do
      activity :a1_1, :call, endpoint1
      activity :a1_2, :call, endpoint1
      activity :a1_3, :call, endpoint1
    end
    $wf.search= false
    $wf_thread = Thread.new { $wf_result = $wf.start };
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
