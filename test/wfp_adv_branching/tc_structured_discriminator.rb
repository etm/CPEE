require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

# only variant Cancelling Discriminator is implemented, but that's the coolest one 8)
class TestWFPStructuredDiscriminator < Test::Unit::TestCase
  include TestMixin

  def test_cancelling_discriminator
    @wf.description do
      parallel :wait => 1 do
        parallel_branch do
          activity :a_1_1, :call, :endpoint1
        end
        parallel_branch do
          activity :a_1_2, :call, :endpoint1, :call => Proc.new{sleep 0.2}
        end
      end
      activity :a_2, :call, :endpoint1
    end
    t = @wf.start.join
    wf_assert("CALL a_1_1:")
    wf_assert("CALL a_1_2:")
    wf_assert("CALL a_2:")
    wf_assert("NO_LONGER_NECCESARY a_1_2")
    wf_assert("DONE a_1_1")
    wf_assert("DONE a_2")
  end
end
