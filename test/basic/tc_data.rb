require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

class TestData < Test::Unit::TestCase
  include TestMixin

  def test_check_data
    data = @wf.data
    assert(data.is_a?(Hash), "data is not a Hash")
    assert(data.size == 1, "data has not exactly 1 element, it has #{data.size}")
    assert(data.keys[0] == :x, "data.keys[0] has not the correct value [#{data.keys[0]}]")
    assert(data[:x] == "begin_", "data[:x] has not the correct value")
  end
  def test_set_data_variable
    @wf.data[:a] = "test1"
    data = @wf.data
    assert(data.is_a?(Hash), "data is not a Hash")
    assert(data.keys.include?(:a), "data has no key :a")
    assert(data[:a] == "test1", "data[:a] has not the correct value [#{data[:x]}]")
  end
  def test_set_data
    @wf.data[:x] = "test1"
    @wf.data[:y] = "test2"
    data = @wf.data
    assert(data.is_a?(Hash), "data is not a Hash")
    assert(data.size == 2, "data has not exactly 1 element, it has #{data.size}")
    assert(data.keys.include?(:x), "data has no key x")
    assert(data.keys.include?(:y), "data has no key y")
    assert(data[:x] == "test1", "data[:x] has not the correct value [#{data[:x]}]")
    assert(data[:y] == "test2", "data[:y] has not the correct value [#{data[:y]}]")
  end
end
