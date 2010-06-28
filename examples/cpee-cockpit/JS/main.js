var running = false;
var subscription;
var save_state;
var save_dsl;
var save_eps;
var save_cvs;
var node_state = {};

$(document).ready(function() {// {{{
  $("div.section > h1").click(toggle_vis);
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

function toggle_vis() {
  $(this).toggleClass('margin');
  $("+ div",this).toggleClass('hidden');
}

function create_instance() {// {{{
  var name = prompt("Instance name?", "Enter name here");
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
        error: report_failure
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
      monitor_instance_state();
    },
    error: function(a,b,c) {
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
      var values = $("value > *",res);
      var temp = "";
      values.each(function(){
      if($(this).text().length < 80) {
        temp += "<tr><td>" + this.nodeName  + "</td><td>⇒</td><td>" + format_text($(this).text()) + "</td></tr>";
      } else {
        temp += "<tr><td>" + this.nodeName  + "</td><td>⇒</td><td><a href=\"" + url + "/properties/values/context-variables/" + this.nodeName  +"\" target=\"_blank\">Show context</a></td></tr>";
      }
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
    var values = $("value > *",res);
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
      res = res.replace(/activity\s+\[:([A-Za-z][a-zA-Z0-9_]+)([^\]]*\])/g,"<span class='activities' id=\"activity-$1\">activity [:$1$2</span>");

      ctv.append(res);
      $.ajax({
        type: "GET",
        url: url + "/properties/values/description/",
        success: function(res){
          var container = $("#canvas").get(0);
          var g = new WFGraph(res, res.documentElement, container);
          var width = g.generateGraph({
            symclick: sym_click
          });
          container.parentNode.parentNode.setAttribute("style", "width: " + width + "px");
          monitor_instance_pos();
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

      var ctv = $("#state");
      ctv.empty();

      var but = "";
      if (res == "stopped") {
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
var url = $("input[name=instance-url]").val();
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

function monitor_instance_pos_change(notification,event) {// {{{
if (save_state == "stopping") return;
var parts = YAML.eval(notification);
if (event == "activity_calling")
  format_visual_add(parts.activity,"active")
if (event == "activity_done")
  format_visual_remove(parts.activity,"active")
} // }}}

function monitor_instance_vote_add(notification) {// {{{
  if (save_state == "stopping") return;
  var parts = YAML.eval(notification);
  var ctv = $("#votes");
  ctv.append("<tr id='vote_to_continue-" + parts.activity + "-" + parts.callback + "'><td>Activity:</td><td>" + parts.activity + (parts.lay ? ", " + parts.lay : '') + "</td><td>⇒</td><td><button onclick='$(this).attr(\"disabled\",\"disabled\");monitor_instance_vote_remove(\"" + parts.activity + "\",\"" + parts.callback + "\",\"true\");'>vote to continue</button><td><button onclick='$(this).attr(\"disabled\",\"disabled\");monitor_instance_vote_remove(\"" + parts.activity + "\",\"" + parts.callback + "\",\"false\");'>vote to stop</button></td></td></tr>");
  format_visual_add(parts.activity,"vote")
}// }}}

function monitor_instance_vote_remove(activity,callback,value) {//{{{
  var url = $("input[name=instance-url]").val();
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
var url = $("input[name=instance-url]").val();
format_visual_clear();
$.ajax({
  type: "PUT", 
  url: url + "/properties/values/state",
  data: ({value: "running"}),
  error: report_failure
});
}// }}}

function stop_instance() {// {{{
var url = $("input[name=instance-url]").val();
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
var table = $('#tabledetails');
table.empty();
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
        var values = $("value > *",res);
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
            error: report_failure
          });  
        });
        if (length == 0)
          load_testset_cvs(url,testset);
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
                load_testset_eps(url,testset);
            },
            error: report_failure
          });  
        });
        if (length == 0)
          load_testset_eps(url,testset);
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

function load_testset_cvs(url,testset) {// {{{
  $("testset > context-variables > *",testset).each(function(){
    var val = $(this).serializeXML();
    $.ajax({
      type: "POST", 
      url: url + "/properties/values/context-variables/",
      data: ({value: val}),
      error: report_failure
    });  
  });
}// }}}

function load_testset_eps(url,testset) {// {{{
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
  table.append('<tr><td><strong>Element:</strong></td><td class="long">' + node.nodeName + '</td></tr>');
  switch(node.nodeName) {
    case 'call':
      table.append('<tr><td><strong>ID:</strong></td><td class="long">' + $(node).attr('id') + '</td></tr>');
      if ($(node).attr('lay'))
        table.append('<tr><td><strong>Lay:</strong></td><td class="long">' + $(node).attr('lay') + '</td></tr>');
      table.append('<tr><td><strong>Endpoint:</strong></td><td class="long">' + $(node).attr('endpoint') + '</td></tr>');
      if ($('manipulate',node).text())
        table.append('<tr><td><strong>Manipulate:</strong></td><td class="long">' + format_code($('manipulate',node).text(),true,false) + '</td></tr>');
      if ($('parameters',node).length > 0)
        table.append('<tr><td><strong>Parameters:</strong></td><td class="long"></td></tr>');
        table.append(sym_click_para($(node).children('parameters'),'&#160;&#160;&#160;&#160;'));
      break;
    case 'manipulate':
      table.append('<tr><td><strong>ID:</strong></td><td class="long">' + $(node).attr('id') + '</td></tr>');
      table.append('<tr><td><strong>Manipulate:</strong></td><td class="long">' + format_code($(node).text(),true,false) + '</td></tr>');
      break;
    case 'loop':
      if ($(node).attr('pre_test'))
        table.append('<tr><td><strong>Pre-Test:</strong></td><td class="long">' + $(node).attr('pre_test') + '</td></tr>');
      if ($(node).attr('post_test'))
        table.append('<tr><td><strong>Post-Test:</strong></td><td class="long">' + $(node).attr('post_test') + '</td></tr>');
      break;
    case 'alternative':
      table.append('<tr><td><strong>Condition:</strong></td><td class="long">' + $(node).attr('condition') + '</td></tr>');
      break;
    case 'parallel':
      var wait = $(node).attr('condition') || 'Wait for all branches';
      table.append('<tr><td><strong>Wait:</strong></td><td class="long">' + wait + '</td></tr>');
      break;
    case 'parallel_branch':
      if ($(node).attr('pass'))
        table.append('<tr><td><strong>Pass&#160;to&#160;branch:</strong></td><td class="long">' + $(node).attr('pass') + '</td></tr>');
      if ($(node).attr('local'))
        table.append('<tr><td><strong>Local&#160;scope:</strong></td><td class="long">' + $(node).attr('local') + '</td></tr>');
      break;
    case 'injected':
        table.append('<tr><td><strong>Injected by:</strong></td><td class="long">' + $(node).attr('source') + '</td></tr>');
        table.append('<tr><td><strong>Resultobject:</strong></td><td class="long">' + $(node).attr('result') + '</td></tr>');
        table.append('<tr><td><strong>Propertiesobject:</strong></td><td class="long">' + $(node).attr('properties') + '</td></tr>');
        table.append(sym_click_constraint($(node).children('constraints'),'&#160;&#160;&#160;&#160;'));
      break;
  }
} // }}}

