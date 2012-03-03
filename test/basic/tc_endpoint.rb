require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

class TestEndpoint < Test::Unit::TestCase
  include TestMixin

  def test_check_endpoint
    ep1 = @wf.endpoints[:endpoint1]
    assert(ep1.is_a?(String), "Endpoint1 is no string but should be")
    assert(ep1 == "http://www.heise.de", "Endpoint1 has wrong value [#{ep1}]")
  end
  def test_create_endpoint
    @wf.endpoint :endpoint2 => "http://www.test.at"
    ep2 = @wf.endpoints[:endpoint2]
    assert(ep2.is_a?(String), "Endpoint1 is no string but should be")
    assert(ep2 == "http://www.test.at", "Endpoint1 has wrong value [#{ep2}]")
  end
  def test_change_endpoint
    @wf.endpoint :endpoint1 => "http://www.newpoint.com"
    ep1 = @wf.endpoints[:endpoint1]
    assert(ep1.is_a?(String), "Endpoint1 is no string but should be")
    assert(ep1 == "http://www.newpoint.com", "Endpoint1 has wrong value [#{ep1}]")
  end
  def test_change_endpoint2
    @wf.endpoints[:endpoint1] = "http://www.newpoint2.com"
    ep1 = @wf.endpoints[:endpoint1]
    assert(ep1.is_a?(String), "Endpoint1 is no string but should be")
    assert(ep1 == "http://www.newpoint2.com", "Endpoint1 has wrong value [#{ep1}]")
  end

  def test_endpoints
    @wf.endpoint :endpoint2 => "http://www.test.at" # asure that there is endpoint1 & endpoint2
    @wf.endpoints[:endpoint1]="http://www.test2.com" # asure that ep1 has original value
    eps = @wf.endpoints
    assert(eps.is_a?(Hash), "Endpoints should result a Hash but returns a #{eps.class}")
    assert(eps.size == 3, "Endpoints should have two entries: #{eps.inspect}")
    assert(eps[:endpoint1] == "http://www.test2.com", "Endpoint 1 has wrong value or does not exist: #{eps.inspect}")
    assert(eps[:endpoint2] == "http://www.test.at", "Endpoint 2 has wrong value or does not exist: #{eps.inspect}")
  end
end
