function unhide(divID) {
  var item = document.getElementById(divID);
  if (item) {
    item.className=(item.className=='invisible')?'visible':'invisible';
  }
}

var wee_url = "";
var running = false;

function report_failure(text) {
  // // console.log("ERROR: "+text);
  $("#div_message").text(text);
}

function loadInstance() {
    // // console.log("Loading instance data");

    // Getting the monitoring handlers and args
    monitor_i = 0;
    makeRequest(
        "GET", (wee_url+location.pathname+"/properties/handlers/monitor/"),
        function(xml){
            var handler_text = "";
            var count = 0;
            // // console.log(xml)
            $(xml).find("a").each(function() {
              var a = $(this);
              var handler_urls = a.text().split(",");
              for(var i = 0; i < handler_urls.length; i++) {
                  if(handler_urls[i] != "")
                    handler_text += generateMonitor(handler_urls[i]);
              }
              count++;
              if(count == $(xml).find("a").length) replaceMonitor(handler_text);
            })
        }, report_failure
    );

    // Getting the name of the Instance
    makeRequest(
      "GET", (wee_url+location.pathname+"/properties/name"),
      function(xml){

      },
      function(){
      },
      report_failure
    );
    // Getting the state of execution
    makeRequest(
        "GET", (wee_url+location.pathname+"/state/"),
        function(instance_state){
            $("#div_state").text(instance_state);
            if(instance_state == "finished") {
                running = false;
                $("#btn_startstop").val("Start");
                toggleControls(true);
            }
        },report_failure
    );
    // Getting the workflow description
    makeRequest(
        "GET", (wee_url+location.pathname+"/properties/description/"),
        function(instance_description){
            if(running) {
               makeRequest(
                    "GET", (location.pathname+"/monitor/actpos"),
                    function(actPos) {
                        var desc_to_set = "";
                        var lines = instance_description.split("\n");
                        for(var i = 0; i < lines.length; i++) {
                            var actDescLine = lines[i];
                            var text = $("#template_description").html();
                            if(actDescLine.indexOf(":"+actPos) != -1)
                                text = text.replace(/arrow/,$("#template_arrow").html());
                            else
                                text = text.replace(/arrow/,"");
                            text = text.replace(/description/,actDescLine);
                            desc_to_set += text
                        }
                        $("#div_description").html(desc_to_set);
                    }, report_failure
                )
            }else {
                $("#div_description").html("<textarea id=\"txt_description\" cols=\"60\" rows=\"10\">"+instance_description+"</textarea>");
            }
        }, report_failure
    );
    // Getting the Context
    context_i = 0;
    makeRequest(
        "GET", (wee_url+location.pathname+"/properties/context/"),
        function(xml){
            var context_text = "";
            var count = 0;
            $(xml).find("a").each(function() {
              var a = $(this);
              var context_id = a.text();
              makeRequest(
                "GET", (wee_url+location.pathname+"/properties/context/"+context_id),
                function(context_value){
                  context_text += generateContext(context_id, context_value);
                  count++;
                  if(count == $(xml).find("a").length) {
                    replaceContext(context_text);
                  }
                },report_failure
              );
            })
        }, report_failure
    );

    // Getting the Endpoints
    endpoint_i = 0;
    makeRequest(
        "GET", (wee_url+location.pathname+"/properties/endpoints/"),
        function(xml){
            var endpoint_text = "";
            var count = 0;
            $(xml).find("a").each(function() {
              var a = $(this);
              var endpoint_id = a.text();
              makeRequest(
                "GET", (wee_url+location.pathname+"/properties/endpoints/"+endpoint_id),
                function(endpoint_value){
                  endpoint_text += generateEndpoint(endpoint_id, endpoint_value);
                  count++;
                  if(count == $(xml).find("a").length) replaceEndpoints(endpoint_text)
                },report_failure
              );
            })
        }, report_failure
    );
}
var monitor_i = 0;
function replaceMonitor(text) {
    $("#div_monitor").html($("#monitor_add_button").html()+text);
}
function generateMonitor(value) {
    // // console.log("generatemonitor: "+value);
    var text = $("#add_monitor").html();
    text = text.replace(/monitor_url/,"monitor_url_" + monitor_i);
    text = text.replace(/value=\"value\"/, "value=\""+value+"\"");
    monitor_i += 1;
    return text;
}
var context_i = 0;
function replaceContext(text) {
    $("#div_context").html($("#context_add_button").html()+text);
}
function generateContext(name, value) {
    var text = $("#add_context").html();
    text = text.replace(/context_variable_name/,"context_variable_name_" + context_i);
    text = text.replace(/context_variable_value/,"context_variable_value_" + context_i);
    text = text.replace(/value=\"name\"/, "value=\""+name+"\"");
    text = text.replace(/value=\"value\"/, "value=\""+value+"\"");
    context_i += 1;
    return text;
}
var endpoint_i = 0;
function replaceEndpoints(text) {
    $("#div_endpoints").html($("#endpoint_add_button").html()+text);
}
function generateEndpoint(name, url) {
    var text = $("#add_endpoint").html();
    text = text.replace(/endpoint_name/,"endpoint_name_" + endpoint_i);
    text = text.replace(/endpoint_value/,"endpoint_value_" + endpoint_i);
    text = text.replace(/value=\"name\"/, "value=\""+name+"\"");
    text = text.replace(/value=\"url\"/, "value=\""+url+"\"");
    endpoint_i += 1;
    return text;
}

