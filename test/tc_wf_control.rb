# To change this template, choose Tools | Templates
# and open the template in the editor.

$:.unshift File.join(File.dirname(__FILE__),'..','lib')

require 'test/unit'
require 'TestWorkflow'

class TestWorkflowControl < Test::Unit::TestCase
  def setup
    $message = ""
    $released = ""
    $wf = TestWorkflow.new
    $wf.endstate=:normal;
  end
  def test_runthrough
    $wf_thread = Thread.new { $wf_result = $wf.start };
    $released +="release a1_1";
    sleep(0.2)
    assert($message.include?("Activity a1_1 done"), "pos a1_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Handle call: position=[a2_1_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a2_1_1 was not called");
    assert($message.include?("Handle call: position=[a2_2_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a2_2_1 was not called");
    $released +="release a2_1_1";
    $released +="release a2_2_1";
    sleep(0.2)
    assert($message.include?("Activity a2_1_1 done"), "Pos a2_2_1 was not proper released/called");
    assert($message.include?("Activity a2_2_1 done"), "Pos a2_2_1 was not proper released/called");
    assert($message.include?("Activity a3 done"), "Pos a2_2_1 was not proper released/called");
    $released +="release a4a";
    sleep(0.4)
    assert($message.include?("Activity a4a done"), "Pos a2_2_1 was not proper released/called");
    assert($wf_result.inspect.include?("[:normal, [], {:@x=>\"begin_Handler_Dummy_Result_end\"}]"), "Ending environment not correct, see resul=#{$wf_result.inspect}");
  end
  def test_stop

  end
  def test_continue
    
  end

end
