require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'

class TestParallel < Test::Unit::TestCase
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
  def test_parallel_simple
    $wf.search false
    $wf.replace do
      parallel do
        parallel_branch do
          activity :a_1, :call, :endpoint1
        end
        parallel_branch do
          activity :a_2, :call, :endpoint1
        end
        parallel_branch do
          activity :a_3, :call, :endpoint1
        end
      end
    end
    $wf_thread = Thread.new { $wf_result = $wf.start}
    sleep(0.1)
    assert($message.include?("Handle call: position=[a_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_1 was not called, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_2 was not called, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_3] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_3 was not called, see message=[#{$message}]");
    $released +="release a_1";
    $released +="release a_2";
    $released +="release a_3";
    sleep(0.1)
    assert($message.include?("Activity a_1 done"), "pos a_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Activity a_2 done"), "pos a_2 not properly ended, see $message=#{$message}");
    assert($message.include?("Activity a_3 done"), "pos a_3 not properly ended, see $message=#{$message}");
  end
  def test_parallel_wait
    $wf.search false
    $wf.replace do
      parallel :wait do
        parallel_branch do
          activity :a_1, :call, :endpoint1
        end
        parallel_branch do
          activity :a_2, :call, :endpoint1
        end
      end
      activity :a_3, :call, :endpoint1
    end
    $wf_thread = Thread.new { $wf_result = $wf.start}
    sleep(0.1)
    assert($message.include?("Handle call: position=[a_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_1 was not called, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_2 was not called, see message=[#{$message}]");
    $released +="release a_1";
    sleep(0.1)
    assert($message.include?("Activity a_1 done"), "pos a_1 not properly ended, see $message=#{$message}");
    assert(!$message.include?("Activity a_3 done"), "pos a_3 finished to early, see $message=#{$message}");
    $released +="release a_2";
    sleep(0.1)
    assert($message.include?("Activity a_2 done"), "pos a_2 not properly ended, see $message=#{$message}");
    assert($message.include?("Handle call: position=[a_3] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_3 was not called, see message=[#{$message}]");
  end
  def test_parallel_nowait
    $wf.search false
    $wf.replace do
      parallel :wait => 1 do
        parallel_branch do
          activity :a_1, :call, :endpoint1
        end
        parallel_branch do
          activity :a_2, :call, :endpoint1
        end
      end
      activity :a_3, :call, :endpoint1
    end
    $wf_thread = Thread.new { $wf_result = $wf.start}
    sleep(0.1)
    assert($message.include?("Handle call: position=[a_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_1 was not called, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_2 was not called, see message=[#{$message}]");
    $released +="release a_1";
    sleep(0.1)
    assert($message.include?("Activity a_1 done"), "pos a_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Handle call: position=[a_3] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_3 was not called, see message=[#{$message}]");
  end
  def test_parallel_no_longer_necessary
    $wf.search false
    $wf.replace do
      parallel :wait => 1 do
        parallel_branch do
          activity :a_1, :call, :endpoint1
        end
        parallel_branch do
          activity :a_2, :call, :endpoint1
          activity :a_2_2, :call, :endpoint1
        end
      end
      activity :a_3, :call, :endpoint1
    end
    $wf_thread = Thread.new { $wf_result = $wf.start}
    sleep(0.1)
    assert($message.include?("Handle call: position=[a_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_1 was not called, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_2 was not called, see message=[#{$message}]");
    $released +="release a_1";
    sleep(0.1)
    assert($message.include?("Activity a_1 done"), "pos a_1 not properly ended, see $message=#{$message}")
    assert($message.include?("Handle call: position=[a_3] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_3 was not called, see message=[#{$message}]");
    assert($message.include?("Handler: Recieved no_longer_necessary signal, deciding if stopping"), "no_longer_necessary signal was not detected, see $message=#{$message}")
    $released +="release a_2";
    sleep(0.1)
    assert(!$message.include?("Handle call: position=[a_2_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_2_2 was not called, see message=[#{$message}]");
  end
  def test_parallel_wait_partial
    $wf.search false
    $wf.replace do
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
    $wf_thread = Thread.new { $wf_result = $wf.start}
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
  def test_parallel_nested
    # |- :a_1
    # |-|-|- :a_2_1_1
    # |-|-|- :a_2_1_2
    # |-|-|- => :a_2_1_3
    # |-|- :a_2_2
    # |-|- :a_2_3
    # |- => :a_3
    $wf.search false
    $wf.replace do
      parallel :wait do
        parallel_branch do activity :a_1, :call, :endpoint1 end
        parallel_branch do
          parallel :wait do
            parallel_branch do
              parallel :wait do
                parallel_branch do activity :a_2_1_1, :call, :endpoint1 end
                parallel_branch do activity :a_2_1_2, :call, :endpoint1 end
              end
              activity :a_2_1_3, :call, :endpoint1
            end
            parallel_branch do activity :a_2_2, :call, :endpoint1 end
            parallel_branch do activity :a_2_3, :call, :endpoint1 end
          end
        end
      end
      activity :a_3, :call, :endpoint1
    end
    $wf_thread = Thread.new { $wf_result = $wf.start}
    sleep(0.1)
    assert($message.include?("Handle call: position=[a_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_1 was not called, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_2_1_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_2_1_1 was not called, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_2_1_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_2_1_2 was not called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a_2_1_3] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_2_1_3 was wrongly called, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_2_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_2_2 was not called, see message=[#{$message}]");
    assert($message.include?("Handle call: position=[a_2_3] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_2_3 was not called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a_3] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_3 was wrongly called, see message=[#{$message}]");
    $released +="release a_1";
    $released +="release a_2_2";
    $released +="release a_2_3";
    sleep(0.1)
    assert($message.include?("Activity a_1 done"), "pos a_2_2 not properly ended, see $message=#{$message}")
    assert($message.include?("Activity a_2_2 done"), "pos a_2_2 not properly ended, see $message=#{$message}")
    assert($message.include?("Activity a_2_3 done"), "pos a_2_3 not properly ended, see $message=#{$message}")
    assert(!$message.include?("Handle call: position=[a_3] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_3 was wrongly called, see message=[#{$message}]");
    $released +="release a_2_1_1";
    $released +="release a_2_1_2";
    sleep(0.1)
    assert($message.include?("Activity a_2_1_1 done"), "pos a_2_1_1 not properly ended, see $message=#{$message}")
    assert($message.include?("Activity a_2_1_2 done"), "pos a_2_1_2 not properly ended, see $message=#{$message}")
    assert($message.include?("Handle call: position=[a_2_1_3] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_2_1_3 was not called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a_3] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_3 was wrongly called, see message=[#{$message}]");
    $released +="release a_2_1_3";
    sleep(0.1)
    assert($message.include?("Activity a_2_1_3 done"), "pos a_2_1_3 not properly ended, see $message=#{$message}")
    assert($message.include?("Handle call: position=[a_3] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_3 was not called, see message=[#{$message}]");
  end
end
