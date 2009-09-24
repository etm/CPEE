var wee_url = "";

function listInstances() {
  console.log("Fetching existing instances");
  makeRequest("GET", wee_url,
  function(result) {
    console.log("appending "+result+" to instance listing");
    $('a',result).each(function(){
      console.log(this);
      $("#instances").append("<div>Instance <a href=\""+$(this).attr("href")+"\">"+$(this).text()+"</a></div>");
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
  $("#instances").append("<div>Instance <a href=\""+instance_id+"\">"+instance_name+"</a></div>");
}
function report_failure(text) {
  console.log("ERROR: "+text);
}
function makeRequest(method, url, success, failure) {
  var req = new XMLHttpRequest();
  req.open(method, url, true);
  req.onreadystatechange = function (e) {
    if (req.readyState === 4) {
      if(req.status === 200) {
        success(req.responseText);
      } else {
        failure("method "+method+" to "+url+" failed");
      }
      method
    }
  };  
  req.send(null);
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

// maximize log
function setHeight() {
  if (typeof window.innerHeight != 'undefined') {
    var secure = 5;
    var cc = $('contentcontainer');
    var ic = $('icontent');
    var co = $('content');
    var h_text = $('CEWebS_text');
    if (cc.getHeight() == ic.getHeight()) {
      var h_window  = document.viewport.getHeight();
      var h_content = document.getElementsByTagName('body')[0].getHeight();
      var imed = (parseInt(co.getStyle('margin-bottom'))+parseInt(co.getStyle('padding-bottom')));
      if (h_window - h_content != 0) {
        h_text.style.height = (h_text.getHeight() + (h_window - h_content) - imed - secure)  + 'px';
      } else
        h_text.style.height = (h_text.offsetParent.getHeight()) + 'px';
    } else {
      var imed = (parseInt(co.getStyle('margin-top'))+parseInt(co.getStyle('margin-bottom'))+parseInt(co.getStyle('padding-top'))+parseInt(co.getStyle('padding-bottom')));
      h_text.style.height = (h_text.getHeight() + cc.getHeight() - ic.getHeight() - (co.positionedOffset().top * 2) - secure - imed) + 'px';
    }  
  }  
}
// window.onload = function() { setHeight(); };
// window.onresize = function() { setHeight(); };

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
