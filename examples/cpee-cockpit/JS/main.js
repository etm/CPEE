var running = false;
var subscription;
var voting;
var save_state;
var save_dsl;
var save_desc;
var save_eps;
var save_pos;
var save_cvs;

$(document).ready(function() {// {{{
  $("button[name=base]").click(create_instance);
  $("button[name=instance]").click(monitor_instance);
  $("button[name=testset]").click(load_testset);
  $.ajax({ 
    url: "Testsets.xml", 
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
});// }}}

function create_instance() {// {{{
  var name = prompt("Instance name?");
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
        },  
        failure: report_failure
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
      $(".hidden").removeClass("hidden");
      $("input[name=instance-url]").attr("readonly","readonly");
      $("button[name=instance]").attr("disabled","disabled");
      $("input[name=base-url]").attr("readonly","readonly");
      $("button[name=base]").attr("disabled","disabled");

      $.ajax({
        type: "POST", 
        url: url + "/notifications/subscriptions/",
        data: (
          'topic'  + '=' + 'running' + '&' +
          'events' + '=' + 'activity_calling,activity_manipulating,activity_failed,activity_done' + '&' +
          'topic'  + '=' + 'running' + '&' +
          'votes'  + '=' + 'syncing_after' + '&' +
          'topic'  + '=' + 'properties/description' + '&' +
          'events' + '=' + 'change,error' + '&' +
          'topic'  + '=' + 'properties/state' + '&' +
          'events' + '=' + 'change' + '&' +
          'topic'  + '=' + 'properties/context-variables' + '&' +
          'events' + '=' + 'change' + '&' +
          'topic'  + '=' + 'properties/endpoints' + '&' +
          'events' + '=' + 'change' + '&' +
          'topic'  + '=' + 'properties/handlers' + '&' +
          'events' + '=' + 'change'),
        success: function(res){
          res = res.unserialize();
          $.each(res,function(a,b){
            if (b[0] == 'key')
              subscription = b[1];
          });
          append_to_log("monitoring", "id", subscription);

          ws = new WebSocket(url.replace(/http/,'ws') + "/notifications/subscriptions/" + subscription + "/ws/");
          ws.onopen = function() {
            append_to_log("monitoring", "opened", "");
          };
          ws.onmessage = function(e) {
            data = e.data.parseXML();
            if ($('event > topic',data).length > 0) {
              switch($('event > topic',data).text()) {
                case 'properties/context-variables':
                  monitor_instance_cvs();
                  break;
                case 'properties/description':
                  monitor_instance_dsl();
                  break;
                case 'properties/endpoints':
                  monitor_instance_eps();
                  break;
                case 'properties/state':
                  monitor_instance_state();
                  break;
                case 'running':
                  monitor_instance_pos_change($('event > notification',data).text(),$('event > event',data).text());
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
        }
      });

      monitor_instance_cvs();
      monitor_instance_eps();
      monitor_instance_dsl();
      monitor_instance_pos();
      monitor_instance_state();
    },
    failure: function() {
      alert("This ain't no CPEE instance");
    }  
  });      
}// }}}

function monitor_instance_cvs() {// {{{
  var url = $("input[name=instance-url]").val();
  $.ajax({
    type: "GET", 
    url: url + "/properties/values/context-variables/",
    success: function(res){
      var values = $("values > *",res);
      var temp = "";
      values.each(function(){
        temp += "<tr><td>" + this.nodeName  + "</td><td>⇒</td><td>" + $(this).text() + "</td></tr>";
      });

      if (temp != save_cvs) {
        save_cvs = temp;
        var ctv = $("#context-variables");
        ctv.empty();
        ctv.append(temp);
      }  
    }
  });      
}// }}}

function monitor_instance_eps() {// {{{
  var url = $("input[name=instance-url]").val();
  $.ajax({
    type: "GET", 
    url: url + "/properties/values/endpoints/",
    success: function(res){
      var values = $("values > *",res);
      var temp = "";
      values.each(function(){
        temp += "<tr><td>" + this.nodeName  + "</td><td>⇒</td><td>" + $(this).text() + "</td></tr>";
      });

      if (temp != save_eps) {
        save_eps = temp;
        var ctv = $("#endpoints");
        ctv.empty();
        ctv.append(temp);
      }  
    }
  });
}// }}}

function monitor_instance_dsl() {// {{{
  var url = $("input[name=instance-url]").val();
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

        ctv.append(res);
        $.ajax({
          type: "GET",
          url: url + "/properties/values/description/",
          success: function(res){
            g = new WFGraph(res, $("#canvas").get(0));
            g.generateGraph({
             symclick: sym_click
            });
          }
        });
      }
    }
  });
}// }}}

