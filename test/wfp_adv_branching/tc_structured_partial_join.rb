require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'
# only variant Cancelling Structured Partial Join is implemented, but that's the coolest one 8)
class TestWFPCancellingStructuredPartialJoin < Test::Unit::TestCase
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

  def test_cancelling_structured_partial_join
    @wf.description do
      parallel :wait => 3 do
        parallel_branch do
          activity :a_1, :call, :endpoint1
        end
        parallel_branch do
          activity :a_2, :call, :endpoint1
        end
        parallel_branch do
          activity :a_3, :call, :endpoint1
        end
        parallel_branch do
          activity :a_4, :call, :endpoint1
        end
        parallel_branch do
          activity :a_5, :call, :endpoint1
        end
      end
      activity :a_6, :call, :endpoint1
    end
    @wf.search false
    @wf.start
    sleep(0.1)
    assert($message.include?("Handle call: position=[a_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_1 was not called, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_2 was not called, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_3] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_3 was not called, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_4] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_4 was not called, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_5] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_5 was not called, see message=[#{$message}]");
    $released +="release a_1";
    $released +="release a_3";
    $released +="release a_5";
    sleep(0.1)
    assert($message.include?("Activity a_1 done"), "pos a_1 not properly ended, see $message=#{$message}")
    assert($message.include?("Activity a_3 done"), "pos a_1 not properly ended, see $message=#{$message}")
    assert($message.include?("Activity a_5 done"), "pos a_1 not properly ended, see $message=#{$message}")
    assert($message.include?("Handle call: position=[a_6] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_6 was not called, see message=[#{$message}]");
    assert($message.include?("Handler: Recieved no_longer_necessary signal, deciding if stopping"), "no_longer_necessary signal was not detected, see $message=#{$message}")
  end
end
