var wee_url = "";

function printInstance(href,text) {
  $("#instances").append("<div class='margin-left-huge'><img src=\"/static/Images/arrow.png\" width=\"14\" height=\"14\" class=\"small\"/> Instance <a href=\""+href+"\">"+text+"</a></div>");
}
function listInstances() {
  console.log("Fetching existing instances");
  makeRequest("GET", wee_url,
  function(result) {
    console.log("appending "+result+" to instance listing");
    $('a',result).each(function(){
      console.log(this);
      printInstance($(this).attr("href"),$(this).text());
    });  
  },
  report_failure);
}
function makeNewInstance() {
  // Fetch the url of the wee-riddle
  console.log("Creating new instance");
  $.ajax({
    type: "GET", cache: false,
    url: "remote",
    success: function(wee_url){
      // create a new instance and add a link
      var instance_name = $("#txt_name").val();
      console.log("calling: "+wee_url);
      makeRequest("POST", wee_url+"?name="+instance_name, new_instance_created, report_failure);
    }
  });
}
function new_instance_created(instance_id) {
  console.info("Adding Instance "+instance_id+"to list");
  var instance_name = $("#txt_name").val();
  console.log("Instance name = "+instance_name);
  console.log("Setting Instance Handler parameters");
  makeRequest("POST", wee_url+instance_id+"/properties/handlers?class=MonitoringHandler&argument="+encodeURIComponent(location.href+instance_id)+encodeURIComponent("/monitor"),
    function() {
      console.log("Done setting handler");
    },
    report_failure);
  printInstance(instance_id,instance_name);
}
function report_failure(text) {
  console.log("ERROR: "+text);
}
function setPolling() {
  refreshLog();
  window.setTimeout("setPolling()", 3000);
}
var lastRefresh = "1.1.1980";
function refreshLog() {
  var log_plain = "";
  makeRequest("GET", "monitor?since="+encodeURIComponent(lastRefresh),
    function(log) {
      $("entry", log).each(function(){
        stamp = $(this).attr("stamp");
        type = $(this).attr("type");
        details = $(this).attr("details");
        log_plain = log_plain+"["+stamp+"]"+type+": "+details+"<br/>";
        lastRefresh = stamp;
      });
      $("#txt_log").append("<p>"+log_plain+"</p>");
    }, report_failure
  );
}

// Fetch the url of the wee-riddle
$.ajax({
  type: "GET", cache: false,
  url: "remote",
  success: function(url){
    wee_url = url;
    setPolling();
    listInstances();
  }
});
