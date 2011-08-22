require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

class TestChoose < Test::Unit::TestCase
  include TestMixin

  def test_choose_alternative
    @wf.description do
      choose do
        alternative true do
          activity :a_1, :call, :endpoint1
        end
        alternative false do
          activity :a_2, :call, :endpoint1
        end
        otherwise do
          activity :a_3, :call, :endpoint1
        end
      end
    end
    @wf.start.join
    wf_assert("CALL a_1: passthrough=[], endpoint=[http://www.heise.de], parameters=[{}]")
    wf_assert("CALL a_2:",false)
    wf_assert("CALL a_3:",false)
  end

  def test_choose_otherwise
    @wf.description do
      choose do
        alternative false do
          activity :a_1, :call, :endpoint1
        end
        otherwise do
          activity :a_2, :call, :endpoint1
        end
      end
    end
    @wf.start.join
    wf_assert("CALL a_2: passthrough=[], endpoint=[http://www.heise.de], parameters=[{}]")
    wf_assert("CALL a_1:",false)
  end

  def test_choose_nested
    @wf.description do
      choose do
        alternative true do
          choose do
            alternative false do
              activity :a_1_1, :call, :endpoint1
            end
            alternative true do
              choose do
                alternative false do
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
    @wf.start.join
    wf_assert("CALL a_1_1_2: passthrough=[], endpoint=[http://www.heise.de], parameters=[{}]",true)
    wf_assert("CALL a_1_1:",false)
    wf_assert("CALL a_1_1_1:",false)
    wf_assert("CALL a_1_3:",false)
    wf_assert("CALL a_2:",false)
  end

  def test_choose_searchmode
    
  end
end
