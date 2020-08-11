var es;
var suspended_monitoring = false;
var myid = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
var paths = '#dat_details input, #dat_details textarea, #dat_details select, #dat_details button, #dat_details [contenteditable], #dat_dataelements input, #dat_dataelements textarea, #dat_dataelements select, #dat_dataelements button, #dat_dataelements [contenteditable], #dat_endpoints input, #dat_endpoints textarea, #dat_endpoints select, #dat_endpoints button, #dat_endpoints [contenteditable], #dat_attributes input, #dat_attributes textarea, #dat_attributes select, #dat_attributes button, #dat_attributes [contenteditable]';
var loading = false;
var subscription;
var subscription_state = 'less';
var graph_changed = new Event("graph:changed", {"bubbles":true, "cancelable":false});
var save = {};
    save['state']= undefined;
    save['dsl'] = undefined;
    save['graph'] = undefined;
    save['graph_theme'] = undefined;
    save['graph_adaptor'] = undefined;
    save['endpoints'] = undefined;
    save['endpoints_cache'] = {};
    save['endpoints_list'] = {};
    save['dataelements'] = undefined;
    save['attributes'] = undefined;
    save['details'] = undefined;
    save['details_target'] = undefined;
    save['instance_pos'] = [];
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
               'topic'  + '=' + 'task' + '&' +
               'events' + '=' + 'instantiation' + '&' +
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
               'topic'  + '=' + 'task' + '&' +
               'events' + '=' + 'instantiation' + '&' +
               'topic'  + '=' + 'transformation' + '&' +
               'events' + '=' + 'change' + '&' +
               'topic'  + '=' + 'handlerwrapper' + '&' +
               'events' + '=' + 'error,change' + '&' +
               'topic'  + '=' + 'handlers' + '&' +
               'events' + '=' + 'change';// }}}

