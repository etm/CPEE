require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

class TestWFPLocalSynchronizingMerge < Test::Unit::TestCase
  include TestMixin

  def test_localsyncmerge
    @wf.description do
      parallel do
        parallel_branch do
          activity :a1_1, :call, :endpoint1, :call => Proc.new{sleep 0.2}
        end
        parallel_branch do
          activity :a1_2, :call, :endpoint1, :call => Proc.new{sleep 0.4}
        end
        choose do
          alternative(false) do
            parallel_branch do
              activity :a2_1, :call, :endpoint1
            end  
          end
          otherwise do
            activity :a2_2, :call, :endpoint1, :call => Proc.new{sleep 0.1}
          end
        end
      end
      activity :a3, :call, :endpoint1
    end
    @wf.start.join
    wf_sassert('|running|Ca2_2Da2_2')
    wf_assert('CALL a1_1:')
    wf_assert('CALL a1_2:')
    wf_assert('DONE a1_1')
    wf_assert('DONE a1_2')
    wf_sassert('Ca3Da3|finished|')
  end
end
