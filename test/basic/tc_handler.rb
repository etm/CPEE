require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

class TestCaseHandler < Test::Unit::TestCase
  include TestMixin

  def test_handler
    assert_raise RuntimeError do
      @wf.handlerwrapper = String
    end
    assert_nothing_raised do
      @wf.handlerwrapper = TestHandlerWrapper
    end
  end
  def test_handlerargs
    @wf.handlerwrapper_args =  ["1", "2"]
    assert(@wf.handlerwrapper_args.is_a?(Array), "Handler arguments is not an array, it is a #{@wf.handlerwrapper_args.inspect}")
  end
end
