require ::File.dirname(__FILE__) + '/../../lib/Wee'
require ::File.dirname(__FILE__) + '/../../lib/BasicHandler'

class Workflow < Wee
  handler BasicHandler


  control flow do
# Begin Context variables
#===============================================================================
context :usr_a_01_title => ""
context :usr_a_01_preferredStartingTime => ""
context :usr_a_01_date => ""
context :usr_a_01_numberOfSeats => ""
context :out_a_01_price => ""
context :out_a_01_reservationID => ""
context :out_a_01_startingTime => ""
context :out_a_01_date => ""
context :usr_a_02_fromCity => ""
context :usr_a_02_fromHousenumber => ""
context :usr_a_02_fromZip => ""
context :usr_a_02_fromStreet => ""
context :usr_a_02_numberOfSeats => ""
context :usr_a_02_fromState => ""
context :out_a_02_price => ""
context :out_a_02_reservationID => ""
context :out_a_02_arraivelTime => ""
context :out_a_02_departureTime => ""
context :out_a_02_arraivelDate => ""
context :out_a_02_departureDate => ""
context :out_a_02_invokeID => ""
context :usr_a_03_toState => ""
context :usr_a_03_toZip => ""
context :usr_a_03_numberOfSeats => ""
context :usr_a_03_toHousenumber => ""
context :usr_a_03_toCity => ""
context :usr_a_03_toStreet => ""
context :out_a_03_price => ""
context :out_a_03_reservationID => ""
context :out_a_03_arraivelTime => ""
context :out_a_03_departureTime => ""
context :out_a_03_arraivelDate => ""
context :out_a_03_departureDate => ""
context :out_a_03_invokeID => ""

#===============================================================================
# Begin Endpoint defintions
#===============================================================================
endpoint :ep_01 => "Cinemas"
endpoint :ep_02 => "Transport/Brooms"
endpoint :ep_03 => "Transport/Carpets"

#===============================================================================
# Begin Activities
#===============================================================================
# Input_Assignments:
#        Input named title is given by out_usr_null
#        Input named preferredStartingTime is given by out_usr_null
#        Input named date is given by out_usr_null
#        Input named numberOfSeats is given by out_usr_null

# Output_Assignments:
#        Output named price is stored in out_a_01_price
#        Output named reservationID is stored in out_a_01_reservationID
#        Output named startingTime is stored in out_a_01_startingTime
#        Output named date is stored in out_a_01_date

activity :a_01, :call, ep_01 ,@out_usr_null ,@out_usr_null ,@out_usr_null ,@out_usr_null  do |price, reservationID, startingTime, date|
#Comment=iPhoneClient,title=out_usr_null,preferredStartingTime=out_usr_null,date=out_usr_null,numberOfSeats=out_usr_null
        @out_a_01_price = price
        @out_a_01_reservationID = reservationID
        @out_a_01_startingTime = startingTime
        @out_a_01_date = date
end
#===============================================================================
# Input_Assignments:
#        Input named departureTime is given by out_a_01_startingTime
#        Input named fromCity is given by out_usr_null
#        Input named departureDate is given by out_a_01_date
#        Input named fromHousenumber is given by out_usr_null
#        Input named fromZip is given by out_usr_null
#        Input named toState is given by out_a_01_state
#        Input named fromStreet is given by out_usr_null
#        Input named toZip is given by out_a_01_zip
#        Input named numberOfSeats is given by out_usr_null
#        Input named toHousenumber is given by out_a_01_housenumber
#        Input named fromState is given by out_usr_null
#        Input named toCity is given by out_a_01_city
#        Input named toStreet is given by out_a_01_street

# Output_Assignments:
#        Output named price is stored in out_a_02_price
#        Output named reservationID is stored in out_a_02_reservationID
#        Output named arraivelTime is stored in out_a_02_arraivelTime
#        Output named departureTime is stored in out_a_02_departureTime
#        Output named arraivelDate is stored in out_a_02_arraivelDate
#        Output named departureDate is stored in out_a_02_departureDate
#        Output named invokeID is stored in out_a_02_invokeID

