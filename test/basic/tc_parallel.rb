require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

class TestParallel < Test::Unit::TestCase
  include TestMixin

  def test_parallel_simple
    @wf.description do
      parallel do
        parallel_branch do
          activity :a_1, :call, :endpoint1, :call =>  Proc.new{ sleep 0.5 }
        end
        parallel_branch do
          activity :a_2, :call, :endpoint1, :call =>  Proc.new{ sleep 0.5 }
        end
        parallel_branch do
          activity :a_3, :call, :endpoint1, :call =>  Proc.new{ sleep 0.5 }
        end
      end
    end
    wf = @wf.start
    sleep(0.25)
    wf_assert("CALL a_1:")
    wf_assert("CALL a_2:")
    wf_assert("CALL a_3:")
    wf.join
    wf_assert("DONE a_1")
    wf_assert("DONE a_2")
    wf_assert("DONE a_3")
  end
  def test_parallel_wait
    @wf.description do
      parallel :wait do
        parallel_branch do
          activity :a_1, :call, :endpoint1
        end
        parallel_branch do
          activity :a_2, :call, :endpoint1, :call =>  Proc.new{ sleep 0.5 }
        end
      end
      activity :a_3, :call, :endpoint1
    end
    @wf.start.join
    wf_assert('CALL a_1')
    wf_assert('DONE a_1')
    wf_assert('CALL a_2')
    wf_sassert('Da_2Ca_3Da_3|finished|')
  end
  def test_parallel_nowait
    @wf.description do
      parallel :wait => 1 do
        parallel_branch do
          activity :a_1, :call, :endpoint1
        end
        parallel_branch do
          activity :a_2, :call, :endpoint1, :call =>  Proc.new{ sleep 8.5 }
        end
      end
      activity :a_3, :call, :endpoint1
    end
    @wf.start.join
    wf_assert('CALL a_1')
    wf_assert('CALL a_2')
    wf_sassert('NLNa_2Ca_3Da_3|finished|')
  end
  def test_parallel_no_longer_necessary
    @wf.description do
      parallel :wait => 1 do
        parallel_branch do
          activity :a_1, :call, :endpoint1
        end
        parallel_branch do
          activity :a_2, :call, :endpoint1, :call =>  Proc.new{ sleep 0.5 }
          activity :a_2_2, :call, :endpoint1
        end
      end
      activity :a_3, :call, :endpoint1
    end
    @wf.start.join
    wf_assert('CALL a_1')
    wf_assert('CALL a_2')
    wf_sassert('NLNa_2Ca_3Da_3|finished|')
  end
  def test_parallel_nested
    # |- :a_1
    # |-|-|- :a_2_1_1
    # |-|-|- :a_2_1_2
    # |-|-|- => :a_2_1_3
    # |-|- :a_2_2
    # |-|- :a_2_3
    # |- => :a_3
    @wf.description do
      parallel :wait do
        parallel_branch do activity :a_1, :call, :endpoint1 end
        parallel_branch do
          parallel :wait do
            parallel_branch do
              parallel :wait do
                parallel_branch do activity :a_2_1_1, :call, :endpoint1, :call => Proc.new {sleep 0.2} end
                parallel_branch do activity :a_2_1_2, :call, :endpoint1, :call => Proc.new {sleep 0.4}  end
              end
              activity :a_2_1_3, :call, :endpoint1, :call => Proc.new {sleep 0.8} 
            end
            parallel_branch do activity :a_2_2, :call, :endpoint1, :call => Proc.new {sleep 0.8}  end
            parallel_branch do activity :a_2_3, :call, :endpoint1, :call => Proc.new {sleep 1.0}  end
          end
        end
      end
      activity :a_3, :call, :endpoint1
    end
    @wf.start.join
    nump = $long_track.split("\n").delete_if{|e| !(e =~ /^(DONE)/)}
    assert(nump == ["DONE a_1", "DONE a_2_1_1", "DONE a_2_1_2", "DONE a_2_2", "DONE a_2_3", "DONE a_2_1_3", "DONE a_3"], "not in the right order, sorry")
  end
end
