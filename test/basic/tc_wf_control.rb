require 'test/unit'
require 'pp'
require ::File.dirname(__FILE__) + '/../TestWorkflow'

class TestWorkflowControl < Test::Unit::TestCase
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
  def test_runthrough
    @wf.start
    $released +="release a1_1"
    sleep(0.1)
    assert($message.include?("Activity a1_1 done"), "pos a1_1 not properly ended, see $message=#{$message}")
    assert($message.include?("Handle call: position=[a2_1_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a2_1_1 was not called")
    assert($message.include?("Handle call: position=[a2_2_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a2_2_1 was not called")
    $released +="release a2_1_1"
    $released +="release a2_2_1"
    sleep(0.1)
    assert($message.include?("Activity a2_1_1 done"), "Pos a2_2_1 was not proper released/called")
    assert($message.include?("Activity a2_2_1 done"), "Pos a2_2_1 was not proper released/called")
    assert($message.include?("Activity a3 done"), "Pos a2_2_1 was not proper released/called")
    $released +="release a4a"
    sleep(0.1)
    assert($message.include?("Activity a4a done"), "Pos a2_2_1 was not proper released/called")
    assert(@wf.state == :finished, "Stopped workflow has wrong state, #{@wf.state} instead of :stopped")
    assert(@wf.positions.is_a?(Array) && @wf.positions.empty?, "@wf.positions has wrong type, should be an empty array, it is: #{@wf.positions.inspect}")
    assert(@wf.context[:x] == "begin_Handler_Dummy_Result_end", "Ending environment not correct, see result=#{@wf.context[:x].inspect}")
  end
  def test_stop
    @wf.description do
      activity :a_test_1_1, :call, :endpoint1
      activity :a_test_1_2, :call, :endpoint1
      activity :a_test_1_3, :call, :endpoint1
    end
    @wf.search Wee::Position.new(:a_test_1_1, :at)
    @wf.start
    $released +="release a_test_1_1"
    sleep(0.1)
    assert($message.include?("Activity a_test_1_1 done"), "pos a_test_1_1 not properly ended, see $message=#{$message}")
    assert($message.include?("Handle call: position=[a_test_1_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_test_1_2 was not called, see message=[#{$message}]")
    @wf.stop.join
    assert(@wf.state == :stopped, "Stopped workflow has wrong state, #{@wf.state} instead of :stopped")
    assert(@wf.positions.is_a?(Array), "@wf.positions has wrong type, should be an array, it is: #{@wf.positions.inspect}")
    assert(@wf.positions[0].position == :a_test_1_2, "Stop-position has wrong value: #{@wf.positions[0].position} instead of :a_test_2_1")
    assert(@wf.positions[0].detail == :at, "Stop-Position is not :at")
  end
  def test_continue
    @wf.description do
      activity :a_test_1_1, :call, :endpoint1
      activity :a_test_1_2, :call, :endpoint1
      activity :a_test_1_3, :call, :endpoint1
    end
    @wf.search Wee::Position.new(:a_test_1_1, :at)
    @wf.start
    $released +="release a_test_1_1"
    sleep(0.1)
    @wf.stop

    @wf.search @wf.positions

    $message = ""
    @wf.start
    sleep(0.1)
    assert($message.include?("Handle call: position=[a_test_1_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_test_1_2 was not called, see message=[#{$message}]")
    $released +="release a_test_1_2"
    $released +="release a_test_1_3"
    sleep(0.1)
    assert($message.include?("Activity a_test_1_2 done"), "pos a_test_1_2 not properly ended, see $message=#{$message}")
    assert($message.include?("Activity a_test_1_3 done"), "pos a_test_1_3 not properly ended, see $message=#{$message}")
  end
  
  def test_continue_after
    @wf.description do
      activity :a_test_1_1, :call, :endpoint1
      activity :a_test_1_2, :call, :endpoint1
      activity :a_test_1_3, :call, :endpoint1
    end
    @wf.search [Wee::Position.new(:a_test_1_1, :after)]
    @wf.start
    sleep(0.1)
    assert($message.include?("Handle call: position=[a_test_1_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_test_1_2 was not called, see message=[#{$message}]")
    $released +="release a_test_1_2"
    $released +="release a_test_1_3"
    sleep(0.1)
    assert($message.include?("Activity a_test_1_2 done"), "pos a_test_1_2 not properly ended, see $message=#{$message}")
    assert($message.include?("Activity a_test_1_3 done"), "pos a_test_1_3 not properly ended, see $message=#{$message}")
  end
end
