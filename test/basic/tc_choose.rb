require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'

class TestChoose < Test::Unit::TestCase
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

  def test_choose_alternative
    @wf.search false
    @wf.description do
      choose do
        alternative(true) do
          activity [1], :call, :endpoint1
        end
        alternative(false) do
          activity [2], :call, :endpoint1
        end
        otherwise do
          activity [3], :call, :endpoint1
        end
      end
    end
    @wf.start
    sleep(0.1)
    assert($message.include?("Handle call: position=[1] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos 1 was not called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[2]"), "Pos 2 should not have been called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[3]"), "Pos 3 should not have been called, see message=[#{$message}]");
  end

  def test_choose_otherwise
    @wf.search false
    @wf.description do
      choose do
        alternative(false) do
          activity [1], :call, :endpoint1
        end
        otherwise do
          activity [2], :call, :endpoint1
        end
      end
    end
    @wf.start
    sleep(0.1)
    assert($message.include?("Handle call: position=[2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos 2 was not called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[1]"), "Pos 1 should not have been called, see message=[#{$message}]");
  end

  def test_choose_nested
    @wf.search false
    @wf.description do
      choose do
        alternative(true) do
          choose do
            alternative(false) do
              activity [1,1], :call, :endpoint1
            end
            alternative(true) do
              choose do
                alternative(false) do
                  activity [1,1,1], :call, :endpoint1
                end
                otherwise do
                  activity [1,1,2], :call, :endpoint1
                end
              end
            end
            otherwise do
              activity [1,3], :call, :endpoint1
            end
          end
        end
        otherwise do
          activity [2], :call, :endpoint1
        end
      end
    end
    @wf.start
    sleep(0.1)
    assert($message.include?("Handle call: position=[1_1_2] passthrough=[], endpoint=[http://www.heise.de], parameters=[]. Waiting for release"), "Pos 1_1_2 was not called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[1_1]"), "Pos 1_1 should not have been called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[1_1_1]"), "Pos 1_1_1 should not have been called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[1_3]"), "Pos 1_3 should not have been called, see message=[#{$message}]");
    assert(!$message.include?("Handle call: position=[2]"), "Pos 2 should not have been called, see message=[#{$message}]");
  end

  def test_choose_searchmode
    
  end
end