activity :a_02, :call, ep_02 ,@out_a_01_startingTime  ,@out_usr_null ,@out_a_01_date ,@out_usr_null ,@out_usr_null ,@out_a_01_state ,@out_usr_null ,@out_a_01_zip ,@out_usr_null ,@out_a_01_housenumber ,@out_usr_null ,@out_a_01_city ,@out_a_01_street do |price, reservationID, arraivelTime, departureTime, arraivelDate, departureDate, invokeID|
#Comment=iPhoneClient,departureTime=out_a_01_startingTime ,fromCity=out_usr_null,departureDate=out_a_01_date,fromHousenumber=out_usr_null,fromZip=out_usr_null,toState=out_a_01_state,fromStreet=out_usr_null,toZip=out_a_01_zip,numberOfSeats=out_usr_null,toHousenumber=out_a_01_housenumber,fromState=out_usr_null,toCity=out_a_01_city,toStreet=out_a_01_street
        @out_a_02_price = price
        @out_a_02_reservationID = reservationID
        @out_a_02_arraivelTime = arraivelTime
        @out_a_02_departureTime = departureTime
        @out_a_02_arraivelDate = arraivelDate
        @out_a_02_departureDate = departureDate
        @out_a_02_invokeID = invokeID
end
#===============================================================================
# Input_Assignments:
#        Input named departureTime is given by out_a_01_startingTime
#        Input named fromCity is given by out_a_01_city
#        Input named departureDate is given by out_a_01_date
#        Input named fromHousenumber is given by out_a_01_housenumber
#        Input named fromZip is given by out_a_01_zip
#        Input named toState is given by out_usr_null
#        Input named fromStreet is given by out_a_01_street
#        Input named toZip is given by out_usr_null
#        Input named numberOfSeats is given by out_usr_null
#        Input named toHousenumber is given by out_usr_null
#        Input named fromState is given by out_a_01_state
#        Input named toCity is given by out_usr_null
#        Input named toStreet is given by out_usr_null

# Output_Assignments:
#        Output named price is stored in out_a_03_price
#        Output named reservationID is stored in out_a_03_reservationID
#        Output named arraivelTime is stored in out_a_03_arraivelTime
#        Output named departureTime is stored in out_a_03_departureTime
#        Output named arraivelDate is stored in out_a_03_arraivelDate
#        Output named departureDate is stored in out_a_03_departureDate
#        Output named invokeID is stored in out_a_03_invokeID

activity :a_03, :call, ep_03 ,@out_a_01_startingTime  ,@out_a_01_city ,@out_a_01_date ,@out_a_01_housenumber ,@out_a_01_zip ,@out_usr_null ,@out_a_01_street ,@out_usr_null ,@out_usr_null ,@out_usr_null ,@out_a_01_state ,@out_usr_null ,@out_usr_null do |price, reservationID, arraivelTime, departureTime, arraivelDate, departureDate, invokeID|
#Comment=iPhoneClient,departureTime=out_a_01_startingTime ,fromCity=out_a_01_city,departureDate=out_a_01_date,fromHousenumber=out_a_01_housenumber,fromZip=out_a_01_zip,toState=out_usr_null,fromStreet=out_a_01_street,toZip=out_usr_null,numberOfSeats=out_usr_null,toHousenumber=out_usr_null,fromState=out_a_01_state,toCity=out_usr_null,toStreet=out_usr_null
        @out_a_03_price = price
        @out_a_03_reservationID = reservationID
        @out_a_03_arraivelTime = arraivelTime
        @out_a_03_departureTime = departureTime
        @out_a_03_arraivelDate = arraivelDate
        @out_a_03_departureDate = departureDate
        @out_a_03_invokeID = invokeID
end
#===============================================================================
  end
end