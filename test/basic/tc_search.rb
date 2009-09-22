require 'test/unit'
require ::File.dirname(__FILE__) + '/../TestWorkflow'

class TestSearch < Test::Unit::TestCase
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

  def test_check_search
    search = $wf.search_positions
    assert(search.is_a?(Array), "Search is not a Array, it is: #{search}")
    assert(search.size == 1, "Search does not have exectly 1 entry, it has #{search.size}")
    assert(search[0].is_a?(Wee::SearchPos), "Value of search is not a searchposition")
    assert(search[0].position == :a1_1, "SearchPosition has wrong position value")
    assert(search[0].detail == :at, "SearchPosition has wrong detail value")
    assert(search[0].passthrough == nil, "SearchPosition has wrong passthrough value")
  end
  def test_set_search
    $wf.search = [Wee::SearchPos.new(:a2_1_1, :at, 'test1'), Wee::SearchPos.new(:a2_1_1, :at, 'test2')]
    search = $wf.search_positions
    assert(search.is_a?(Array), "Search is not a Array, it is: #{search}")
    assert(search.size == 2, "Search does not have exectly 2 entries, it has #{search.size}")
    assert(search[0].position == :a2_1_1, "SearchPosition[0] has wrong position value")
    assert(search[0].detail == :at, "SearchPosition[0] has wrong detail value")
    assert(search[0].passthrough == "test1", "SearchPosition[0] has wrong passthrough value")
    assert(search[1].position == :a2_1_1, "SearchPosition[1] has wrong position value")
    assert(search[1].detail == :at, "SearchPosition[1] has wrong detail value")
    assert(search[1].passthrough == "test2", "SearchPosition[1] has wrong passthrough value")
  end
  def test_set_search_false
    $wf.search = false
    search = $wf.search_positions
    assert(search.is_a?(Array), "Search is not a Array, it is: #{search}")
    assert(search.size == 0, "Search does not have exectly 0 entries, it has #{search.size}")

  end
  def test_search_impact_single
    $wf.replace do
      activity :a1_1, :call, endpoint1
      activity :a1_2, :call, endpoint1
      activity :a1_3, :call, endpoint1
    end
    $wf.search= Wee::SearchPos.new(:a1_2, :at)
    $wf_thread = Thread.new { $wf_result = $wf.start };
    $released +="release a1_1";
    $released +="release a1_2";
    $released +="release a1_3";
    sleep(0.1)
    assert(!$message.include?("Activity a1_1 done"), "pos a1_1 should not have been executed, see $message=#{$message}");
    assert($message.include?("Activity a1_2 done"), "pos a1_2 not properly ended, see $message=#{$message}");
    assert($message.include?("Activity a1_3 done"), "pos a1_3 not properly ended, see $message=#{$message}");
  end
  def test_search_impact_dual
    $wf.replace do
      activity :a1, :call, endpoint1
      parallel do
        parallel_branch do
          activity :a2_1, :call, endpoint1
        end
        parallel_branch do
          activity :a2_2, :call, endpoint1
        end
      end
      activity :a3, :call, endpoint1
    end
    $wf.search= [Wee::SearchPos.new(:a2_1, :at), Wee::SearchPos.new(:a2_2, :at)]
    $wf_thread = Thread.new { $wf_result = $wf.start };
    $released +="release a1";
    $released +="release a2_1";
    $released +="release a2_2";
    $released +="release a3";
    sleep(0.1)
    assert(!$message.include?("Activity a1 done"), "pos a1 should not have been executed, see $message=#{$message}");
    assert($message.include?("Activity a2_1 done"), "pos a2_1 not properly ended, see $message=#{$message}");
    assert($message.include?("Activity a2_2 done"), "pos a2_2 not properly ended, see $message=#{$message}");
    assert($message.include?("Activity a3 done"), "pos a3 not properly ended, see $message=#{$message}");
  end
end