function setMonitor_serverside(urls) {
    // // console.log("URLS: "+urls)
    makeRequest("POST", wee_url+location.pathname+"/properties/handlers/monitor?class=MonitoringHandler&argument="+urls,
        function() {
          // // console.log("Done setting handler");
        },
        report_failure
    );
}
function setContextVariable_serverside(context_id, context_value) {
    makeRequest(
        "POST", (wee_url+location.pathname+"/properties/context?id="+context_id+"&value="+context_value),
        function(){
        },report_failure
    );
}
function setEndpoint_serverside(endpoint_id, endpoint_value) {
    makeRequest(
        "POST", (wee_url+location.pathname+"/properties/endpoints?id="+endpoint_id+"&value="+endpoint_value),
        function(){
        },report_failure
    );
}
function setSearch_serverside(pos) {
    makeRequest(
        "PUT", (wee_url+location.pathname+"/state?pos="+encodeURIComponent(pos)+"&detail=at&passthrough="),
        function(){
        },report_failure
    );
}
function setDescription_serverside(description) {
    makeRequest(
        "PUT", (wee_url+location.pathname+"/properties/description?description="+encodeURIComponent(description)),
        function(){
        },report_failure
    );
}

function apply() {
    // apply monitors
    var value = new Array();
    for(var i = 0; i < monitor_i; i++) {
        value.push($("#monitor_url_"+i).val());
    }
    setMonitor_serverside(value.join(","));

    // apply context
    for(var i = 0; i < context_i; i++) {
        var name = $("#context_variable_name_"+i).val();
        var value = $("#context_variable_value_"+i).val();
        setContextVariable_serverside(name, value);
    }
    // apply endpoints
    for(var i = 0; i < endpoint_i; i++) {
        var name = $("#endpoint_name_"+i).val();
        var value = $("#endpoint_value_"+i).val();
        setEndpoint_serverside(name, value);
    }
    // apply search
    var pos = $("#txt_search").val();
    setSearch_serverside(pos);
    // apply description
    var desc = $("#txt_description").val();
    setDescription_serverside(desc);
}

function setPolling() {
    if(running) {
        window.setTimeout("setPolling()", 3000);
        loadInstance();
    }
}
function togglestartstop() {
    if(!running) {
        start();
    }
    else {
        stop();
    }

}
function start() {
    // deactivate controls
    // start the wee
    // // console.log("Starting the wee")
    makeRequest(
        "PUT", (wee_url+location.pathname+"/state?control=start"),
        function(instance_state){
            // // console.log("got instance state = "+instance_state);
            $("#div_state").text(instance_state);
            // update start/stop button
            $("#btn_startstop").val("Stop");
            running = true;
            // refresh ui constantly
            setPolling();
            toggleControls(false);
        },report_failure
    );

}
function stop() {
    // stop the wee
    // console.log("Stop the wee")
    makeRequest(
        "PUT", (wee_url+location.pathname+"/state?control=stop"),
        function(instance_state){
            // console.log("got instance state = "+instance_state);
            $("#div_state").text(instance_state);
            // update start/stop button
            $("#btn_startstop").val("Start");
            running = false;
            loadInstance();
            toggleControls(true);
        },report_failure
    );
}
function toggleControls(on) {
  if(!on) {
    $('input[type=text]').attr('disabled', 'disabled');
    $('input[type=button]').attr('disabled', 'disabled');
    $('button').attr('disabled', 'disabled');
    $('#btn_startstop').removeAttr('disabled');
  }
  else {
    $('input[type=text]').removeAttr('disabled');
    $('input[type=button]').removeAttr('disabled');
    $('button').removeAttr('disabled');
  }
}

// console.log("Fetching wee url");
$.ajax({
  type: "GET",
  url: "remote",
  cache: false,
  success: function(url){
    wee_url = url;
    // console.log("got wee url: "+wee_url+". my path is "+location.pathname);
    loadInstance();
  }
});
