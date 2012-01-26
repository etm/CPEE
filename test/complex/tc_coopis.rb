require 'test/unit'
require File.expand_path(::File.dirname(__FILE__) + '/../TestWorkflow')

class TestChoose < Test::Unit::TestCase
  include TestMixin

  def test_coopis
    @wf.data[:hotels]  = []
    @wf.data[:airline] = ''
    @wf.data[:costs]   = 0
    @wf.data[:persons] = 3
    @wf.description do
      activity :a1, :call, :endpoint1 do
        data.airline = 'Aeroflot'
        data.costs  += 101
        status.update 1, 'Hotel'
      end
      parallel do
        loop pre_test{data.persons > 0} do
          parallel_branch data.persons do |p|
            activity :a2, :call, :endpoint1 do
              data.hotels << 'Rathaus'
              data.costs += 200
            end
          end
          activity :a3, :manipulate do
            data.persons -= 1
          end
        end
      end
      choose do
        alternative data.costs > 700 do
          activity :a4, :call, :endpoint1
        end
      end
    end
    @wf.start.join

    assert($short_track == 'SrunningCa1Da1Da3Da3Da3Ca2Ca2Ca2Da2Da2Da2Ca4Da4Sfinished' , "Somehow executed different #{$short_track} should be 'SrunningCa1Da1Da3Da3Da3Ca2Ca2Ca2Da2Da2Da2Ca4Da4Sfinished'")
  end

  def test_coopis_searchmode
    @wf.data[:hotels]  = ['Marriott']
    @wf.data[:airline] = 'Ana'
    @wf.data[:costs]   = 102
    @wf.data[:persons] = 2
    @wf.description do
      activity :a1, :call, :endpoint1 do
        data.airline = 'Aeroflot'
        data.costs  += 101
        status.update 1, 'Hotel'
      end
      parallel do
        loop pre_test{data.persons > 0} do
          parallel_branch data.persons do |p|
            activity :a2, :call, :endpoint1 do
              data.hotels << 'Rathaus'
              data.costs += 200
            end
          end
          activity :a3, :manipulate do
            data.persons -= 1
          end
        end
      end
      choose do
        alternative data.costs > 700 do
          activity :a4, :call, :endpoint1
        end
      end
    end
    @wf.search [Wee::Position.new(:a3, :at)]
    @wf.start.join

    assert($short_track == 'SrunningDa3Da3Ca2Ca2Da2Da2Ca4Da4Sfinished' , "Somehow executed different #{$short_track} should be 'SrunningDa3Da3Ca2Ca2Da2Da2Ca4Da4Sfinished'")
  end
end
