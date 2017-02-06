var ws;
var running = false;
var subscription;
var subscription_state = 'less';
var save = {};
    save['state']= undefined;
    save['dsl'] = undefined;
    save['graph'] = undefined;
    save['endpoints'] = undefined;
    save['dataelements'] = undefined;
    save['attributes'] = undefined;
    save['details'] = undefined;
    save['details_target'] = undefined;
var node_state = {};
var sub_more = 'topic'  + '=' + 'activity' + '&' +// {{{
               'events' + '=' + 'calling,status,manipulating,failed,done' + '&' +
               'topic'  + '=' + 'activity' + '&' +
               'votes'  + '=' + 'syncing_after' + '&' +
               'topic'  + '=' + 'description' + '&' +
               'events' + '=' + 'change,error' + '&' +
               'topic'  + '=' + 'position' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'state' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'dataelements' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'endpoints' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'attributes' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'transformation' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'handlerwrapper' + '&' +
               'events' + '=' + 'error,change' + '&' +
               'topic'  + '=' + 'handlers' + '&' +
               'events' + '=' + 'change';// }}}
var sub_less = 'topic'  + '=' + 'activity' + '&' +// {{{
               'events' + '=' + 'calling,status,manipulating,failed,done' + '&' +
               'topic'  + '=' + 'position' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'description' + '&' +
               'events' + '=' + 'change,error' + '&' +
               'topic'  + '=' + 'state' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'dataelements' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'endpoints' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'attributes' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'transformation' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'handlerwrapper' + '&' +
               'events' + '=' + 'error,change' + '&' +
               'topic'  + '=' + 'handlers' + '&' +
               'events' + '=' + 'change';// }}}

$(document).ready(function() {// {{{
  $("input[name=base-url]").val(location.protocol + "//" + location.host + ":" + $('body').data('defaultport'));
  $("button[name=base]").click(function(){ create_instance(null,false); });
  $("button[name=instance]").click(function(){ ui_activate_tab("#tabinstance"); monitor_instance(false,false); });
  $("button[name=loadtestset]").click(function(e){new CustomMenu(e).menu($('#predefinedtestsets'),function(){ load_testset(false) } ); });
  $("button[name=loadtestsetfile]").click(load_testsetfile);
  $("button[name=loadmodelfile]").click(load_modelfile);
  $("button[name=loadmodeltype]").click(function(e){new CustomMenu(e).menu($('#modeltypes'),load_modeltype, $("button[name=loadmodeltype]")); });
  $("button[name=savetestset]").click(function(){ save_testset(); });
  $("button[name=savesvg]").click(function(){ save_svg(); });
  $("input[name=votecontinue]").click(check_subscription);
  $("input[name=testsetfile]").change(load_testsetfile_after);
  $("input[name=modelfile]").change(load_modelfile_after);

  $.ajax({
    url: "testsets/testsets.xml",
    dataType: 'xml',
    success: function(res){
      $('testset',res).each(function(){
        var ts = $(this).text();
        $('#predefinedtestsets').append($("<div class='menuitem'></div>").text(ts));
      });
      var q = $.parseQuerySimple();
      if (q.monitor && q.load) {
        $("input[name=instance-url]").val(q.monitor);
        $("#predefinedtestsets div.menuitem").each(function(k,v){
          if ($(v).text() == q.load) { $(v).attr('data-selected','selected'); }
        });
        ui_activate_tab("#tabexecution");
        monitor_instance(true,false);
      } else if (q.load) {
        $("#predefinedtestsets div.menuitem").each(function(k,v){
          if ($(v).text() == q.load) { $(v).attr('data-selected','selected'); }
        });
        ui_activate_tab("#tabexecution");
        create_instance(q.load,false);
      } else if (q.monitor) {
        $("input[name=instance-url]").val(q.monitor);
        ui_activate_tab("#tabexecution");
        monitor_instance(false,false);
      } else if (q.exec) {
        $("#predefinedtestsets div.menuitem").each(function(k,v){
          if ($(v).text() == q.exec) { $(v).attr('data-selected','selected'); }
        });
        ui_activate_tab("#tabexecution");
        create_instance(q.exec,true);
      }
    }
  });
  $.ajax({
    url: "testsets/transformations.xml",
    dataType: 'xml',
    success: function(res){
      $('transformation',res).each(function(){
        var ts = $(this).text();
        $('#modeltypes').append($("<div class='menuitem'></div>").text(ts));
      });
    }
  });
});// }}}

