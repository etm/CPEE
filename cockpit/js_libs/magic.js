$(document).ready(function(){
  //$(".machine_status").hide();
  $.ajax({
    url: "http://cranex.wst.univie.ac.at:9200/attachments",
    type : "GET",
    dataType: "json",
    success: function(data){
      if(Object.keys(data.motors).length != 4 || (typeof data.motors.motor1) === 'undefined' || (typeof data.motors.motor2) === 'undefined' || (typeof data.motors.motor3) === 'undefined' || (typeof data.motors.motor4) === 'undefined')
        return false;
      if(data.motors.motor1.slot != 'A' || data.motors.motor2.slot != 'B' || data.motors.motor3.slot != 'C' || data.motors.motor4.slot != 'D')
        return false;
      if(Object.keys(data.sensors).length != 2 || (typeof data.sensors.conveyor) === 'undefined' || (typeof data.sensors.plate) === 'undefined' )
        return false;
      if(data.sensors.plate.slot != 1 || data.sensors.conveyor.slot != 2)
        return false;
    }
  });
});
