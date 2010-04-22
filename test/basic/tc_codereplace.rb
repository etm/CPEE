require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'

class TestCodeReplace < Test::Unit::TestCase
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
  def test_replace
    @wf.description do
      activity [1,1], :call, :endpoint1
      activity [1,2], :call, :endpoint1
      activity [1,3], :call, :endpoint1
    end
    @wf.search Wee::Position.new("1_1", :at)
    @wf.start
    $released +="release 1_1";
    $released +="release 1_2";
    $released +="release 1_3";
    sleep(0.1)
    assert($message.include?("Activity 1_1 done"), "pos 1_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Activity 1_2 done"), "pos 1_2 not properly ended, see $message=#{$message}");
    assert($message.include?("Activity 1_3 done"), "pos 1_3 not properly ended, see $message=#{$message}");
  end
  def test_wfdescription_string
    ret = @wf.description "activity [1,1], :call, :endpoint1"

    @wf.search Wee::Position.new("1_1", :at)
    @wf.start
    $released +="release 1_1";
    sleep(0.1)
    assert($message.include?("Activity 1_1 done"), "pos 1_1 not properly ended, see $message=#{$message}");
  end
  def test_wfdescription_block
    ret = @wf.description do
      activity [1,1], :call, :endpoint1
    end

    assert(ret.class == Proc, "wf_description should be nil => not available. codeblock was given!")

    @wf.search Wee::Position.new("1_1", :at)
    @wf.start
    $released +="release 1_1";
    sleep(0.1)
    assert($message.include?("Activity 1_1 done"), "pos 1_1 not properly ended, see $message=#{$message}");
  end

end