function monitor_instance_state() {// {{{
  var url = $("input[name=instance-url]").val();
  $.ajax({
    type: "GET", 
    url: url + "/properties/values/state/",
    dataType: "text",
    success: function(res){
      if (res != save_state) {
        save_state = res;

        if (res == 'finished')
          monitor_instance_pos();

        var ctv = $("#state");
        ctv.empty();

        var but = "";
        if (res == "ready" || res == "stopped") {
          but = "<td>⇒</td><td><button onclick='$(this).attr(\"disabled\",\"disabled\");start_instance();'>start</button></td>";
          vote_clean();
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
  var url = $("input[name=instance-url]").val();
  $.ajax({
    type: "GET", 
    url: url + "/properties/values/positions/",
    success: function(res){
      var values = $("values > *",res);
      var temp = "";
      $('span.active').removeClass("active");
      $("svg use.active").each(function(a,b){b.setAttribute("class","activities");});
      values.each(function(){
        var pos = this.nodeName;
        temp += "<tr><td>Position:</td><td>" + pos  + "</td><td>⇒</td><td>(\"" + $(this).text() + "\")</td></tr>";
        $('#activity-' + pos).addClass("active");
        $('#graph-' + pos).each(function(a,b){b.setAttribute("class","active activities");});
      });

      if (temp != save_pos) {
        save_pos = temp;
        var ctv = $("#position");
        ctv.empty();
        ctv.append(temp);
       }  
    }
  });
}// }}}

function monitor_instance_pos_change(notification,event) {// {{{
  var parts = notification.split(';');
  var activity;
  var callback;
  $.each(parts,function(i,p){
    var ma;
    if (ma = p.match(/activity: "([^,]+)"/))
      activity = ma[1];
    if (ma = p.match(/lay: "([^,]+)"/))
      lay = ma[1];
  });
  if (event == "activity_calling")
    format_visual_add(activity,"active")
  if (event == "activity_done")
    format_visual_remove(activity,"active")
}// }}}

function monitor_instance_vote_add(notification) {// {{{
  var parts = notification.split(';');
  var activity;
  var lay = null;
  var callback;
  $.each(parts,function(i,p){
    var ma;
    if (ma = p.match(/activity: "([^,]+)"/))
      activity = ma[1];
    if (ma = p.match(/lay: "([^,]+)"/))
      lay = ma[1];
    if (ma = p.match(/callback: "([^,]+)"/))
      callback = ma[1];
  });
  var ctv = $("#votes");
  ctv.append("<tr id='vote_to_continue_" + activity + "'><td>Activity:</td><td>" + activity + (lay ? ", " + lay : '') + "</td><td>⇒</td><td><button onclick='$(this).attr(\"disabled\",\"disabled\");monitor_instance_vote_remove(\"" + activity + "\",\"" + callback + "\");'>vote to continue</button></td></tr>");
  format_visual_add(activity,"vote")
}// }}}

function monitor_instance_vote_remove(activity,callback) {//{{{
  var url = $("input[name=instance-url]").val();
  $.ajax({
    type: "PUT", 
    url: url + "/callbacks/" + callback,
    data: ({'continue': 'true'}),
    failure: report_failure
  });
  format_visual_remove(activity,"vote");
  $('#vote_to_continue_' + activity).remove();
}//}}}

function vote_clean() {//{{{
  try {
  $('span.vote').removeClass("vote");
  $('svg use.vote').each(function(a,b){b.setAttribute("class","activities");});
  $('#votes').empty();
  } catch(e) {
    alert(e.toString());
  }
}//}}}

function start_instance() {// {{{
  var url = $("input[name=instance-url]").val();
  $.ajax({
    type: "PUT", 
    url: url + "/properties/values/state",
    data: ({value: "running"}),
    failure: report_failure
  });
}// }}}

function stop_instance() {// {{{
  var url = $("input[name=instance-url]").val();
  $.ajax({
    type: "PUT", 
    url: url + "/properties/values/state",
    data: ({value: "stopping"}),
    failure: report_failure
  });
}// }}}

function load_testset() {// {{{
  if (running) return;
  running  = true;
  var url = $("input[name=instance-url]").val();
  $.ajax({ 
    cache: false,
    dataType: 'xml',
    url: "Testsets/" + $('select[name=testset-names]').val() + ".xml",
    success: function(res){ 
      var testset = res; 

      $.ajax({
        type: "GET", 
        url: url + "/properties/values/context-variables/",
        success: function(res){
          var rcount = 0;
          var values = $("values > *",res);
          var length = values.length;
          values.each(function(){
            var name = this.nodeName;
            $.ajax({
              type: "DELETE", 
              url: url + "/properties/values/context-variables/" + name,
              success: function(){
                rcount += 1;
                if (rcount == length)
                  load_testset_cvs(url,testset);
              },
              failure: report_failure
            });  
          });
          if (length == 0)
            load_testset_cvs(url,testset);
        },
        failure: report_failure
      });  
      
      $.ajax({
        type: "GET", 
        url: url + "/properties/values/endpoints/",
        success: function(res){
          var rcount = 0;
          var values = $("values > *",res);
          var length = values.length;
          values.each(function(){
            var name = this.nodeName;
            $.ajax({
              type: "DELETE", 
              url: url + "/properties/values/endpoints/" + name,
              success: function(){
                rcount += 1;
                if (rcount == length)
                  load_testset_eps(url,testset);
              },
              failure: report_failure
            });  
          });
          if (length == 0)
            load_testset_eps(url,testset);
        },
        failure: report_failure
      });

      $.ajax({
        type: "GET", 
        url: url + "/properties/values/transformation/",
        success: function(res){
          var values = $("not-existing",res);
          $("testset > transformation > *",testset).each(function(){
            var val = $(this).serializeXML();
            if (values.length > 0) {
              $.ajax({
                type: "POST", 
                url: url + "/properties/values/",
                data: ({key: "transformation", value: val}),
                success: function() { load_testset_des(url,testset); },
                failure: report_failure
              });
            } else {
              $.ajax({
                type: "PUT", 
                url: url + "/properties/values/transformation",
                data: ({value: val}),
                success: function() { load_testset_des(url,testset); },
                failure: report_failure
              });
            }
          });
        },  
        failure: report_failure
      });
      
      $.ajax({
        type: "PUT", 
        url: url + "/properties/values/handlerwrapper",
        success: function() { load_testset_hw(url,testset); },
        failure: report_failure
      });
    }
  });
  running  = false;
}// }}}
          
function load_testset_des(url,testset) {// {{{
  $("testset > description",testset).each(function(){
    var name = this.nodeName;
    var val = $(this).serializeXML();
    $.ajax({
      type: "PUT", 
      url: url + "/properties/values/description",
      data: ({value: val}),
      failure: report_failure
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
      failure: report_failure
    });
  });
} // }}}

function load_testset_cvs(url,testset) {// {{{
  $("testset > context-variables > *",testset).each(function(){
    var name = this.nodeName;
    var val = $(this).text();
    $.ajax({
      type: "POST", 
      url: url + "/properties/values/context-variables/",
      data: ({key:  name, value: val}),
      failure: report_failure
    });  
  });
}// }}}

function load_testset_eps(url,testset) {// {{{
  $("testset > endpoints > *",testset).each(function(){
    var name = this.nodeName;
    var val = $(this).text();
    $.ajax({
      type: "POST", 
      url: url + "/properties/values/endpoints/",
      data: ({key:  name, value: val}),
      failure: report_failure
    });  
  });
}// }}}

function tab_click(active) { // {{{
  var tabs = [];
  $("td.tab").each(function(){
    tabs.push($(this).attr('id').replace(/tab/,''));
  });  
  $(".inactivearea").removeClass("inactivearea");
  $(".inactivetab").removeClass("inactivetab");
  $.each(tabs,function(a,b){
    if (b != active) {
      $("#tab" + b).addClass("inactivetab");
      $("#area" + b).addClass("inactivearea");
    }  
  });
} // }}}

function sym_click(node) { // {{{
  var table = $('#tabledetails');
  table.empty();
  table.append('<tr><td class="top">Element:<td><td class="long">' + node.nodeName + '</td></tr>');
  switch(node.nodeName) {
    case 'call':
      table.append('<tr><td>ID:<td><td class="long">' + $(node).attr('id') + '</td></tr>');
      table.append('<tr><td>Endpoint:<td><td class="long">' + $(node).attr('endpoint') + '</td></tr>');
      if ($('manipulate',node).text())
        table.append('<tr><td>Manipulate:<td><td class="long">' + format_code($('manipulate',node).text(),true,false) + '</td></tr>');
      break;
    case 'manipulate':
      table.append('<tr><td>ID:<td><td class="long">' + $(node).attr('id') + '</td></tr>');
      table.append('<tr><td>Manipulate:<td><td class="long">' + format_code($(node).text(),true,false) + '</td></tr>');
      break;
    case 'loop':
    case 'alternative':
      table.append('<tr><td>Condition:<td><td class="long">' + $(node).attr('condition') + '</td></tr>');
      break;
    case 'parallel':
      var wait = $(node).attr('condition') || 'Wait for all branches';
      table.append('<tr><td>Wait:<td><td class="long">' + wait + '</td></tr>');
      break;
  }
} // }}}

function format_visual_add(what,class) {
  $.each(["graph","activity"],function(i,t){
    $('#' + t + '-' + what).each(function(a,b){ 
      var c = b.getAttribute("class").split(" ");
      c.push(class);
      b.setAttribute("class",c.join(" "));
    });
  });
}

function format_visual_remove(what,class) {
  $.each(["graph","activity"],function(i,t){
    $('#' + t + '-' + what).each(function(a,b){ 
      var c = b.getAttribute("class").split(" ");
      if ($.inArray(class,c) != -1)
        c.splice($.inArray(class,c),1);
      b.setAttribute("class",c.join(" "));
    });
  });
}

function format_code(res,skim,lnums) {// {{{
 try {
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

function append_to_log(what,type,message) {//{{{
  var d = new Date();
  $("#tablelog").append("<tr><td class='fixed'>" + d.strftime("[%d/%b/%Y %H:%M:%S]") + "</td><td class='fixed'>&#160;-&#160;</td><td class='fixed'>" +  what + "</td><td class='fixed'>&#160;-&#160;</td><td class='fixed'>" +  type + "</td><td class='fixed'>&#160;-&#160;</td><td class='long'>" +  message + "</td></tr>");
}//}}}

function report_failure(){}
