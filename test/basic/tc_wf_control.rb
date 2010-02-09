require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'

class TestWorkflowControl < Test::Unit::TestCase
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
  def test_runthrough
    $wf_thread = Thread.new { $wf_result = $wf.start };
    $released +="release a1_1";
    sleep(0.1)
    assert($message.include?("Activity a1_1 done"), "pos a1_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Handle call: position=[a2_1_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a2_1_1 was not called");
    assert($message.include?("Handle call: position=[a2_2_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a2_2_1 was not called");
    $released +="release a2_1_1";
    $released +="release a2_2_1";
    sleep(0.1)
    assert($message.include?("Activity a2_1_1 done"), "Pos a2_2_1 was not proper released/called");
    assert($message.include?("Activity a2_2_1 done"), "Pos a2_2_1 was not proper released/called");
    assert($message.include?("Activity a3 done"), "Pos a2_2_1 was not proper released/called");
    $released +="release a4a";
    sleep(0.1)
    assert($message.include?("Activity a4a done"), "Pos a2_2_1 was not proper released/called");
    assert($wf_result.inspect.include?("[:finished, [], {:x=>\"begin_Handler_Dummy_Result_end\"}]"), "Ending environment not correct, see result=#{$wf_result.inspect}");
  end
  def test_stop
    $wf.replace do
      activity :a_test_1_1, :call, :endpoint1
      activity :a_test_1_2, :call, :endpoint1
      activity :a_test_1_3, :call, :endpoint1
    end
    $wf.search Wee::SearchPos.new(:a_test_1_1, :at)
    $wf_thread = Thread.new { $wf_result = $wf.start };
    $released +="release a_test_1_1";
    sleep(0.1)
    assert($message.include?("Activity a_test_1_1 done"), "pos a_test_1_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Handle call: position=[a_test_1_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_test_1_2 was not called, see message=[#{$message}]");
    $wf.stop
    $wf_thread.join
    assert($wf_result != nil, "Workflow did not end/join properly")
    assert($wf_result[0] == :stopped, "Stopped workflow has wrong state, #{$wf_result[0]} instead of :stopped")
    assert($wf_result[1].is_a?(Array), "wf_result[1] has wrong type, should be an array, it is: #{$wf_result[1].inspect}")
    assert($wf_result[1][0].position == :a_test_1_2, "Stop-position has wrong value: #{$wf_result[1][0].position} instead of :a_test_2_1")
    assert($wf_result[1][0].detail == :at, "Stop-Position is not :at")
  end
  def test_continue
    $wf.replace do
      activity :a_test_1_1, :call, :endpoint1
      activity :a_test_1_2, :call, :endpoint1
      activity :a_test_1_3, :call, :endpoint1
    end
    $wf.search Wee::SearchPos.new(:a_test_1_1, :at)
    $wf_thread = Thread.new { $wf_result = $wf.start };
    $released +="release a_test_1_1";
    sleep(0.1)
    $wf.stop
    $wf_thread.join
    $wf.search $wf_result[1]
    $message = "";
    $wf_thread = Thread.new { $wf_result = $wf.start };
    assert($message.include?("Handle call: position=[a_test_1_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_test_1_2 was not called, see message=[#{$message}]");
    $released +="release a_test_1_2";
    $released +="release a_test_1_3";
    sleep(0.1)
    assert($message.include?("Activity a_test_1_2 done"), "pos a_test_1_2 not properly ended, see $message=#{$message}");
    assert($message.include?("Activity a_test_1_3 done"), "pos a_test_1_3 not properly ended, see $message=#{$message}");
  end

end
