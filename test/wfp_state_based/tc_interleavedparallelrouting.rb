require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

# implemented as a combination of the Cancelling Structured Partial Join and the Exclusive Choice Pattern
class TestWFPInterleavedParallelRouting < Test::Unit::TestCase
  include TestMixin

  def test_interleaved
    @wf.description do
      parallel do
        parallel_branch do
          critical(:section1) do
            activity :a1, :call, :endpoint1
          end
          critical(:section1) do
            activity :a3, :call, :endpoint1
          end
        end
        parallel_branch do
          critical(:section1) do
            activity :a2, :call, :endpoint1
          end
        end
      end
    end
    @wf.start.join
    nump = $long_track.split("\n").delete_if{|e| !(e =~ /^(DONE|CALL)/)}.map{|e| e.gsub(/ .*/,'')}
    assert(nump == ["CALL", "DONE", "CALL", "DONE", "CALL", "DONE"], "not in the right order, sorry")
  end
end
