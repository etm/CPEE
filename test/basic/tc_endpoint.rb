$:.unshift File.join(File.dirname(__FILE__),'..', '..','lib')

require 'test/unit'
require 'TestWorkflow'

class TestEndpoint < Test::Unit::TestCase
  def setup
    $message = ""
    $released = ""
    $wf = TestWorkflow.new
  end
  def teardown
    $wf.stop
    $message = ""
    $released = ""
    $wf_thread.join if defined?($wf_thread)
  end
  def test_check_endpoint
    assert($wf.method(:endpoint1) != nil, "Workflow has no method endpoint1")
    ep1 = $wf.endpoint1
    assert(ep1.is_a?(String), "Endpoint1 is no string but should be")
    assert(ep1 == "http://www.heise.de", "Endpoint1 has wrong value [#{ep1}]")
  end
  def test_create_endpoint
    $wf.endpoint :endpoint2 => "http://www.test.at"
    assert($wf.method(:endpoint2) != nil, "Workflow has no method endpoint1")
    ep2 = $wf.endpoint2
    assert(ep2.is_a?(String), "Endpoint1 is no string but should be")
    assert(ep2 == "http://www.test.at", "Endpoint1 has wrong value [#{ep2}]")
  end
  def test_change_endpoint
    $wf.endpoint :endpoint1 => "http://www.newpoint.com"
    assert($wf.method(:endpoint1) != nil, "Workflow has no method endpoint1")
    ep1 = $wf.endpoint1
    assert(ep1.is_a?(String), "Endpoint1 is no string but should be")
    assert(ep1 == "http://www.newpoint.com", "Endpoint1 has wrong value [#{ep1}]")
  end
end