function sym_click_constraint(node,ind) { // {{{
  var out = '';
  $(node).children().each(function(i,e){
    if (e.nodeName == "group") {
      out += '<tr><td colspan="2">';
      out += ind + $(e).attr('connector')+'-group';
      out += '</td></tr>';
      out += sym_click_constraint(e,ind + '&#160;&#160;&#160;&#160;');
    } else {
      out += '<tr><td colspan="2">';
      out += ind + 'Constraint ⇒ ' + $(e).attr('xpath') + ' ' + $(e).attr('comparator') + ' ';
      if ($(e).attr('value')) {
        out += $(e).attr('value');
      } else {
         out += '@'+$(e).attr('variable');
      }
      out += '</td></tr>';
    }  
  });  
  return out;
} // }}}
function sym_click_para(node,ind) { // {{{
  var out = '';
  $(node).children().each(function(i,e){
    if ($(e).children().length == 0) {
      out += '<tr><td colspan="2">';
      out += ind + e.nodeName + ' ⇒ ' + $(e).text().replace(/^\s+|\s+$/g,"");
      out += '</td></tr>';
    } else {
      out += '<tr><td colspan="2">';
      out += ind + e.nodeName + ':';
      out += '</td></tr>';
      out += sym_click_para(e,ind + '&#160;&#160;&#160;&#160;');
    }  
  });  
  return out;
} // }}}

function format_visual_add(what,class) {//{{{
  if (node_state[what] == undefined)
    node_state[what] = [];
  node_state[what].push(class);
  format_visual_set(what);
}//}}}

function format_visual_remove(what,class) {//{{{
  c = node_state[what];
  if ($.inArray(class,c) != -1)
    c.splice($.inArray(class,c),1);
  format_visual_set(what);
}//}}}
  
function format_visual_set(what) {//{{{
  if (node_state[what] != undefined) {
    var votes = jQuery.grep(node_state[what], function(n, i){ return (n == 'vote'); });
        votes = votes.length;
    var actives = jQuery.grep(node_state[what], function(n, i){ return (n == 'active'); });
        actives = actives.length;
    if (actives > 0 && votes > 0)
      $('#node-' + what + ' .super .colon').each(function(a,b){
        b.setAttribute('class','colon necessary');
      });
    else  
      $('#node-' + what + ' .super .colon').each(function(a,b){
        b.setAttribute('class','colon');
      });
    if (actives > 0)
      $('#node-' + what + ' .super .active').each(function(a,b){
        b.setAttribute('class','active necessary');
        var txt = b.childNodes[0];
        txt.nodeValue = actives;
      });
    else  
      $('#node-' + what + ' .super .active').each(function(a,b){
        b.setAttribute('class','active');
      });
    if (votes > 0)
      $('#node-' + what + ' .super .vote').each(function(a,b){
        b.setAttribute('class','vote necessary');
        var txt = b.childNodes[0];
        txt.nodeValue = votes;
      });
    else  
      $('#node-' + what + ' .super .vote').each(function(a,b){
        b.setAttribute('class','vote');
      });
  }  

  $.each(["graph","activity"],function(i,t){
    $('#' + t + '-' + what).each(function(a,b){ 
      if (node_state[what] != undefined)
        b.setAttribute("class",'activities ' + node_state[what].join(" "));
    });
  });
}//}}}
      
function format_visual_clear() {//{{{
  node_state = {};
  $('.super .active').each(function(a,b){b.setAttribute("class","active");});
  $('.super .vote').each(function(a,b){b.setAttribute("class","vote");});
  $('.super .colon').each(function(a,b){b.setAttribute("class","colon");});
  $('.activities').each(function(a,b){b.setAttribute("class","activities");});
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
  $("#tablelog").append("<tr><td class='fixed'><a title=\"" + d.strftime("[%d/%b/%Y %H:%M:%S]") + "\">D</a></td><td class='fixed'>&#160;-&#160;</td><td class='fixed'><a title=\"" + what + "\">T</a></td><td class='fixed'>&#160;-&#160;</td><td class='fixed'>" +  type + "</td><td class='fixed'>&#160;-&#160;</td><td class='long'>" +  message + "</td></tr>");
}//}}}

function report_failure(){}