function cockpit() { //{{{
  $("button[name=base]").click(function(){ create_instance($("input[name=base-url]").val(),null,false,false); });
  $("button[name=instance]").click(function(){ ui_activate_tab("#tabinstance"); monitor_instance($("input[name=instance-url]").val(),$("input[name=res-url]").val(),false,false); });
  $("button[name=loadtestset]").click(function(e){new CustomMenu(e).menu($('#predefinedtestsets'),function(){ load_testset(false) } ); });
  $("button[name=loadtestsetfile]").click(load_testsetfile);
  $("button[name=loadmodelfile]").click(load_modelfile);
  $("button[name=loadmodeltype]").click(function(e){new CustomMenu(e).menu($('#modeltypes'),load_modeltype, $("button[name=loadmodeltype]")); });
  $("button[name=savetestsetfile]").click(function(){ save_testsetfile(); });
  $("button[name=savesvgfile]").click(function(){ save_svgfile(); });
  $("button[name=state_start]").click(function(){ $(this).attr("disabled","disabled");start_instance(); });
  $("button[name=state_stop]").click(function(){ $(this).attr("disabled","disabled");stop_instance(); });
  $("button[name=state_replay]").click(function(){ $(this).attr("disabled","disabled");replay_instance(); });
  $("button[name=state_abandon]").click(function(){ aba_instance(); });
  $("input[name=votecontinue]").click(check_subscription);
  $("input[name=testsetfile]").change(load_testsetfile_after);
  $("input[name=modelfile]").change(load_modelfile_after);

  $.ajax({
    url: $('body').attr('current-testsets') + "testsets.xml",
    dataType: 'xml',
    success: function(res){
      $('testset',res).each(function(){
        var ts = $(this).text();
        $('#predefinedtestsets').append($("<div class='menuitem'></div>").text(ts));
      });
      var q = $.parseQuerySimple();
      if (q.min || q.min == "") {
        ui_toggle_vis_tab($('#instance'));
        ui_toggle_vis_tab($('#parameters'));
      }
      if (q.monitor && q.load) {
        if (q.load.match(/https?:\/\//)) {
          $('body').attr('load-testset',q.load);
        } else {
          $("#predefinedtestsets div.menuitem").each(function(k,v){
            if ($(v).text() == q.load) { $(v).attr('data-selected','selected'); }
          });
        }
        ui_activate_tab("#tabexecution");
        monitor_instance(q.monitor,$("body").attr('current-resources'),true,false);
      } else if (q.load) {
        if (q.load.match(/https?:\/\//)) {
          $('body').attr('load-testset',q.load);
        } else {
          $("#predefinedtestsets div.menuitem").each(function(k,v){
            if ($(v).text() == q.load) { $(v).attr('data-selected','selected'); }
          });
        }
        ui_activate_tab("#tabexecution");
        create_instance($("body").attr('current-base'),q.load,true,false);
      } else if (q.instantiate) {
        if (q.instantiate.match(/https?:\/\//)) {
          ui_activate_tab("#tabexecution");
          create_instance_from($("body").attr('current-base'),q.instantiate,false);
        } else {
          alert('Nope. Url!');
        }
      } else if (q.new || q.new == "") {
        ui_activate_tab("#tabinstance");
        create_instance($("body").attr('current-base'),"Plain Instance",false,false);
      } else if (q.monitor) {
        ui_activate_tab("#tabexecution");
        monitor_instance(q.monitor,$("body").attr('current-resources'),false,false);
      } else if (q.exec) {
        if (q.exec.match(/https?:\/\//)) {
          $('body').attr('load-testset',q.load);
        } else {
          $("#predefinedtestsets div.menuitem").each(function(k,v){
            if ($(v).text() == q.exec) { $(v).attr('data-selected','selected'); }
          });
        }
        ui_activate_tab("#tabexecution");
        create_instance($("body").attr('current-base'),q.exec,true,true);
      }
    }
  });
  $.ajax({
    url: $('body').attr('current-testsets') + "transformations.xml",
    dataType: 'xml',
    success: function(res){
      $('transformation',res).each(function(){
        var ts = $(this).text();
        $('#modeltypes').append($("<div class='menuitem'></div>").text(ts));
      });
    }
  });
} //}}}

function sanitize_url(url) { //{{{
  var lastChar = url.substr(url.length - 1)
  if (lastChar != '/') {
    url = (url + '/');
  }
  return url;
}
 //}}}
function check_subscription() { // {{{
  var url = $('body').attr('current-instance');
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

function create_instance_from(base,url,exec) {// {{{
  $.get({
    url: url,
    dataType: "text",
    success: function(res) {
      $.ajax({
        type: "POST",
        url: base,
        contentType: 'application/xml',
        dataType: "text",
        headers: { 'CONTENT-ID': 'xml' },
        data: res,
        success: function(res){
          var iu = (base + "//" + res + "/").replace(/\/+/g,"/").replace(/:\//,"://");
          monitor_instance(iu,$("body").attr('current-resources'),false,exec);
        },
        error: function(a,b,c) {
          alert("No CPEE running.");
        }
      });
    }
  });
}// }}}
function create_instance(base,name,load,exec) {// {{{
  var info = name ? name : prompt("Instance info?", "Enter info here");
  if (info != null) {
    if (info.match(/\S/)) {
      $.ajax({
        type: "POST",
        url: base,
        dataType: "text",
        data: "info=" + info,
        success: function(res){
          var iu = (base + "//" + res + "/").replace(/\/+/g,"/").replace(/:\//,"://");
          if (name) {
            monitor_instance(iu,$("body").attr('current-resources'),load,exec);
          } else {
            $("body").attr('current-instance', sanitize_url(iu));
            $("input[name=instance-url]").val(iu);
          }
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

function sse() { //{{{
  var url = $('body').attr('current-instance');
  es = new EventSource(url + "/notifications/subscriptions/" + subscription + "/sse/");
  es.onopen = function() {
    append_to_log("monitoring", "opened", "");
  };
  es.onmessage = function(e) {
    data = JSON.parse(e.data);
    if (data['type'] == 'event') {
      switch(data['topic']) {
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
          if (!suspended_monitoring) { // or else it would load twice, because dsl changes also trigger
            monitor_graph_change(true);
          }
          break;
        case 'task':
          if ($('#trackcolumn').length > 0) {
            $('#trackcolumn').append($('<iframe src="track.html?monitor=' + data['instance-url'].replace(/\/*$/,'/') + '"></iframe>'));
          }
          break;
        case 'state':
          monitor_instance_state_change(data['content']['state']);
          break;
        case 'position':
          monitor_instance_pos_change(data['content']);
          break;
        case 'transformation':
          monitor_instance_transformation();
          break;
        case 'activity':
          monitor_instance_running(data['content'],data['name']);
          break;
      }
    }
    if (data['type'] == 'vote') {
      monitor_instance_vote_add(data['content']);
    }
    append_to_log(data['type'], data['topic'] + '/' + data['name'], JSON.stringify(data['content']));
  };
  es.onerror = function() {
    append_to_log("monitoring", "closed", "server down i assume.");
    // setTimeout(sse,10000);
  };

  monitor_instance_values("dataelements");
  monitor_instance_values("endpoints");
  monitor_instance_values("attributes");
  monitor_instance_transformation();
  monitor_instance_dsl();
  monitor_instance_state();
} //}}}

function monitor_instance(cin,rep,load,exec) {// {{{
  $("body").attr('current-instance',sanitize_url(cin));
  $("body").attr('current-resources',sanitize_url(rep));

  $("input[name=instance-url]").val($("body").attr('current-instance'));
  $("input[name=res-url]").val($("body").attr('current-resources'));

  $('.tabbehind button').hide();
  $('#dat_details').empty();

  url = $("body").attr('current-instance');

  $.ajax({
    type: "GET",
    url: url,
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
      var q = $.parseQuerySimple();
      history.replaceState({}, '', '?' + (q.min || q.min=="" ? "min&" : "") + 'monitor='+url);

      // Change url to return to current instance when reloading (because new subscription is made)
      $("input[name=votecontinue]").prop( "checked", false );
      subscription_state = 'less';

      $.ajax({
        type: "POST",
        url: url + "/notifications/subscriptions/",
        data: sub_less,
        success: function(res){
          subscription = res;
          append_to_log("monitoring", "id", subscription);
          sse();
          if (load || exec) {
            load_testset(exec);
          }
        }
      });
    },
    error: function(a,b,c) {
      alert("This ain't no CPEE instance");
      ui_activate_tab("#tabnew");
    }
  });
}// }}}

function monitor_instance_values(val) {// {{{
  var url = $('body').attr('current-instance');
  var rep = $('body').attr('current-resources');
  var bas = $('body').attr('current-base');

  $.ajax({
    type: "GET",
    url: url + "/properties/" + val + "/",
    success: function(res){
      save[val].content(res);
      if (val == "endpoints") {
        save['endpoints_list'] = {};
        var tmp = {};
        $(res).find(" > endpoints > *").each(function(k,v) {
          save['endpoints_list'][v.localName] = v.lastChild.nodeValue;
          $.ajax({
            url: rep + encodeURIComponent($(v).text()),
            success: function() {
              tmp[v.tagName] = {};
              var deferreds = [new $.Deferred(), new $.Deferred(), new $.Deferred()];
              $.ajax({
                url: rep + encodeURIComponent($(v).text()) + "/symbol.svg",
                success: function(res) {
                  tmp[v.tagName]['symbol'] = res;
                  deferreds[0].resolve(true);
                },
                error: deferreds[0].resolve
              })
              $.ajax({
                url: rep + encodeURIComponent($(v).text()) + "/schema.rng",
                success: function(res) {
                  tmp[v.tagName]['schema'] = res;
                  deferreds[1].resolve(true);
                },
                error: deferreds[1].resolve
              })
              $.ajax({
                url: rep + encodeURIComponent($(v).text()) + "/properties.json",
                success: function(res) {
                  tmp[v.tagName]['properties'] = res;
                  deferreds[2].resolve(true);
                },
                error: deferreds[2].resolve
              })
              $.when.apply($, deferreds).then(function(x) {
                save['endpoints_cache'] = tmp;
                // when updating attributes clear the attributes, because they might change as well. New arguments are possible.
                $('#dat_details').empty();
                adaptor_update();
              });
            }
          });
        });
      } else if(val == "attributes") {
        var text = $(" > attributes > info",res).text() + " (" + url.replace(/\/$/,'').split(/[\\/]/).pop() + ")";
        $('#title').text(text);
        document.title = text;
      }
    }
  });
} // }}}

function adaptor_update() { //{{{
  $('g.element[element-endpoint]').each(function(k,ele){
    if (save['endpoints_cache'][$(ele).attr('element-endpoint')] && save['endpoints_cache'][$(ele).attr('element-endpoint')]) {
      var c = $(ele).find('g.replace');
      var symbol = save['endpoints_cache'][$(ele).attr('element-endpoint')].symbol;
      if (symbol) {
        c.replaceWith($(symbol.documentElement).clone());
      }
    }
  });
} //}}}
function adaptor_init(url,theme,dslx) { //{{{
  if (save['graph_theme'] != theme) {
    save['graph_theme'] = theme;
    save['graph_adaptor'] = new WfAdaptor($('body').data('theme-base') + '/' + theme + '/theme.js',function(graphrealization){
      manifestation.endpoints = save.endpoints_list;
      graphrealization.draw_labels = function(max,labels,shift,striped) {
        $('#graphcanvas').css('grid-row', '1/span ' + (max.row + 2));
        if (striped == true) {
          if (!$('#graphgrid').hasClass('striped')) {
            $('#graphgrid').addClass('striped');
          }
        } else {
          $('#graphgrid').removeClass('striped');
        }

        $('#graphgrid .graphlabel, #graphgrid .graphempty, #graphgrid .graphlast').remove();
        var tlabels = {};
        var tcolumns = [];
        var tcolumncount = {}
        _.each(labels,function(val){
          if (val.label != "") {
            tlabels[val.row] = [];
            _.each(val.label,function(col) {
              if (!tcolumns.includes(col.column)) {
                tcolumns.push(col.column);
                tcolumncount[col.column] = 0;
              }
              if (col.value != undefined) {
                tcolumncount[col.column] += 1;
              }
              tlabels[val.row][tcolumns.indexOf(col.column)] = { label: col.value, type: val.tname, id: val.element_id };
            });
          }
        });
        $('#graphgrid').css({
          'grid-template-rows': (shift/2) + 'px repeat(' + max.row + ', 1fr) ' + (shift/2) + 'px',
          'grid-template-columns': 'max-content' + (tcolumns.length > 0 ? ' repeat(' + tcolumns.length.toString() + ',max-content)' : '') +  ' auto'
        });
        for (var i = 0; i < max.row; i++) {
          for (var j =0; j < tcolumns.length; j++) {
            if (tlabels[i+1] != undefined && tlabels[i+1][j] != undefined && tlabels[i+1][j].label != undefined && tlabels[i+1][j].label != '') {
              var col = tlabels[i+1][j];
              var ele = $('<div class="graphlabel ' + (i % 2 == 0 ? 'odd' : 'even') + '" element-type="' + col.type + '" element-id="' + col.id + '" style="grid-column: ' + (j+2) + '; grid-row: ' + (i+2) + '"><span>' + col.label + '</span></div>');
              graphrealization.illustrator.draw.bind_event(ele,col.type,false);
              $('#graphgrid').append(ele);
            } else {
              if (tcolumncount[tcolumns[j]] != 0) {
                var ele = $('<div class="graphempty ' + (i % 2 == 0 ? 'odd' : 'even') + '" style="grid-column: ' + (j+2) + '; grid-row: ' + (i+2) + '; padding-bottom: ' + shift + 'px">&#032;</div>');
                $('#graphgrid').append(ele);
              }
            }
          }
          var j = tcolumns.length;
          var ele = $('<div class="graphlast ' + (i % 2 == 0 ? 'odd' : 'even') + '" style="grid-column: ' + (j+2) + '; grid-row: ' + (i+2) + '; padding-bottom: ' + shift + 'px">&#032;</div>');
          $('#graphgrid').append(ele);
        }
      };
      graphrealization.set_svg_container($('#graphcanvas'));
      graphrealization.set_label_container($('#graphgrid'));
      graphrealization.set_description($(dslx), true);
      graphrealization.notify = function(svgid) {
        var g = graphrealization.get_description();
        save['graph'] = $X(g);
        save['graph'].find('[xmlns]').removeAttr('xmlns');
        document.dispatchEvent(graph_changed);
        $.ajax({
          type: "PUT",
          url: url + "/properties/description/",
          contentType: 'text/xml',
          headers: {
            'Content-ID': 'description',
            'CPEE-Event-Source': myid
          },
          data: g,
          error: report_failure
        });
        adaptor_update();
        manifestation.events.click(svgid);
        format_instance_pos();
        if (manifestation.selected() == "unknown") { // nothing selected
          $('#dat_details').empty();
        }
      };
      adaptor_update();
      monitor_instance_pos();
      $('#dat_details').empty();
    });
  } else {
    save['graph_adaptor'].update(function(graphrealization){
      var svgid = manifestation.selected();
      graphrealization.set_description($(dslx));
      adaptor_update();
      manifestation.events.click(svgid);
      format_instance_pos();
    });
  }
} //}}}

function monitor_graph_change(force) { //{{{
  var url = $('body').attr('current-instance');
  $.ajax({
    type: "GET",
    url: url + "/properties/dslx/",
    success: function(dslx){
      if (force || !save['graph'] || (save['graph'] && save['graph'].serializePrettyXML() != $(dslx).serializePrettyXML())) {
        $.ajax({
          type: "GET",
          url: url + "/properties/attributes/theme/",
          success: function(res){
            adaptor_init(url,res,dslx);
          },
          error: function() {
            adaptor_init(url,'preset',dslx);
          }
        });
      }
    }
  });
} //}}}

function monitor_instance_dsl() {// {{{
  var url = $('body').attr('current-instance');
  $.ajax({
    type: "GET",
    dataType: "text",
    url: url + "/properties/dsl/",
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
  var url = $('body').attr('current-instance');
  $.ajax({
    type: "GET",
    url: url + "/properties/state/",
    dataType: "text",
    success: function(res){
      monitor_instance_state_change(res);
    }
  });
}// }}}
function monitor_instance_transformation() {// {{{
  var url = $('body').attr('current-instance');
  $.ajax({
    type: "GET",
    url: url + "/properties/attributes/modeltype",
    success: function(res){
      $("#currentmodel").text(res);
    },
    error: function() {
      $("#currentmodel").text('???');
    }
  });
}// }}}

function monitor_instance_pos() {// {{{
  var url = $('body').attr('current-instance');
  $.ajax({
    type: "GET",
    url: url + "/properties/positions/",
    success: function(res){
      save['instance_pos'] = $("positions > *",res);
      format_visual_clear();
      format_instance_pos();
    }
  });
}// }}}

function monitor_instance_running(content,event) {// {{{
  if (save['state'] == "stopping") return;
  if (event == "calling")
    format_visual_add(content.activity,"active")
  if (event == "done")
    format_visual_remove(content.activity,"active")
} // }}}
function monitor_instance_state_change(notification) { //{{{
  if ($('#trackcolumn').length > 0) {
    if (notification == "finished") {
      parent.closeIFrame(window.location.search);
    }
  }
  if (notification == "ready" || notification == "stopped" || notification == "running") {
    $("#state button").removeAttr('disabled');
  }

  // sometimes, out of sheer network routingness, stopping comes after stopped, which fucks the UI hard
  // thus, we are having none of it
  if (notification == 'stopping' && save['state'] == 'stopped')
    return;
  if (notification != save['state']) {
    save['state'] = notification;

    if (notification == "stopped") {
      monitor_instance_pos();
    }
    if (notification == "running") {
      format_visual_clear();
    }

    var but = "";
    if (notification == "ready" || notification == "stopped") {
      $('#state_extended').show();
      $("button[name=state_start]").show();
      $("button[name=state_stop]").hide();
      $("button[name=state_replay]").show();
      $("button[name=state_abandon]").show();
    } else if (notification == "running") {
      $('#state_extended').hide();
      $("button[name=state_start]").hide();
      $("button[name=state_stop]").show();
      $("button[name=state_replay]").hide();
      $("button[name=state_abandon]").hide();
    }

    // disable all input, also check themes
    format_visual_forms();
    // remove all markings with state change
    if (save['graph_adaptor'] && save['graph_adaptor'].illustrator) {
      save['graph_adaptor'].illustrator.get_elements().removeClass('marked');
    }

    if (notification == "finished" || notification == "abandoned") {
      $('.tabbehind button').hide();
      $('#state_any').hide();
    } else {
      $('#parameters .tabbehind button').show();
    }

    $("#state_text").text(notification);
  }
}   //}}}
function monitor_instance_pos_change(content) {// {{{
  if (content['unmark']) {
    $.each(content['unmark'],function(a,b){
      format_visual_remove(b.position,"passive")
    });
  }
  if (content['at']) {
    $.each(content['at'],function(a,b){
      format_visual_add(b.position,"passive")
    });
  }
  if (!content['at'] && !content['unmark'] && !content['after'] && !content['wait']) {
    monitor_instance_pos();
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
  var url = $('body').attr('current-instance');
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
  var url = $('body').attr('current-instance');
  $.ajax({
    type: "PUT",
    url: url + "/properties/state",
    data: ({value: "running"}),
    error: report_failure
  });
}// }}}
function replay_instance() {// {{{
  var url = $('body').attr('current-instance');
  $.ajax({
    type: "PUT",
    url: url + "/properties/state",
    data: ({value: "replaying"}),
    error: report_failure
  });
}// }}}
function aba_instance() {// {{{
  monitor_instance_state_change('abandoned');
  var url = $('body').attr('current-instance');
  $.ajax({
    type: "PUT",
    url: url + "/properties/state",
    data: ({value: "abandoned"}),
    error: report_failure
  });
}// }}}
function stop_instance() {// {{{
  var url = $('body').attr('current-instance');
  $.ajax({
    type: "PUT",
    url: url + "/properties/state",
    data: ({value: "stopping"}),
    error: report_failure
  });
}// }}}

function save_testsetfile() {// {{{
  var def = new $.Deferred();
  def.done(function(name,testset) {
    var ct = new Date();
    $('#savetestsetfile').attr('download',name + '_' + ct.strftime("%Y-%m-%dT%H%M%S%z") + '.xml');
    $('#savetestsetfile').attr('href','data:application/xml;charset=utf-8;base64,' + $B64(testset.serializePrettyXML()));
    document.getElementById('savetestsetfile').click();
  });
  get_testset(def);
}// }}}

function get_testset(deferred) {// {{{
  var url = $('body').attr('current-instance');
  var testset = $X('<testset/>');

  $.ajax({
    type: "GET",
    url: url + "/properties/dataelements/",
    success: function(res){
      var pars = $X('<dataelements/>');
      pars.append($(res.documentElement).children());
      testset.append(pars);
      $.ajax({
        type: "GET",
        url: url + "/properties/handlerwrapper/",
        success: function(res){
          var pars = $X('<handlerwrapper>' + res + '</handlerwrapper>');
          testset.append(pars);
          $.ajax({
            type: "GET",
            url: url + "/properties/endpoints/",
            success: function(res){
              var pars = $X('<endpoints/>');
              pars.append($(res.documentElement).children());
              testset.append(pars);
              $.ajax({
                type: "GET",
                url: url + "/properties/dslx/",
                success: function(res){
                  var pars = $X('<description/>');
                  pars.append($(res.documentElement));
                  testset.append(pars);
                  pars = $X("<transformation><description type='copy'/><dataelements type='none'/><endpoints type='none'/></transformation>");
                  testset.append(pars);
                  $.ajax({
                    type: "GET",
                    url: url + "/properties/attributes/",
                    success: function(res){
                      var name = $("attributes > info",res).text();
                      var pars = $X('<attributes/>');
                      pars.append($(res.documentElement).children());
                      pars.find('uuid').remove();
                      testset.append(pars);
                      deferred.resolve(name,testset);
                    },
                    error: function() { deferred.reject(); report_failure(); }
                  });
                },
                error: function() { deferred.reject(); report_failure(); }
              });
            },
            error: function() { deferred.reject(); report_failure(); }
          });
        },
        error: function() { deferred.reject(); report_failure(); }
      });
    },
    error: function() { deferred.reject(); report_failure(); }
  });
}// }}}
function save_svgfile() {// {{{
  var url = $('body').attr('current-instance');

  var gc = $('#graphcanvas').clone();
  $.ajax({
    type: "GET",
    url: "css/wfadaptor.css",
    success: function(res){
      gc.prepend($X('<style xmlns="http://www.w3.org/2000/svg" type="text/css"><![CDATA[' + res + ']]></style>'));
      $(window.document.styleSheets).each(function(i,x){
        if (x && x.href && x.href.match(/wfadaptor\.css$/)) {
					var varreps = {};
          $(x.cssRules).each(function(j,y){
            if (y.selectorText == ":root") {
              $(y.style).each(function(k,z) {
								varreps['var\\(' + z + '\\)'] = getComputedStyle(document.documentElement).getPropertyValue(z).toString();
							});
            }
            var loc = $(gc).find(y.selectorText.replace(/svg /g,''));
						var cst = y.style.cssText;
            for (k in varreps) {
							cst = cst.replace(new RegExp(k,'g'),varreps[k]);
						}
            loc.each(function(k,loco) {
              var sty = $(loco).attr('style') == undefined ? '' : $(loco).attr('style');
              $(loco).attr('style',cst + sty);
            });
          });
          var loc = $(gc).find('text.super');
          loc.attr('style',loc.attr('style') + ' display: none');
          var loc = $(gc).find('.stripe');
          loc.attr('style',loc.attr('style') + ' display: none');
        }
      });
      $.ajax({
        type: "GET",
        url: url + "/properties/attributes/info/",
        success: function(res){
          var name = $(res.documentElement).text();

          $('#savesvgfile').attr('download',name + '.svg');
          $('#savesvgfile').attr('href','data:application/xml;charset=utf-8;base64,' + $B64(gc.serializeXML()));
          document.getElementById('savesvgfile').click();
        },
        error: report_failure
      });
    }
  });
}// }}}
async function set_testset(testset,exec) {// {{{
  var url = $('body').attr('current-instance');
  suspended_monitoring = true;

  var promises = [];

  promises.push(
    $.ajax({
      type: "GET",
      url: url + "/notifications/subscriptions/",
      error: report_failure
    }).then(async function(res) {
      var rcount = 0;
      var values = $("subscriptions > subscription[url]",res);
      var vals = [];
      values.each(function(){
        vals.push($(this).attr('url'));
      });
      await load_testset_handlers(url,testset,vals);
    })
  )
  promises.push(load_testset_dataelements(url,testset));
  promises.push(load_testset_attributes(url,testset));
  promises.push(load_testset_endpoints(url,testset));
  promises.push(load_testset_pos(url,testset));


  if ($("testset > transformation",testset).length > 0) {
    var ser = $("testset > transformation",testset).serializeXML();
    promises.push(
      $.ajax({
        type: "PUT",
        contentType: 'text/xml',
        url: url + "/properties/transformation",
        data: ser,
        headers: {
         'Content-ID': 'transformation',
         'CPEE-Event-Source': myid
        },
        error: report_failure
      }).then(async function(){
        await load_testset_des(url,testset);
      })
    );
  } else {
    promises.push(load_testset_des(url,testset));
  }

  promises.push(load_testset_hw(url,testset));
  await Promise.all(promises);
  suspended_monitoring = false;

  $.ajax({
    type: "GET",
    url: url + "/properties/state/",
    dataType: "text",
    success: function(res){
      $.ajax({
        type: "PUT",
        url: url + "/properties/state",
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
  if (loading) return;
  loading = true;
  if (typeof window.FileReader !== 'function') {
    alert('FileReader not yet supportet');
    return;
  }
  var files = $('#testsetfile').get(0).files;
  var reader = new FileReader();
  reader.onload = function(){
    set_testset($.parseXML(reader.result),false);
    document.getElementById('fuckchrome').reset();
    loading = false;
  }
  reader.onerror = function(){ console.log('error reading file'); loading = false; }
  reader.onabort = function(){ console.log('abort reading file'); loading = false; }
  reader.readAsText(files[0]);
} //}}}
function load_testsetfile() {// {{{
  if (loading) return;
  document.getElementById('testsetfile').click();
}// }}}

function load_modelfile_after() { //{{{
  if (loading) return;
  loading = true;
  if (typeof window.FileReader !== 'function') {
    alert('FileReader not yet supportet');
    return;
  }
  var files = $('#modelfile').get(0).files;
  var reader = new FileReader();
  reader.onload = function(){
    var url = $('body').attr('current-instance');
    load_des(url,reader.result);
    loading = false;
  }
  reader.onerror = function(){ loading = false; }
  reader.onabort = function(){ loading = false; }
  reader.readAsText(files[0]);
} //}}}
function load_modelfile() {// {{{
  if (loading) return;
  document.getElementById('modelfile').click();
}// }}}

function load_testset(exec) {// {{{
  if (loading) return;
  loading = true;

  var name = $("#predefinedtestsets div.menuitem[data-selected=selected]").text();
  var url;
  if (name) {
    url = $('body').attr('current-testsets') + name + ".xml";
  } else {
    if ($('body').attr('load-testset').length > 0) {
      url = $('body').attr('load-testset');
    }
  }
  if (url) {
    $.ajax({
      cache: false,
      dataType: 'xml',
      url: url,
      success: function(res){
        save['dsl'] = null; // reload dsl and position under all circumstances
        $('#main .tabbehind button').hide();
        $('#dat_details').empty();

        document.title = "Untitled";
        set_testset(res,exec);
      },
      complete: function() {
        loading = false;
      }
    });
  }
}// }}}
function load_modeltype() {// {{{
  if (loading) return;
  var url = $('body').attr('current-instance');
  loading = true;

  var name = $("#modeltypes div.menuitem[data-selected=selected]").text();
  $.ajax({
    cache: false,
    dataType: 'xml',
    url: $('body').attr('current-testsets') + "." + name + ".xml",
    success: function(res){
      $.ajax({
        type: "PUT",
        url: url + "/properties/attributes/modeltype",
        data: ({value: name}),
        success: function(){
          set_testset(res,false);
        },
        error: report_failure
      });
    },
    complete: function() {
      loading = false;
    }
  });
}// }}}

async function load_des(url,model) { //{{{
  return $.ajax({
    type: "PUT",
    url: url + "/properties/description/",
    contentType: 'text/xml',
    headers: {
      'Content-ID': 'description',
      'CPEE-Event-Source': myid
    },
    data: model,
    error: report_failure
  });
} //}}}

async function load_testset_des(url,testset) {// {{{
  if ($("testset > description",testset).length == 0) { return; }
  var ser = $("testset > description > description",testset).serializeXML();
  return load_des(url,ser);
} // }}}
async function load_testset_hw(url,testset) {// {{{
  var promises = [];
  $("testset > handlerwrapper",testset).each(function(){
    var val = $(this).text();
    promises.push(
      $.ajax({
        type: "PUT",
        url: url + "/properties/handlerwrapper",
        data: ({value: val}),
        error: report_failure
      })
    );
  });
  return Promise.all(promises);
} // }}}
async function load_testset_dataelements(url,testset) {// {{{
  if ($("testset > dataelements",testset).length == 0) { return; }
  var ser = $("testset > dataelements",testset).serializeXML();
  return $.ajax({
    type: 'PUT',
    url: url + "/properties/dataelements",
    contentType: 'application/xml',
    headers: {
     'Content-ID': 'dataelements',
     'CPEE-Event-Source': myid
    },
    data: ser,
    error: report_failure
  });
}// }}}
async function load_testset_attributes(url,testset) {// {{{
  if ($("testset > attributes",testset).length == 0) { return; }
  var ser = $("testset > attributes",testset).serializeXML();
  return $.ajax({
    type: 'PUT',
    url: url + "/properties/attributes",
    contentType: 'application/xml',
    headers: {
     'Content-ID': 'attributes',
     'CPEE-Event-Source': myid
    },
    data: ser,
    error: report_failure
  });
}// }}}
async function load_testset_endpoints(url,testset) {// {{{
  var ser = $("testset > endpoints",testset).serializeXML();
  return $.ajax({
    type: 'PUT',
    url: url + "/properties/endpoints",
    contentType: 'application/xml',
    headers: {
     'Content-ID': 'endpoints',
     'CPEE-Event-Source': myid
    },
    data: ser,
    error: report_failure
  });
}// }}}
async function load_testset_pos(url,testset) {// {{{
  var ser = $("testset > positions",testset).serializeXML();
  return $.ajax({
    type: 'PUT',
    url: url + "/properties/positions",
    contentType: 'application/xml',
    headers: {
     'Content-ID': 'positions',
     'CPEE-Event-Source': myid
    },
    data: ser,
    error: report_failure
  });
}// }}}
async function load_testset_handlers(url,testset,vals) {// {{{
  var promises = [];
  $("testset > handlers > *",testset).each(async function(){
    var han = this;
    var suburl = $(han).attr('url');
    if ($.inArray(suburl,vals) == -1) {
      var inp = "url="+encodeURIComponent(suburl).replace(/~/,'%7E');
      $("*",han).each(function(){
        inp += "&topic=" + $(this).attr('topic');
        inp += "&" + this.nodeName + "=" + $(this).text();
      });
      promises.push(
        $.ajax({
          type: "POST",
          url: url + "/notifications/subscriptions/",
          data: inp
        })
      )
    }
  });
  return Promise.all(promises);
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

function scroll_into_view(what) { //{{{
  var tcontainer = $('#graphcanvas').parent()[0];
  if ($('g[element-id="' + what + '"]').length > 0) {
    var telement   = $('g[element-id="' + what + '"]')[0].getBBox().y;
    if (tcontainer.scrollTop > telement) {
      tcontainer.scroll( { top: telement - 5, behavior: 'smooth' } );
    }
    if (tcontainer.scrollTop + tcontainer.offsetHeight - 40  < telement) {
      tcontainer.scroll( { top: telement - tcontainer.offsetHeight + 40, behavior: 'smooth' } );
    }
  }
} //}}}

function format_visual_set(what) {//{{{
  if (node_state[what] != undefined) {
    if (node_state[what]['vote'] == undefined) node_state[what]['vote'] = 0;
    if (node_state[what]['active'] == undefined) node_state[what]['active'] = 0;
    if (node_state[what]['passive'] == undefined) node_state[what]['passive'] = 0;

    var votes = node_state[what]['vote'];
    var actives = node_state[what]['active'];
    var passives = node_state[what]['passive'];

    scroll_into_view(what);

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
  $('.super .active').each(function(a,b){b.setAttribute('class','active');});
  $('.super .passive').each(function(a,b){b.setAttribute('class','passive');});
  $('.super .vote').each(function(a,b){b.setAttribute('class','vote');});
  $('.super .colon').each(function(a,b){b.setAttribute('class','colon');});
  $('.activities').each(function(a,b){
    if (b.hasAttribute('selected')) {
      b.setAttribute('class','activities selected');
    } else {
      b.setAttribute('class','activities');
    }
  });
  $('#votes').empty();
}//}}}
function format_visual_vote_clear() {//{{{
  node_state = {};
  $('.super .vote').each(function(a,b){b.setAttribute("class","vote");});
  $("#votes").empty();
 }//}}}

function format_instance_pos() { //{{{
  $(save['instance_pos']).each(function(){
    var what = this.nodeName;
    format_visual_add(what,save['state'] == 'running' ? 'active' : 'passive');
  });
} //}}}

function format_visual_forms() { //{{{
  if (save['state'] != "ready" && save['state'] != "stopped") {
    $(paths).each(function(k,e){
      if ($(e).attr('contenteditable')) { $(e).attr('contenteditable','false'); }
      $(e).attr('disabled','disable');
    });
  } else {
    $(paths).each(function(k,e){
      if ($(e).attr('contenteditable')) { $(e).attr('contenteditable','true'); }
      $(e).removeAttr('disabled');
    });
  }
} //}}}

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

function ui_pos(e,bl) {
  var url = $('body').attr('current-instance');
  var coll = [];
  $('g.element.primitive > g.activities.active, g.element.primitive > g.activities.passive').each(function(a,b){
    coll.push($(b).parent().attr('element-id'));
  });
  coll = bl(coll);
  var vals = "";
  $(coll).each(function(k,ele){
    vals += "<" + ele + ">at</"  + ele + ">";
  });
  vals = "<positions xmlns='http://cpee.org/ns/properties/2.0'>" + vals + "</positions>";
  $.ajax({
    type: "PUT",
    url: url + "/properties/positions/",
    contentType: 'application/xml',
    headers: {
     'Content-ID': 'positions',
     'CPEE-Event-Source': myid
    },
    data: vals,
    success: monitor_instance_pos,
    error: report_failure
  });
}
function del_ui_pos(e) {
  ui_pos(e,function(coll){
    coll.splice(coll.indexOf($(e).attr('id')),1);
    return coll;
  });
}
function add_ui_pos(e) {
  ui_pos(e,function(coll){
    coll.push($(e).attr('id'));
    return coll;
  });
}
