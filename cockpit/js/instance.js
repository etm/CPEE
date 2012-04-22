var running = false;
var load;
var graphrealization;
var subscription;
var subscription_state = 'less';
var save = {};
    save['state']= undefined;
    save['dsl'] = undefined;
    save['endpoints'] = undefined;
    save['dataelements'] = undefined;
    save['details'] = undefined;
var node_state = {};
var sub_more = 'topic'  + '=' + 'running' + '&' +// {{{
               'events' + '=' + 'activity_calling,activity_manipulating,activity_failed,activity_done' + '&' +
               'topic'  + '=' + 'running' + '&' +
               'votes'  + '=' + 'syncing_after' + '&' +
               'topic'  + '=' + 'properties/description' + '&' +
               'events' + '=' + 'change,error' + '&' +
               'topic'  + '=' + 'properties/position' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'properties/state' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'properties/dataelements' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'properties/endpoints' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'properties/handlers' + '&' +
               'events' + '=' + 'change';// }}}
var sub_less = 'topic'  + '=' + 'running' + '&' +// {{{
               'events' + '=' + 'activity_calling,activity_manipulating,activity_failed,activity_done' + '&' +
               'topic'  + '=' + 'properties/position' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'properties/description' + '&' +
               'events' + '=' + 'change,error' + '&' +
               'topic'  + '=' + 'properties/state' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'properties/dataelements' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'properties/endpoints' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'properties/handlers' + '&' +
               'events' + '=' + 'change';// }}}

$(document).ready(function() {// {{{
  $("input[name=base-url]").val(location.protocol + "//" + location.host + ":9298/");
  $("button[name=base]").click(create_instance);
  $("button[name=instance]").click(monitor_instance);
  $("button[name=loadtestset]").click(load_testset);
  $("button[name=loadtestsetfile]").click(load_testsetfile);
  $("button[name=savetestset]").click(function(){ get_testset(); });
  $("button[name=savesvg]").click(function(){ get_svg(); });
  $("input[name=votecontinue]").click(check_subscription);
  $("input[name=votestop]").click(check_subscription);

  $.ajax({ 
    url: "testsets/index.xml", 
    dataType: 'xml',
    success: function(res){
      $('testset',res).each(function(){
        var ts = $(this).text();
        $('select[name=testset-names]').append(
          $("<option></option>").attr("value",ts).text(ts)
        );
      });
    }
  });
  
  var q = $.parseQuery();
  if (q.monitor) {
    $("input[name=instance-url]").val(q.monitor);
    ui_toggle_vis_tab($("#instance td.switch"));
    monitor_instance();
  }
  if (q.load) {
    load = q.load;
    ui_toggle_vis_tab($("#instance td.switch"));
    create_instance();
  }
});// }}}

function check_subscription() { // {{{
  var url = $("input[name=current-instance]").val();
  var num = 0;
  if ($("input[name=votecontinue]").is(':checked')) num += 1;
  if ($("input[name=votestop]").is(':checked')) num += 1;
  if (num > 0 && subscription_state == 'less') {
    $.ajax({
      type: "PUT", 
      url: url + "/notifications/subscriptions/" + subscription,
      data: (
        'message-uid' + '=' + 'xxx' + '&' +
        sub_more + '&' +
        'fingerprint-with-producer-secret' + '=' + 'xxx'
      )
    });
    subscription_state = 'more';
  }  
  if (num == 0 && subscription_state == 'more') {
    $.ajax({
      type: "PUT", 
      url: url + "/notifications/subscriptions/" + subscription,
      data: (
        'message-uid' + '=' + 'xxx' + '&' +
        sub_less + '&' +
        'fingerprint-with-producer-secret' + '=' + 'xxx'
      )
    });  
    subscription_state = 'less';
    format_visual_vote_clear();
  }  
}// }}}