function check_subscription() { // {{{
  var url = $("#current-instance").text();
  var num = 0;
  if ($("input[name=votecontinue]").is(':checked')) num += 1;
  if (num > 0 && subscription_state == 'less') {
    $.ajax({
      type: "PUT",
      url: url + "/notifications/subscriptions/" + subscription,
      data: (
        sub_more + '&' +
        'message-uid' + '=' + 'xxx' + '&' +
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
        sub_less + '&' +
        'message-uid' + '=' + 'xxx' + '&' +
        'fingerprint-with-producer-secret' + '=' + 'xxx'
      )
    });
    subscription_state = 'less';
    format_visual_vote_clear();
  }
}// }}}

function create_instance(ask,exec) {// {{{
  var info = ask ? ask: prompt("Instance info?", "Enter info here");
  if (info != null) {
    if (info.match(/\S/)) {
      var base = $("input[name=base-url]").val();
      $.ajax({
        type: "POST",
        url: base,
        dataType: "text",
        data: "info=" + info,
        success: function(res){
          $("input[name=instance-url]").val((base + "//" + res + "/").replace(/\/+/g,"/").replace(/:\//,"://"));
          if (ask) monitor_instance(true,exec);
        },
        error: function(a,b,c) {
          alert("No CPEE running.");
        }
      });
    } else {
      alert("An instance info is necessary!");
    }
  }
}// }}}

function monitor_instance(load,exec) {// {{{
  var url = $("input[name=instance-url]").val();

  $('.tabbehind button').hide();
  $('#dat_details').empty();

  $.ajax({
    type: "GET",
    url: url + "/properties/schema/",
    success: function(res){
      $("ui-tabbed.hidden, ui-rest.hidden").removeClass("hidden");
      $("ui-resizehandle.hidden").removeClass("hidden");
      $("ui-tabbed ui-tab.hidden, ui-rest ui-tab.hidden").removeClass("hidden");

      // Change url to return to current instance when reloading
      $("#current-instance").text(url);
      $("#current-instance").attr('href',url);
      $("#current-instance-properties").attr('href',url + 'properties/');
      $("#current-instance-properties").text('P');
      $("#current-instance-subscriptions").attr('href',url + 'notifications/subscriptions/');
      $("#current-instance-subscriptions").text('S');
      $("#current-instance-callbacks").attr('href',url + 'callbacks/');
      $("#current-instance-callbacks").text('C');
      history.replaceState({}, '', '?monitor='+url);

      // Change url to return to current instance when reloading (because new subscription is made)
      $("input[name=votecontinue]").removeAttr('checked');
      subscription_state = 'less';

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
          if (ws) ws.close();
          ws = new Socket(url.replace(/http/,'ws') + "/notifications/subscriptions/" + subscription + "/ws/");
          ws.onopen = function() {
            append_to_log("monitoring", "opened", "");
          };
          ws.onmessage = function(e) {
            data = $.parseXML(e.data);
            if ($('event > topic',data).length > 0) {
              switch($('event > topic',data).text()) {
                case 'dataelements':
                  monitor_instance_values("dataelements");
                  break;
                case 'description':
                  monitor_instance_dsl();
                  break;
                case 'endpoints':
                  monitor_instance_values("endpoints");
                  break;
                case 'attributes':
                  monitor_instance_values("attributes");
                  monitor_instance_transformation();
                  monitor_graph_change(true);
                  break;
                case 'state':
                  monitor_instance_state_change(JSON.parse($('event > notification',data).text()).state);
                  break;
                case 'position':
                  monitor_instance_pos_change($('event > notification',data).text());
                  break;
                case 'transformation':
                  monitor_instance_transformation();
                  break;
                case 'activity':
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
          if (load || exec) load_testset(exec);
        }
      });

      monitor_instance_values("dataelements");
      monitor_instance_values("endpoints");
      monitor_instance_values("attributes");
      monitor_instance_transformation();
      monitor_instance_dsl();
      monitor_instance_state();
    },
    error: function(a,b,c) {
      alert("This ain't no CPEE instance");
      ui_activate_tab("#tabnew");
    }
  });
}// }}}

function monitor_instance_values(val) {// {{{
  var url = $("#current-instance").text();
  $.ajax({
    type: "GET",
    url: url + "/properties/values/" + val + "/",
    success: function(res){
      save[val].content(res);
    }
  });
} // }}}

function adaptor_init(url,theme,dslx) {
  new WfAdaptor($('body').data('theme-base') + '/' + theme + '/theme.js',function(graphrealization){
    graphrealization.set_svg_container($('#graphcanvas'));
    graphrealization.set_description($(dslx), true);
    graphrealization.notify = function(svgid) {
      var g = graphrealization.get_description();
      save['graph'] = $X(g);
      save['graph'].find('[xmlns]').removeAttr('xmlns');
      $.ajax({
        type: "PUT",
        url: url + "/properties/values/description/",
			 	data: ({'content': '<content>' + g + '</content>'})
      });
      manifestation.events.click(svgid);
    };
    monitor_instance_pos();
  });
}

function monitor_graph_change(force) {
  var url = $("#current-instance").text();
  $.ajax({
    type: "GET",
    url: url + "/properties/values/dslx/",
    success: function(dslx){
      if (force || !save['graph'] || (save['graph'] && save['graph'].serializePrettyXML() != $(dslx).serializePrettyXML())) {
        $.ajax({
          type: "GET",
          url: url + "/properties/values/attributes/theme/",
          success: function(res){
            adaptor_init(url,$('value',res).text(),dslx);
          },
          error: function() {
            adaptor_init(url,'default',dslx);
          }
        });
      }
    }
  });
}

function monitor_instance_dsl() {// {{{
  var url = $("#current-instance").text();
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
        monitor_graph_change(false);
      }
    }
  });
}// }}}

