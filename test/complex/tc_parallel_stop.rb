require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

class TestParallelStop < Test::Unit::TestCase
  include TestMixin

  def test_coopis
    @wf.data[:hotels]  = []
    @wf.data[:costs]   = 0
    @wf.description do
      parallel do
        parallel_branch do
          activity :a1, :call, :endpoint1 do
            data.hotels << 'Rathaus'
            data.costs += 200
          end
          activity :a3, :call, :stop
        end
        parallel_branch do
          activity :a2, :call, :endpoint2 do
            data.hotels << 'Graf Stadion'
            data.costs += 200
          end
          activity :a4, :call, :stop
        end
      end
    end
    @wf.start.join

    wf_rsassert('\|stopped\|')
  end
end