function create_instance() {// {{{
  var name = load ? load : prompt("Instance name?", "Enter name here");
  if (name != null) {
    if (name.match(/\S/)) {
      var base = $("input[name=base-url]").val();
      $.ajax({
        type: "POST", 
        url: base,
        dataType: "text",
        data: "name=" + name, 
        success: function(res){
          $("input[name=instance-url]").val((base + "//" + res + "/").replace(/\/+/g,"/").replace(/:\//,"://"));
          if (load) monitor_instance();
        },  
        error: function(a,b,c) {
          alert("No CPEE running.");
        }
      });
    } else {
      alert("An instance name is necessary!");
    }
  }  
}// }}}
  
function monitor_instance() {// {{{
  var url = $("input[name=instance-url]").val();

  $('#main .tabbehind button').hide();
  $('#dat_details').empty();

  $.ajax({
    type: "GET", 
    url: url + "/properties/schema/",
    success: function(res){
      $(".tabbed.hidden").removeClass("hidden");
      $(".tabbed .tab.hidden").removeClass("hidden");

      // Change url to return to current instance when reloading
      $("input[name=current-instance]").val(url);
      $("#current-instance").html("<a href='" + url + "' target='_blank'>" + url + "</a>");
      history.replaceState({}, '', '?monitor='+url);

      ui_tab_click($("#tabinstance")[0]);

      $.ajax({
        type: "POST", 
        url: url + "/notifications/subscriptions/",
        data: sub_less,
        success: function(res){
          res = res.unserialize();
          $.each(res,function(a,b){
            if (b[0] == 'key') {
              subscription = b[1];
            }  
          });
          append_to_log("monitoring", "id", subscription);
          var Socket = "MozWebSocket" in window ? MozWebSocket : WebSocket;
          ws = new Socket(url.replace(/http/,'ws') + "/notifications/subscriptions/" + subscription + "/ws/");
          ws.onopen = function() {
            append_to_log("monitoring", "opened", "");
          };
          ws.onmessage = function(e) {
            data = e.data.parseXML();
            if ($('event > topic',data).length > 0) {
              switch($('event > topic',data).text()) {
                case 'properties/dataelements':
                  monitor_instance_dataelements();
                  break;
                case 'properties/description':
                  monitor_instance_dsl();
                  break;
                case 'properties/endpoints':
                  monitor_instance_endpoints();
                  break;
                case 'properties/state':
                  monitor_instance_state();
                  break;
                case 'properties/position':
                  monitor_instance_pos_change($('event > notification',data).text());
                  break;
                case 'running':
                  monitor_instance_running($('event > notification',data).text(),$('event > event',data).text());
                  break;
              }
              append_to_log("event", $('event > topic',data).text() + "/" + $('event > event',data).text(), $('event > notification',data).text());
            }
            if ($('vote > topic',data).length > 0) {
              var notification = $('vote > notification',data).text();
              append_to_log("vote", $('vote > topic',data).text() + "/" + $('vote > vote',data).text(), notification);
              monitor_instance_vote_add(notification);
            }  
          };
          ws.onclose = function() {
            append_to_log("monitoring", "closed", "server down i assume.");
          };
          if (load) load_testset();
        }
      });

      monitor_instance_dataelements();
      monitor_instance_endpoints();
      monitor_instance_dsl();
      monitor_instance_state();
    },
    error: function(a,b,c) {
      alert("This ain't no CPEE instance");
    }
  });      
}// }}}

function monitor_instance_dataelements() {// {{{
  var url = $("input[name=current-instance]").val();
  $.ajax({
    type: "GET", 
    url: url + "/properties/values/dataelements/",
    success: function(res){
      var values = $("value > *",res);
      var temp = {};
      values.each(function() {
        temp[this.nodeName] = format_text($(this).text());
      });
      var temp_xml = serialize_hash(temp);

      if (temp_xml != save['dataelements']) {
        save['dataelements'] = temp_xml;
        var ctv = $("#dat_dataelements");
        ctv.empty();
        $.each(temp,function(a,b){
          var node = $("#dat_template_pair tr").clone(true);
          $('.pair_name',node).val(a);
          $('.pair_value',node).val(b);
          ctv.append(node);
        });
      }  
    }
  });      
} // }}}

function monitor_instance_endpoints() {// {{{
  var url = $("input[name=current-instance]").val();
  $.ajax({
    type: "GET", 
    url: url + "/properties/values/endpoints/",
    success: function(res){
      var values = $("value > *",res);
      var temp = {}
      values.each(function(){
        temp[this.nodeName] = $(this).text();
      });
      var temp_xml = serialize_hash(temp);

      if (temp_xml != save['endpoints']) {
        save['endpoints'] = temp_xml;
        var ctv = $("#dat_endpoints");
        ctv.empty();
        $.each(temp,function(a,b){
          var node = $("#dat_template_pair tr").clone(true);
          $('.pair_name',node).val(a);
          $('.pair_value',node).val(b);
          ctv.append(node);
        });
        ctv.append(temp);
      }  
    }
  });
}// }}}

function monitor_instance_dsl() {// {{{
  var url = $("input[name=current-instance]").val();
  $.ajax({
    type: "GET",
    dataType: "text",
    url: url + "/properties/values/dsl/",
    success: function(res){
      if (res != save['dsl']) {
        save['dsl'] = res;
        var ctv = $("#areadsl");
        ctv.empty();

        res = format_code(res,false,true);
        res = res.replace(/activity\s+:([A-Za-z][a-zA-Z0-9_]+)/g,"<span class='activities' id=\"activity-$1\">activity :$1</span>");
        res = res.replace(/activity\s+\[:([A-Za-z][a-zA-Z0-9_]+)([^\]]*\])/g,"<span class='activities' id=\"activity-$1\">activity [:$1$2</span>");

        ctv.append(res);
        $.ajax({
          type: "GET",
          url: url + "/properties/values/description/",
          success: function(res){
            graphrealization = new WfAdaptor(CPEE);
            graphrealization.set_svg_container($('#graphcanvas'));
            graphrealization.set_description($(res), true);
            graphrealization.notify = function(svgid) {
              console.info(svgid);
              save_description();
              manifestation.events.click(svgid,undefined);
            };

            monitor_instance_pos();
          }
        });
      }
    }
  });
}// }}}

function monitor_instance_state() {// {{{
  var url = $("input[name=current-instance]").val();
  $.ajax({
    type: "GET", 
    url: url + "/properties/values/state/",
    dataType: "text",
    success: function(res){
      if (res == "ready" || res == "stopped" || res == "running") {
        $("#state button").removeAttr('disabled');
      }  
      if (res != save['state']) {
        save['state'] = res;

        var ctv = $("#state");
        ctv.empty();

        var but = "";
        if (res == "stopped") {
          format_visual_clear();
          monitor_instance_pos();
        }  
        if (res == "ready" || res == "stopped") {
          but = "<td>⇒</td><td><button onclick='$(this).attr(\"disabled\",\"disabled\");start_instance();'>start</button></td>";
        }
        if (res == "running") {
          but = "<td>⇒</td><td><button onclick='$(this).attr(\"disabled\",\"disabled\");stop_instance();'>stop</button></td>";
        }

        ctv.append("<tr><td>State:</td><td>" + res + "</td>" + but + "</tr>");
      }  
    }
  });
}// }}}

function monitor_instance_pos() {// {{{
  var url = $("input[name=current-instance]").val();
  $.ajax({
    type: "GET", 
    url: url + "/properties/values/positions/",
    success: function(res){
      var values = $("value > *",res);
      format_visual_clear();
      values.each(function(){
        var what = this.nodeName;
        format_visual_add(what,"active");
        format_visual_set(what);
      });
    }
  });
}// }}}

function monitor_instance_running(notification,event) {// {{{
  if (save['state'] == "stopping") return;
  var parts = JSON.parse(notification);
  if (event == "activity_calling")
    format_visual_add(parts.activity,"active")
  if (event == "activity_done")
    format_visual_remove(parts.activity,"active")
} // }}}

function monitor_instance_pos_change(notification) {// {{{
  var parts = JSON.parse(notification);
  if (parts['unmark']) {
    $.each(parts['unmark'],function(a,b){
      format_visual_remove(b,"passive") 
    });
  }
  if (parts['at']) {
    $.each(parts['at'],function(a,b){
      format_visual_add(b,"passive") 
    });
  }
} // }}}

function monitor_instance_vote_add(notification) {// {{{
  var parts = JSON.parse(notification);
  var ctv = $("#votes");

  var astr = "<tr id='vote_to_continue-" + parts.activity + "-" + parts.callback + "'><td>Activity:</td><td>" + parts.activity + "</td><td>⇒</td>";
  if ($("input[name=votecontinue]").is(':checked'))
    astr += "<td><button onclick='$(this).attr(\"disabled\",\"disabled\");monitor_instance_vote_remove(\"" + parts.activity + "\",\"" + parts.callback + "\",\"true\");'>vote to continue</button></td>";
  if ($("input[name=votestop]").is(':checked'))
    astr += "<td><button onclick='$(this).attr(\"disabled\",\"disabled\");monitor_instance_vote_remove(\"" + parts.activity + "\",\"" + parts.callback + "\",\"false\");'>vote to stop</button></td>";
  astr += "</tr>";
  ctv.append(astr);
  format_visual_add(parts.activity,"vote")
}// }}}
function monitor_instance_vote_remove(activity,callback,value) {//{{{
  var url = $("input[name=current-instance]").val();
  $.ajax({
    type: "PUT", 
    url: url + "/callbacks/" + callback,
    data: ({'continue': value}),
    error: report_failure
  });
  format_visual_remove(activity,"vote");
  $('#vote_to_continue-' + activity + '-' + callback).remove();
}//}}}

function start_instance() {// {{{
  var url = $("input[name=current-instance]").val();
  format_visual_clear();
  $.ajax({
    type: "PUT", 
    url: url + "/properties/values/state",
    data: ({value: "running"}),
    error: report_failure
  });
}// }}}
function stop_instance() {// {{{
  var url = $("input[name=current-instance]").val();
  format_visual_clear();
  $.ajax({
    type: "PUT", 
    url: url + "/properties/values/state",
    data: ({value: "stopping"}),
    error: report_failure
  });
}// }}}

function get_testset() {// {{{
  var url = $("input[name=current-instance]").val();

  var testset = $X('<testset/>');

  $.ajax({
    type: "GET", 
    url: url + "/properties/values/dataelements/",
    success: function(res){
      var pars = $X('<dataelements/>');
      pars.append($(res.documentElement).children());
      testset.append(pars);
      $.ajax({
        type: "GET", 
        url: url + "/properties/values/handlerwrapper/",
        success: function(res){
          var pars = $X('<handlerwrapper>' + res + '</handlerwrapper>');
          testset.append(pars);
          $.ajax({
            type: "GET", 
            url: url + "/properties/values/endpoints/",
            success: function(res){
              var pars = $X('<endpoints/>');
              pars.append($(res.documentElement).children());
              testset.append(pars);
              $.ajax({
                type: "GET", 
                url: url + "/properties/values/positions/",
                success: function(res){
                  var pars = $X('<positions/>');
                  pars.append($(res.documentElement).children());
                  testset.append(pars);
                  $.ajax({
                    type: "GET", 
                    url: url + "/properties/values/description/",
                    success: function(res){
                      testset.append($(res.documentElement));
                      $.ajax({
                        type: "GET", 
                        url: url + "/properties/values/transformation/",
                        success: function(res){
                          var pars = $X('<transformation/>');
                          pars.append($(res.documentElement));
                          testset.append(pars);

                          var base = $("input[name=current-instance]").val().replace(/[^\/]+\/?$/,'');
                          var params = { mimetype: 'text/xml' };

                          $('#saveform').attr('action',base + 'downloadify/testset.xml?' + $.param(params));
                          $('#saveform input').val(testset.serializeXML());
                          $('#saveform').submit();
                        },  
                        error: report_failure
                      });
                    },  
                    error: report_failure
                  });
                },
                error: report_failure
              });
            },
            error: report_failure
          });
        },
        error: report_failure
      });
    },
    error: report_failure
  });  
}// }}}
function get_svg() {// {{{
  var base = $("input[name=current-instance]").val().replace(/[^\/]+\/?$/,'');
  var params = { mimetype: 'image/svg+xml' };

  $('#saveform').attr('action',base + 'downloadify/graph.svg?' + $.param(params));
  var gc = $('#graphcanvas').clone();
  $.ajax({
    type: "GET", 
    url: "lib/wfadaptor.css",
    success: function(res){
      gc.prepend($X('<style xmlns="http://www.w3.org/2000/svg" type="text/css"><![CDATA[' + res + ']]></style>'));
      $('#saveform input').val(gc.serializeXML());
      $('#saveform').submit();
    }  
  });
}// }}}
function set_testset (testset) {// {{{
  var url = $("input[name=current-instance]").val();

  $.ajax({
    type: "GET", 
    url: url + "/notifications/subscriptions/",
    success: function(res){
      var rcount = 0;
      var values = $("subscriptions > subscription[url]",res);
      var vals = [];
      values.each(function(){
        vals.push($(this).attr('url'));
      });
      load_testset_handlers(url,testset,vals);
    },
    error: report_failure
  });  

  $.ajax({
    type: "GET", 
    url: url + "/properties/values/dataelements/",
    success: function(res){
      var rcount = 0;
      var values = $("value > *",res);
      var length = values.length;
      values.each(function(){
        var name = this.nodeName;
        $.ajax({
          type: "DELETE", 
          url: url + "/properties/values/dataelements/" + name,
          success: function(){
            rcount += 1;
            if (rcount == length)
              load_testset_dataelements(url,testset);
          },
          error: report_failure
        });  
      });
      if (length == 0)
        load_testset_dataelements(url,testset);
    },
    error: report_failure
  });  
  
  $.ajax({
    type: "GET", 
    url: url + "/properties/values/endpoints/",
    success: function(res){
      var rcount = 0;
      var values = $("value > *",res);
      var length = values.length;
      values.each(function(){
        var name = this.nodeName;
        $.ajax({
          type: "DELETE", 
          url: url + "/properties/values/endpoints/" + name,
          success: function(){
            rcount += 1;
            if (rcount == length)
              load_testset_endpoints(url,testset);
          },
          error: report_failure
        });  
      });
      if (length == 0)
        load_testset_endpoints(url,testset);
    },
    error: report_failure
  });
  
  $.ajax({
    type: "GET", 
    url: url + "/properties/values/positions/",
    success: function(res){
      var rcount = 0;
      var values = $("value > *",res);
      var length = values.length;
      values.each(function(){
        var name = this.nodeName;
        $.ajax({
          type: "DELETE", 
          url: url + "/properties/values/positions/" + name,
          success: function(){
            rcount += 1;
            if (rcount == length)
              load_testset_pos(url,testset);
          },
          error: report_failure
        });  
      });
      if (length == 0)
        load_testset_pos(url,testset);
    },
    error: report_failure
  });

  $.ajax({
    type: "GET", 
    url: url + "/properties/values/transformation/",
    success: function(res){
      var values = $("not-existing",res);
      $("testset > transformation > *",testset).each(function(){
        var val = "<content>" + $(this).serializeXML() + "</content>";
        if (values.length > 0) {
          $.ajax({
            type: "POST", 
            url: url + "/properties/values/",
            data: ({property: "transformation"}),
            success: function() { 
              $.ajax({ 
                type: "PUT", 
                data: ({content: val}),
                url: url + "/properties/values/transformation",
                success: function() {
                  load_testset_des(url,testset); 
                },  
              });
            },
            error: report_failure
          });
        } else {
          $.ajax({
            type: "PUT", 
            url: url + "/properties/values/transformation",
            data: ({content: val}),
            success: function() { load_testset_des(url,testset); },
            error: report_failure
          });
        }
      });
    },  
    error: report_failure
  });
  
  $.ajax({
    type: "PUT", 
    url: url + "/properties/values/handlerwrapper",
    success: function() { load_testset_hw(url,testset); },
    error: report_failure
  });
}// }}}
function load_testsetfile() { //{{{
  if (running) return;
  if (typeof window.FileReader !== 'function') {
    alert('FileReader not yet supportet');
    return;
  }  
  var files = $('#testsetfile').get(0).files;
  var reader = new FileReader();
  reader.onload = function(){
    set_testset(reader.result.parseXML());
    running  = false;
  }  
  reader.onerror = function(){ running  = false; }  
  reader.onabort = function(){ running  = false; }  
  reader.readAsText(files[0]);
} //}}}
function load_testset() {// {{{
  if (running) return;
  running  = true;
  save['dsl'] = null; // reload dsl and position under all circumstances
  
  $('#main .tabbehind button').hide();
  $('#dat_details').empty();

  var name = load ? load : $("select[name=testset-names]").val();

  $.ajax({ 
    cache: false,
    dataType: 'xml',
    url: "testsets/" + name + ".xml",
    success: function(res){ 
      document.title = name;
      set_testset(res);
    }
  });
  running  = false;
}// }}}

function load_testset_des(url,testset) {// {{{
  $("testset > description",testset).each(function(){
    var val = "<content>" + $(this).serializeXML() + "</content>";
    $.ajax({
      type: "PUT", 
      url: url + "/properties/values/description",
      data: ({content: val}),
      error: report_failure
    });
  });
} // }}}
function load_testset_hw(url,testset) {// {{{
  $("testset > handlerwrapper",testset).each(function(){
    var val = $(this).text();
    $.ajax({
      type: "PUT", 
      url: url + "/properties/values/handlerwrapper",
      data: ({value: val}),
      error: report_failure
    });
  });
} // }}}
function load_testset_dataelements(url,testset) {// {{{
  $("testset > dataelements > *",testset).each(function(){
    var val = $(this).serializeXML();
    $.ajax({
      type: "POST", 
      url: url + "/properties/values/dataelements/",
      data: ({value: val}),
      error: report_failure
    });  
  });
}// }}}
function load_testset_endpoints(url,testset) {// {{{
  $("testset > endpoints > *",testset).each(function(){
    var val = $(this).serializeXML();
    $.ajax({
      type: "POST", 
      url: url + "/properties/values/endpoints/",
      data: ({value: val}),
      error: report_failure
    });  
  });
}// }}}
function load_testset_pos(url,testset) {// {{{
  $("testset > positions > *",testset).each(function(){
    var val = $(this).serializeXML();
    $.ajax({
      type: "POST", 
      url: url + "/properties/values/positions/",
      data: ({value: val}),
      error: report_failure
    });  
  });
}// }}}
function load_testset_handlers(url,testset,vals) {// {{{
  $("testset > handlers > *",testset).each(function(){
    var han = this;
    var suburl = $(han).attr('url');
    if ($.inArray(suburl,vals) == -1) {
      var inp = "url="+encodeURIComponent(suburl);
      $("*",han).each(function(){
        inp += "&topic=" + $(this).attr('topic');
        inp += "&" + this.nodeName + "=" + $(this).text();
      });
      $.ajax({
        type: "POST", 
        url: url + "/notifications/subscriptions/",
        data: inp
      });
    }
  });
}// }}}

function format_visual_add(what,cls) {//{{{
  if (node_state[what] == undefined)
    node_state[what] = [];
  node_state[what].push(cls);
  format_visual_set(what);
}//}}}
function format_visual_remove(what,cls) {//{{{
  c = node_state[what];
  if ($.inArray(cls,c) != -1)
    c.splice($.inArray(cls,c),1);
  format_visual_set(what);
}//}}}
function format_visual_set(what) {//{{{
  if (node_state[what] != undefined) {
    var votes = jQuery.grep(node_state[what], function(n, i){ return (n == 'vote'); });
        votes = votes.length;
    var actives = jQuery.grep(node_state[what], function(n, i){ return (n == 'active'); });
        actives = actives.length;
    if (actives > 0 && votes > 0)
      $('g[element-id="' + what + '"] .super .colon').each(function(a,b){
        b.setAttribute('class','colon necessary');
      });
    else  
      $('g[element-id="' + what + '"] .super .colon').each(function(a,b){
        b.setAttribute('class','colon');
      });
    if (actives > 0)
      $('g[element-id="' + what + '"] .super .active').each(function(a,b){
        b.setAttribute('class','active necessary');
        var txt = b.childNodes[0];
        txt.nodeValue = actives;
      });
    else  
      $('g[element-id="' + what + '"] .super .active').each(function(a,b){
        b.setAttribute('class','active');
      });
    if (votes > 0)
      $('g[element-id="' + what + '"] .super .vote').each(function(a,b){
        b.setAttribute('class','vote necessary');
        var txt = b.childNodes[0];
        txt.nodeValue = votes;
      });
    else  
      $('g[element-id="' + what + '"] .super .vote').each(function(a,b){
        b.setAttribute('class','vote');
      });

    $.each(['#activity-' + what, 'g[element-id="' + what + '"] use'],function(i,t){
      $(t).each(function(a,b){ 
        var vs = node_state[what].join(" ");
        if (vs.match(/active/) && vs.match(/passive/)) vs = vs.replace(/passive/,'');
        if (vs.match(/vote/) && vs.match(/passive/)) vs = vs.replace(/passive/,'');
        if (vs.match(/active/) && vs.match(/vote/)) vs = vs.replace(/active/,'');
        b.setAttribute("class",'activities ' + vs);
      });
    });
  }  

}//}}}
function format_visual_clear() {//{{{
  node_state = {};
  $('.super .active').each(function(a,b){b.setAttribute("class","active");});
  $('.super .passive').each(function(a,b){b.setAttribute("class","passive");});
  $('.super .vote').each(function(a,b){b.setAttribute("class","vote");});
  $('.super .colon').each(function(a,b){b.setAttribute("class","colon");});
  $('.activities').each(function(a,b){b.setAttribute("class","activities");});
  $("#votes").empty();
}//}}}
function format_visual_vote_clear() {//{{{
  node_state = {};
  $('.super .vote').each(function(a,b){b.setAttribute("class","vote");});
  $("#votes").empty();
}//}}}

function format_code(res,skim,lnums) {// {{{
 try {
  res = res.replace(/&/g,'&amp;');
  res = res.replace(/</g,'&lt;');
  res = res.replace(/>/g,'&gt;');
  res = res.replace(/\t/g,'  ');
  res = res.replace(/\t/g,'  ');
  res = res.replace(/\r/g,'');
  res = res.replace(/\s*$/gm,'');
  res = res.replace(/^(\s*\n)*/m,'');

  if (res.match(/\S/)) {
    if (skim) format_text_skim(res);

    var m;
    var l = 1;
    while (m = res.match(/^ +|^(?!<div style=)|^$/m)) {
      m = m[0];
      var tm = (m.length + 2) * 0.6 + 2 * 0.6 + 4 * 0.6;
      var ln = (lnums ? $.sprintf("%03d",l) + ':&#160;' : '');
      res = res.replace(/^ +|^(?!<div style=)|^$/m,"<div style='text-indent:-" + tm + "em;margin-left:" + tm + "em'>" + ln + "&#160;".repeat(m.length));
      l++;
    }
    res = res.replace(/  /g," &#160;");
    res = res.replace(/\n$/g,"\n<div>&#160;");
    res = res.replace(/\n|$/g,"</div>\n");
  }  
  } catch(e) {
    alert(e.toString());
  }  
  return res;
}// }}}
function format_text(res) {// {{{
  res = res.replace(/&/g,'&amp;');
  res = res.replace(/</g,'&lt;');
  res = res.replace(/>/g,'&gt;');
  return res;
}// }}}
function format_text_skim(res) {// {{{
  var l = res.match(/^ */);
  l = l[0].length;
  res = res.replace(new RegExp("^ {" + l + "}",'mg'),'');
  return res;
}// }}}

function serialize_hash(ary) { //{{{
  var xml = $X('<content/>');
  $.each(ary,function(k,v) {
    if (k.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
      xml.append($X('<' + k + '>' + v + '</' + k + '>'));
    }
  });
  return xml.serializeXML();
} //}}}

function append_to_log(what,type,message) {//{{{
  var d = new Date();
  message = message.replace(/,\"/g,', "');
  message = message.replace(/,\{/g,', {');
  message = message.replace(/,\[/g,', [');
  message = message.replace(/:\"/g,': "');
  message = message.replace(/:\{/g,': {');
  message = message.replace(/:\[/g,': [');
  $("#dat_log").append("<tr><td class='fixed'><a title=\"" + d.strftime("[%d/%b/%Y %H:%M:%S]") + "\">D</a></td><td class='fixed'>&#160;-&#160;</td><td class='fixed'><a title=\"" + what + "\">T</a></td><td class='fixed'>&#160;-&#160;</td><td class='fixed'>" +  type + "</td><td class='fixed'>&#160;-&#160;</td><td class='long'>" +  message + "</td></tr>");
}//}}}

function report_failure(){}