require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'

class TestCodeReplace < Test::Unit::TestCase
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
  def test_replace
    $wf.replace do
      activity :a_test_1_1, :call, endpoint1
      activity :a_test_1_2, :call, endpoint1
      activity :a_test_1_3, :call, endpoint1
    end
    $wf.search=Wee::SearchPos.new(:a_test_1_1, :at)
    $wf_thread = Thread.new { $wf_result = $wf.start };
    $released +="release a_test_1_1";
    $released +="release a_test_1_2";
    $released +="release a_test_1_3";
    sleep(0.1)
    assert($message.include?("Activity a_test_1_1 done"), "pos a_test_1_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Activity a_test_1_2 done"), "pos a_test_1_2 not properly ended, see $message=#{$message}");
    assert($message.include?("Activity a_test_1_3 done"), "pos a_test_1_3 not properly ended, see $message=#{$message}");
  end
  def test_wfdescription_string
    ret = $wf.wf_description "activity :a_test_1_1, :call, endpoint1"
    assert(ret == "activity :a_test_1_1, :call, endpoint1", "Invalid wf_description coped: #{ret}")

    $wf.search=Wee::SearchPos.new(:a_test_1_1, :at)
    $wf_thread = Thread.new { $wf_result = $wf.start };
    $released +="release a_test_1_1";
    sleep(0.1)
    assert($message.include?("Activity a_test_1_1 done"), "pos a_test_1_1 not properly ended, see $message=#{$message}");
  end
  def test_wfdescription_block
    ret = $wf.wf_description do
      activity :a_test_1_1, :call, endpoint1
    end

    assert(ret.nil?, "wf_description should be nil => not available. codeblock was given!")

    $wf.search=Wee::SearchPos.new(:a_test_1_1, :at)
    $wf_thread = Thread.new { $wf_result = $wf.start };
    $released +="release a_test_1_1";
    sleep(0.1)
    assert($message.include?("Activity a_test_1_1 done"), "pos a_test_1_1 not properly ended, see $message=#{$message}");
  end

end
