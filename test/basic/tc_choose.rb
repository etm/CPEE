require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'

class TestChoose < Test::Unit::TestCase
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

  def test_choose_alternative
    $wf.search false
    $wf.replace do
      choose do
        alternative(true) do
          activity :a_1, :call, :endpoint1
        end
        alternative(false) do
          activity :a_2, :call, :endpoint1
        end
        otherwise do
          activity :a_3, :call, :endpoint1
        end
      end
    end
    $wf_thread = Thread.new { $wf_result = $wf.start}
    sleep(0.1)
    assert($message.include?("Handle call: position=[a_1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_1 was not called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a_2]"), "Pos a_2 should not have been called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a_3]"), "Pos a_3 should not have been called, see message=[#{$message}]");
  end

  def test_choose_otherwise
    $wf.search false
    $wf.replace do
      choose do
        alternative(false) do
          activity :a_1, :call, :endpoint1
        end
        otherwise do
          activity :a_2, :call, :endpoint1
        end
      end
    end
    $wf_thread = Thread.new { $wf_result = $wf.start}
    sleep(0.1)
    assert($message.include?("Handle call: position=[a_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_2 was not called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a_1]"), "Pos a_1 should not have been called, see message=[#{$message}]");
  end

  def test_choose_nested
    $wf.search false
    $wf.replace do
      choose do
        alternative(true) do
          choose do
            alternative(false) do
              activity :a_1_1, :call, :endpoint1
            end
            alternative(true) do
              choose do
                alternative(false) do
                  activity :a_1_1_1, :call, :endpoint1
                end
                otherwise do
                  activity :a_1_1_2, :call, :endpoint1
                end
              end
            end
            otherwise do
              activity :a_1_3, :call, :endpoint1
            end
          end
        end
        otherwise do
          activity :a_2, :call, :endpoint1
        end
      end
    end
    $wf_thread = Thread.new { $wf_result = $wf.start}
    sleep(0.1)
    assert($message.include?("Handle call: position=[a_1_1_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos a_1_1_2 was not called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a_1_1]"), "Pos a_1_1 should not have been called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a_1_1_1]"), "Pos a_1_1_1 should not have been called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a_1_3]"), "Pos a_1_3 should not have been called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[a_2]"), "Pos a_2 should not have been called, see message=[#{$message}]");
  end

  def test_choose_searchmode
    
  end
end
