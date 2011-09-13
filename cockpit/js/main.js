var running = false;
var load;
var subscription;
var subscription_state = 'less';
var save_state;
var save_dsl;
var save_endpoints;
var save_dataelements;
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
               'topic'  + '=' + 'properties/data-elements' + '&' +
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
               'topic'  + '=' + 'properties/data-elements' + '&' +
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

  $.ajax({
    type: "GET", 
    url: url + "/properties/schema/",
    success: function(res){
      $(".tabbed.hidden").removeClass("hidden");
      $(".tabbed .tab.hidden").removeClass("hidden");

      // Change url to return to current instance when reloading
      $("input[name=current-instance]").val(url);
      $("#current-instance").html("<a href='" + url + "'>" + url + "</a>");
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
          ws = new MozWebSocket(url.replace(/http/,'ws') + "/notifications/subscriptions/" + subscription + "/ws/");
          ws.onopen = function() {
            append_to_log("monitoring", "opened", "");
          };
          ws.onmessage = function(e) {
            data = e.data.parseXML();
            if ($('event > topic',data).length > 0) {
              switch($('event > topic',data).text()) {
                case 'properties/data-elements':
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
    url: url + "/properties/values/data-elements/",
    success: function(res){
      var values = $("value > *",res);
      var temp = {};
      values.each(function() {
        temp[this.nodeName] = format_text($(this).text());
      });

      if (temp != save_dataelements) {
        save_dataelements = temp;
        var ctv = $("#dat_dataelements");
        ctv.empty();
        $.each(save_dataelements,function(a,b){
          var node = $("#dat_dataelements_template tr").clone(true);
          $('.pair_name',node).val(a);
          $('.pair_value',node).val(b);
          ctv.append(node);
        });
        ui_rest_resize();
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

      if (temp != save_endpoints) {
        save_endpoints = temp;
        var ctv = $("#dat_endpoints");
        ctv.empty();
        $.each(save_endpoints,function(a,b){
          var node = $("#dat_endpoints_template tr").clone(true);
          $('.pair_name',node).val(a);
          $('.pair_value',node).val(b);
          ctv.append(node);
        });
        ctv.append(temp);
        ui_rest_resize();
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
      if (res != save_dsl) {
        save_dsl = res;
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
            if (res == '') res = '<description xmlns="http://cpee.org/ns/description/1.0"/>'.parseXML();

            var adaptor = new WfAdaptor();

            create_cpee_elements(adaptor);

            adaptor.set_svg_container($('#graphcanvas'));
            adaptor.set_description($(res), true);
            adaptor.notify = function() {
              console.log('update');
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
      if (res != save_state) {
        save_state = res;

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
  if (save_state == "stopping") return;
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

  var astr = "<tr id='vote_to_continue-" + parts.activity + "-" + parts.callback + "'><td>Activity:</td><td>" + parts.activity + (parts.lay ? ", " + parts.lay : '') + "</td><td>⇒</td>";
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

function load_testset() {// {{{
  if (running) return;
  running  = true;
  save_dsl = null; // reload dsl and position under all circumstances
  var table = $('#dat_details');
  table.empty();

  var url = $("input[name=current-instance]").val();
  var name = load ? load : $("select[name=testset-names]").val();

  $.ajax({ 
    cache: false,
    dataType: 'xml',
    url: "testsets/" + name + ".xml",
    success: function(res){ 
      var testset = res; 
      document.title = name;

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
        url: url + "/properties/values/data-elements/",
        success: function(res){
          var rcount = 0;
          var values = $("value > *",res);
          var length = values.length;
          values.each(function(){
            var name = this.nodeName;
            $.ajax({
              type: "DELETE", 
              url: url + "/properties/values/data-elements/" + name,
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
  $("testset > data-elements > *",testset).each(function(){
    var val = $(this).serializeXML();
    $.ajax({
      type: "POST", 
      url: url + "/properties/values/data-elements/",
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
    if (skim) {
      var l = res.match(/^ */);
      l = l[0].length;
      res = res.replace(new RegExp("^ {" + l + "}",'mg'),'');
    }

    var m;
    var l = 1;
    while (m = res.match(/^ +|^(?!<div style=)|^\z/m)) {
      m = m[0];
      var tm = (m.length + 2) * 0.6 + 2 * 0.6 + 4 * 0.6;
      var ln = (lnums ? $.sprintf("%03d",l) + ':&#160;' : '');
      res = res.replace(/^ +|^(?!<div style=)|^\z/m,"<div style='text-indent:-" + tm + "em;margin-left:" + tm + "em'>" + ln + "&#160;".repeat(m.length));
      l++;
    }
    res = res.replace(/  /g," &#160;");
    res = res.replace(/\n\z/g,"\n<div>&#160;");
    res = res.replace(/\n|\z/g,"</div>\n");
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
