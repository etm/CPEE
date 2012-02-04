require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

class TestWFPSequence < Test::Unit::TestCase
  include TestMixin

  def test_sequence
    @wf.description do
      activity :a1_1, :call, :endpoint1
      activity :a1_2, :call, :endpoint1
      activity :a1_3, :call, :endpoint1
    end
    @wf.start.join
    wf_sassert('|running|Ca1_1Da1_1Ca1_2Da1_2Ca1_3Da1_3|finished|')
  end
end
