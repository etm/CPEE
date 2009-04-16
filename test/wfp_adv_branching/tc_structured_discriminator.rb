$:.unshift File.join(File.dirname(__FILE__),'..', '..','lib')

require 'test/unit'
require 'TestWorkflow'

# only variant Cancelling Discriminator is implemented, but that's the coolest one 8)
class TestStructuredDiscriminator < Test::Unit::TestCase
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


  def test_cancelling_discriminator
    $wf.replace do
      parallel :wait => 1 do
        parallel_branch do
          activity :a_1_1, :call, endpoint1
        end
        parallel_branch do
          activity :a_1_2, :call, endpoint1
        end
      end
      activity :a_2, :call, endpoint1
    end
    $wf.search= false
    $wf_thread = Thread.new { $wf_result = $wf.start };
    sleep(0.02)
    assert($message.include?("Handle call: position=[a_1_1]"), "Pos a_1_1 should be called by now, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_1_2]"), "Pos a_1_2 should not have been called by now, see message=[#{$message}]");
    $released +="release a_1_1";
    sleep(0.02)
    assert($message.include?("Activity a_1_1 done"), "pos a_1_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Handle call: position=[a_2]"), "Pos a_2 should have been called by now, see message=[#{$message}]");
  end
end
