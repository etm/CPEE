$:.unshift File.join(File.dirname(__FILE__),'..', '..','lib')

require 'test/unit'
require 'TestWorkflow'

class TestContext < Test::Unit::TestCase
  def setup
    $message = ""
    $released = ""
    $wf = TestWorkflow.new
    $wf.endstate=:normal;
  end
  def teardown
    $wf.stop
    $message = ""
    $released = ""
    $wf_thread.join if defined?($wf_thread)
  end
  def test_check_context
    context = $wf.context
    assert(context.is_a?(Hash), "Context is not a Hash")
    assert(context.size == 1, "Context has not exactly 1 element, it has #{context.size}")
    assert(context.keys[0] == :@x, "Context.keys[0] has not the correct value [#{context.keys[0]}]")
    assert(context[:@x] == "begin_", "Context[:@x] has not the correct value")
  end
  def test_set_context
    $wf.context = {:x => "test1", :y =>"test2"}
    context = $wf.context
    assert(context.is_a?(Hash), "Context is not a Hash")
    assert(context.size == 2, "Context has not exactly 1 element, it has #{context.size}")
    assert(context.keys.include?(:@x), "Context has no key @x")
    assert(context.keys.include?(:@y), "Context has no key @y")
    assert(context[:@x] == "test1", "Context[:@x] has not the correct value [#{context[:@x]}]")
    assert(context[:@y] == "test2", "Context[:@y] has not the correct value [#{context[:@y]}]")
  end
  def test_context_impact
    assert($wf.instance_eval("@x") == "begin_", "Instance_eval of @x delivered wrong result")
    $wf.instance_eval("@x = 1")
    assert($wf.instance_eval("@x") == 1, "Instance_eval of @x = 1, wrong new value")
  end
end