function monitor_instance_state() {// {{{
  var url = $("#current-instance").text();
  $.ajax({
    type: "GET",
    url: url + "/properties/values/state/",
    dataType: "text",
    success: function(res){
      monitor_instance_state_change(res);
    }
  });
}// }}}
function monitor_instance_transformation() {// {{{
  var url = $("#current-instance").text();
  $.ajax({
    type: "GET",
    url: url + "/properties/values/attributes/modeltype",
    success: function(res){
      $("#currentmodel").text($(res.documentElement).text());
    },
    error: function() {
      $("#currentmodel").text('???');
    }
  });
}// }}}

function monitor_instance_pos() {// {{{
  var url = $("#current-instance").text();
  $.ajax({
    type: "GET",
    url: url + "/properties/values/positions/",
    success: function(res){
      var values = $("value > *",res);
      format_visual_clear();
      values.each(function(){
        var what = this.nodeName;
        format_visual_add(what,"passive");
      });
    }
  });
}// }}}

function monitor_instance_running(notification,event) {// {{{
  if (save['state'] == "stopping") return;
  var parts = JSON.parse(notification);
  if (event == "calling")
    format_visual_add(parts.activity,"active")
  if (event == "done")
    format_visual_remove(parts.activity,"active")
} // }}}
function monitor_instance_state_change(notification) { //{{{
  if (notification == "ready" || notification == "stopped" || notification == "running") {
    $("#state button").removeAttr('disabled');
  }
  if (notification != save['state']) {
    save['state'] = notification;

    var ctv = $("#state");
    ctv.empty();

    if (notification == "stopped") {
      monitor_instance_pos();
    }
    if (notification == "running") {
      format_visual_clear();
    }

    var but = "";
    if (notification == "ready" || notification == "stopped") {
      but = " ⇒ <button onclick='$(this).attr(\"disabled\",\"disabled\");start_instance();'>start</button> / <button onclick='$(this).attr(\"disabled\",\"disabled\");sim_instance();'>simulate</button>";
    }
    if (notification == "running") {
      but = " ⇒ <button onclick='$(this).attr(\"disabled\",\"disabled\");stop_instance();'>stop</button>";
    }

    if (notification == "finished") {
      $('.tabbehind button').hide();
    } else {
      $('#parameters .tabbehind button').show();
    }

    ctv.append(notification + but);
  }
}   //}}}
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

  astr = '';
  if ($("input[name=votecontinue]").is(':checked'))
    astr += "<button id='vote_to_continue-" + parts.activity + "-" + parts.callback + "' onclick='$(this).attr(\"disabled\",\"disabled\");monitor_instance_vote_remove(\"" + parts.activity + "\",\"" + parts.callback + "\",\"true\");'>" + parts.activity + "</button>";
  ctv.append(astr);
  format_visual_add(parts.activity,"vote")
}// }}}
function monitor_instance_vote_remove(activity,callback,value) {//{{{
  var url = $("#current-instance").text();
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
  var url = $("#current-instance").text();
  $.ajax({
    type: "PUT",
    url: url + "/properties/values/state",
    data: ({value: "running"}),
    error: report_failure
  });
}// }}}
function sim_instance() {// {{{
  var url = $("#current-instance").text();
  $.ajax({
    type: "PUT",
    url: url + "/properties/values/state",
    data: ({value: "simulating"}),
    error: report_failure
  });
}// }}}
function stop_instance() {// {{{
  var url = $("#current-instance").text();
  $.ajax({
    type: "PUT",
    url: url + "/properties/values/state",
    data: ({value: "stopping"}),
    error: report_failure
  });
}// }}}

