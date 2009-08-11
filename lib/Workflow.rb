require 'Wee'
require 'MyHandler'

class Workflow < Wee
  handler MyHandler
  
  endpoint :epAirlineBooking => 'http://airline.com/booking'
  endpoint :epHotelBooking => 'http://hotel.com/booking'
  endpoint :epAirlinePayment => 'http://airline.com/payment'
  endpoint :epHotelPayment => 'http://hotel.com/payment'
  endpoint :epApproval => 'http://company.com/approval'

  context :persons => 3
  context :creditcard => 'Visa_12345'
  context :airBookingId => nil, :hotelBookingID => nil
  context :departure => 'Vienna', :destination => 'Prag'
  context :sum => 0
  endstate :normal

  control flow do

    cycle("@persons > 0") do
      parallel(:wait) do
        parallel_branch do
          critical(:airbooking) do
            activity :a1_1, :call, epAirBook, @departure, @destination do |id|
              @airBookingId = id
            end
            activity :a1_2, :call, epAirPay, @airBookingId, @creditcard do |amount|
              @sum += amount
            end
          end
        end
        parallel_branch do
          critical(:hotelbooking) do
            activity :a2_1, :call, epHotelBook, @destination do |id|
                @hotelBookingId = id
            end
            activity :a2_2, :call, epHotelPay, @hotelBooking, @creditcard do |amount|
              @sum += amount
            end
          end
        end
      end
      activity :a3, :manipulate do
        @persons -= 1
      end
    end
    choose do
      alternative(@sum > 10000) do
        activity :a3, :call, epApproval, @sum
      end
    end
  end
end
