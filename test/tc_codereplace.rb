# To change this template, choose Tools | Templates
# and open the template in the editor.

$:.unshift File.join(File.dirname(__FILE__),'..','lib')

require 'test/unit'
require 'TestWorkflow'

class TestCodeReplace < Test::Unit::TestCase
  def setup
    $message = ""
    $released = ""
    $wf = TestWorkflow.new
    $wf.endstate=:normal;
  end
  def test_replace
    $wf.replace do
      activity :a_test_1_1, :call, endpoint1
      activity :a_test_1_2, :call, endpoint1
      activity :a_test_1_3, :call, endpoint1
    end
    $wf.search={true => SearchPos.new(:a_test_1_1, :at)}
    $wf_thread = Thread.new { $wf_result = $wf.start };
    $released +="release a_test_1_1";
    $released +="release a_test_1_2";
    $released +="release a_test_1_3";
    sleep(0.2)
    assert($message.include?("Activity a_test_1_1 done"), "pos a_test_1_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Activity a_test_1_2 done"), "pos a_test_1_2 not properly ended, see $message=#{$message}");
    assert($message.include?("Activity a_test_1_3 done"), "pos a_test_1_3 not properly ended, see $message=#{$message}");
  end

end