function save_testset() {// {{{
  var base = $("#current-instance").text();
  var testset = $X('<testset/>');

  $.ajax({
    type: "GET",
    url: base + "/properties/values/dataelements/",
    success: function(res){
      var pars = $X('<dataelements/>');
      pars.append($(res.documentElement).children());
      testset.append(pars);
      $.ajax({
        type: "GET",
        url: base + "/properties/values/handlerwrapper/",
        success: function(res){
          var pars = $X('<handlerwrapper>' + res + '</handlerwrapper>');
          testset.append(pars);
          $.ajax({
            type: "GET",
            url: base + "/properties/values/endpoints/",
            success: function(res){
              var pars = $X('<endpoints/>');
              pars.append($(res.documentElement).children());
              testset.append(pars);
              $.ajax({
                type: "GET",
                url: base + "/properties/values/positions/",
                success: function(res){
                  var pars = $X('<positions/>');
                  pars.append($(res.documentElement).children());
                  testset.append(pars);
                  $.ajax({
                    type: "GET",
                    url: base + "/properties/values/dslx/",
                    success: function(res){
                      var pars = $X('<description/>');
                      pars.append($(res.documentElement));
                      testset.append(pars);
                      pars = $X("<transformation><description type='copy'/><dataelements type='none'/><endpoints type='none'/></transformation>");
                      testset.append(pars);
                      $.ajax({
                        type: "GET",
                        url: base + "/properties/values/attributes/",
                        success: function(res){
                          var name = $("value > info",res).text();
                          var pars = $X('<attributes/>');
                          pars.append($(res.documentElement).children());
                          pars.find('uuid').remove();
                          testset.append(pars);
                          $('#savetestset').attr('download',name + '.xml');
                          $('#savetestset').attr('href','data:application/xml;charset=utf-8;base64,' + window.btoa(testset.serializePrettyXML()));
                          document.getElementById('savetestset').click();
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
function save_svg() {// {{{
  var base = $("#current-instance").text();
  var params = { mimetype: 'image/svg+xml' };

  var gc = $('#graphcanvas').clone();
  $.ajax({
    type: "GET",
    url: "lib/wfadaptor.css",
    success: function(res){
      gc.prepend($X('<style xmlns="http://www.w3.org/2000/svg" type="text/css"><![CDATA[' + res + ']]></style>'));
      $.ajax({
        type: "GET",
        url: base + "/properties/values/attributes/info/",
        success: function(res){
          var name = $(res.documentElement).text();

          $('#savesvg').attr('download',name + '.svg');
          $('#savesvg').attr('href','data:application/xml;charset=utf-8;base64,' + window.btoa(gc.serializeXML()));
          document.getElementById('savesvg').click();
        },
        error: report_failure
      });
    }
  });
}// }}}
function set_testset(testset,exec) {// {{{
  console.log(exec);
  var url = $("#current-instance").text();

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

  load_testset_dataelements(url,testset);
  load_testset_attributes(url,testset);
  load_testset_endpoints(url,testset);
  load_testset_pos(url,testset);

  if ($("testset > transformation",testset).length > 0) {
    var ser = '';
    $("testset > transformation > *",testset).each(function(){
      ser += $(this).serializeXML() + "\n";
    });
    var val = "<content>" + ser + "</content>";
    $.ajax({
      type: "PUT",
      url: url + "/properties/values/transformation",
      data: ({content: val}),
      success: function() {
        load_testset_des(url,testset);
      },
      error: report_failure
    });
  } else {
    load_testset_des(url,testset);
  }

  load_testset_hw(url,testset);
  $.ajax({
    type: "GET",
    url: url + "/properties/values/state/",
    dataType: "text",
    success: function(res){
      $.ajax({
        type: "PUT",
        url: url + "/properties/values/state",
        data: ({value: res}),
        error: report_failure,
        success: function(res){
          if (exec) start_instance();
        }
      });
    }
  });
 }// }}}

function load_testsetfile_after() { //{{{
  if (running) return;
  running = true;
  if (typeof window.FileReader !== 'function') {
    alert('FileReader not yet supportet');
    return;
  }
  var files = $('#testsetfile').get(0).files;
  var reader = new FileReader();
  reader.onload = function(){
    set_testset($.parseXML(reader.result),false);
    running  = false;
  }
  reader.onerror = function(){ running  = false; }
  reader.onabort = function(){ running  = false; }
  reader.readAsText(files[0]);
} //}}}
function load_testsetfile() {// {{{
  if (running) return;
  document.getElementById('testsetfile').click();
}// }}}

function load_modelfile_after() { //{{{
  if (running) return;
  running = true;
  if (typeof window.FileReader !== 'function') {
    alert('FileReader not yet supportet');
    return;
  }
  var files = $('#modelfile').get(0).files;
  var reader = new FileReader();
  reader.onload = function(){
    var url = $("#current-instance").text();
    load_des(url,reader.result);
    running  = false;
  }
  reader.onerror = function(){ running  = false; }
  reader.onabort = function(){ running  = false; }
  reader.readAsText(files[0]);
} //}}}
function load_modelfile() {// {{{
  if (running) return;
  document.getElementById('modelfile').click();
}// }}}

function load_testset(exec) {// {{{
  if (running) return;
  running  = true;

  var name = $("#predefinedtestsets div.menuitem[data-selected=selected]").text();
  $.ajax({
    cache: false,
    dataType: 'xml',
    url: "testsets/" + name + ".xml",
    success: function(res){
      save['dsl'] = null; // reload dsl and position under all circumstances
      $('#main .tabbehind button').hide();
      $('#dat_details').empty();

      document.title = name;
      set_testset(res,exec);
    },
    complete: function() {
      running  = false;
    }
  });
}// }}}
function load_modeltype() {// {{{
  if (running) return;
  var url = $("#current-instance").text();
  running  = true;

  var name = $("#modeltypes div.menuitem[data-selected=selected]").text();
  $.ajax({
    cache: false,
    dataType: 'xml',
    url: "testsets/" + name + ".xml",
    success: function(res){
      $.ajax({
        type: "PUT",
        url: url + "/properties/values/attributes/modeltype",
        data: ({value: name}),
        success: function(){
          set_testset(res,false);
        },
        error: report_failure
      });
    },
    complete: function() {
      running  = false;
    }
  });
}// }}}

function load_des(url,model) { //{{{
  model = model.replace(/<\?[^\?]+\?>/,'');
  var val = "<content>" + model + "</content>";
  $.ajax({
    type: "PUT",
    url: url + "/properties/values/description",
    data: ({content: val}),
    error: report_failure
  });
}   //}}}

function load_testset_des(url,testset) {// {{{
  if ($("testset > description",testset).length == 0) { return; }
  var ser = '';
  $("testset > description > *",testset).each(function(){
    ser += $(this).serializeXML() + "\n";
  });
  load_des(url,ser);
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
  if ($("testset > dataelements",testset).length == 0) { return; }
  var ser = '';
  $("testset > dataelements > *",testset).each(function(){
    ser += $(this).serializeXML() + "\n";
  });
  var val = "<content>" + ser + "</content>";
  $.ajax({
    type: "PUT",
    url: url + "/properties/values/dataelements",
    data: ({content: val}),
    error: report_failure
  });
}// }}}
function load_testset_attributes(url,testset) {// {{{
  if ($("testset > attributes",testset).length == 0) { return; }
  var ser = '';
  $.ajax({
    type: "GET",
    url: url + "/properties/values/attributes/uuid",
    success: function(res){
      var uuid = $X('<uuid xmlns="http://riddl.org/ns/common-patterns/properties/1.0"/>');
          uuid.text($('value',res).text());
      $("testset > attributes",testset).prepend(uuid);
      $("testset > attributes > *",testset).each(function(){
        ser += $(this).serializeXML() + "\n";
      });
      var val = "<content>" + ser + "</content>";
      $.ajax({
        type: "PUT",
        url: url + "/properties/values/attributes",
        data: ({content: val}),
        error: report_failure
      });
    }
  });
}// }}}
function load_testset_endpoints(url,testset) {// {{{
  if ($("testset > endpoints",testset).length == 0) { return; }
  var ser = '';
  $("testset > endpoints > *",testset).each(function(){
    ser += $(this).serializeXML() + "\n";
  });
  var val = "<content>" + ser + "</content>";
  $.ajax({
    type: "PUT",
    url: url + "/properties/values/endpoints/",
    data: ({content: val}),
    error: report_failure
  });
}// }}}
function load_testset_pos(url,testset) {// {{{
  if ($("testset > positions",testset).length == 0) { return; }
  var ser = '';
  $("testset > positions > *",testset).each(function(){
    ser += $(this).serializeXML() + "\n";
  });
  var val = "<content>" + ser + "</content>";
  $.ajax({
    type: "PUT",
    url: url + "/properties/values/positions/",
    data: ({content: val}),
    success: monitor_instance_pos,
    error: report_failure
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
    node_state[what] = {};
  if (node_state[what][cls] == undefined)
    node_state[what][cls] = 0;
  node_state[what][cls] += 1;
  format_visual_set(what);
}//}}}
function format_visual_remove(what,cls) {//{{{
  if (node_state[what] == undefined)
    node_state[what] = {};
  if (node_state[what][cls] == undefined)
    node_state[what][cls] = 0;
  node_state[what][cls] -= 1;
  format_visual_set(what);
}//}}}
function format_visual_set(what) {//{{{
  if (node_state[what] != undefined) {
    if (node_state[what]['vote'] == undefined) node_state[what]['vote'] = 0;
    if (node_state[what]['active'] == undefined) node_state[what]['active'] = 0;
    if (node_state[what]['passive'] == undefined) node_state[what]['passive'] = 0;

    var votes = node_state[what]['vote'];
    var actives = node_state[what]['active'];
    var passives = node_state[what]['passive'];

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

    $.each(['#activity-' + what, 'g[element-id="' + what + '"] g'],function(i,t){
      $(t).each(function(a,b){
        if      (actives > 0)  vs = 'active';
        else if (votes > 0)    vs = 'vote';
        else if (passives > 0) vs = 'passive';
        else                   vs = '';
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
  $("#dat_log").append("<tr><td class='fixed top'><a title=\"" + d.strftime("[%d/%b/%Y %H:%M:%S]") + "\">D</a></td><td class='fixed'>&#160;-&#160;</td><td class='fixed'><a title=\"" + what + "\">T</a></td><td class='fixed'>&#160;-&#160;</td><td class='fixed'>" +  type + "</td><td class='fixed'>&#160;-&#160;</td><td class='long'>" +  message + "</td></tr>");
}//}}}

function report_failure(){}
