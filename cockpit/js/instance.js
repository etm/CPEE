var es;
var suspended_redrawing = false;
var skip_location = false;
var myid = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
var paths = '#dat_details input, #dat_details textarea, #dat_details select, #dat_details button, #dat_details [contenteditable], #dat_dataelements input, #dat_dataelements textarea, #dat_dataelements select, #dat_dataelements button, #dat_dataelements [contenteditable], #dat_endpoints input, #dat_endpoints textarea, #dat_endpoints select, #dat_endpoints button, #dat_endpoints [contenteditable], #dat_attributes input, #dat_attributes textarea, #dat_attributes select, #dat_attributes button, #dat_attributes [contenteditable]';
var loading = false;
var subscription;
var subscription_state = 'less';
var graph_changed = new Event("graph:changed", {"bubbles":true, "cancelable":false});
var model_loaded = new Event("model:loaded", {"bubbles":true, "cancelable":false});
var save = {};
    save['endpoints'] = undefined;
    save['dataelements'] = undefined;
    save['attributes'] = undefined;
var node_state = {};

function global_init() {
  suspended_redrawing = false;
  loading = false;
  subscription = undefined;
  subscription_state = 'less';
  save['states']= {};
  save['state']= undefined;
  save['dsl'] = undefined;
  save['activity_red_states'] = {}
  save['activity_blue_states'] = {}
  save['graph'] = undefined;
  save['graph_theme'] = undefined;
  save['graph_adaptor'] = undefined;
  save['endpoints_cache'] = {};
  save['endpoints_list'] = {};
  save['details'] = undefined;
  save['details_target'] = undefined;
  save['instance_pos'] = [];
  save['modeltype'] = 'CPEE';
  save['modifiers'] = {};
  save['modifiers_active'] = {};
  save['modifiers_additional'] = {};
  save['resources'] = undefined;
  node_state = {};
}

global_init();

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
               'topic'  + '=' + 'executionhandler' + '&' +
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
               'topic'  + '=' + 'executionhandler' + '&' +
               'events' + '=' + 'error,change' + '&' +
               'topic'  + '=' + 'handlers' + '&' +
               'events' + '=' + 'change';// }}}

function cockpit() { //{{{
  $("button[name=base]").click(function(){ create_instance($("input[name=base-url]").val(),null,false,false); });
  $("button[name=instance]").click(function(){ uidash_activate_tab("#tabinstance"); monitor_instance($("input[name=instance-url]").val(),$("input[name=res-url]").val(),false,false); });
  $("button[name=loadtestset]").click(function(e){new CustomMenu(e).menu($('#templates'),function(){ load_testset(false) } ); });
  $("button[name=loadtestsetfile]").click(load_testsetfile);
  $("button[name=loadmodelfile]").click(load_modelfile);
  $("button[name=loadmodeltype]").click(function(e){new CustomMenu(e).menu($('#modeltypes'),load_modeltype, $("button[name=loadmodeltype]")); });
  $("button[name=savetestsetfile]").click(function(){ save_testsetfile(); });
  $("button[name=savesvgfile]").click(function(){ save_svgfile(); });
  $("button[name=state_start]").click(function(){ $(this).parent().find('button').attr("disabled","disabled");start_instance(); });
  $("button[name=state_stop]").click(function(){ $(this).parent().find('button').attr("disabled","disabled");stop_instance(); });
  $("button[name=state_abandon]").click(function(){ aba_instance(); });
  $("input[name=votecontinue]").click(check_subscription);
  $("input[name=testsetfile]").change(load_testsetfile_after);
  $("input[name=modelfile]").change(load_modelfile_after);
  $("#modifiers").on('change','div.select select',function(e){ modifiers_update(e); });

  $.ajax({
    url: $('body').attr('current-templates'),
    dataType: 'json',
    success: function(res){
      $(res).each(function(){
        if (this.type == 'file') {
          $('#templates').append($("<div class='menuitem'></div>").text(this.name.replace(/\.xml/,'')));
        }
      });
    },
    error: function() {
      $("button[name=loadtestset]").attr('disabled','disabled');
    },
    complete: function() {
      var q = $.parseQuerySimple();
      if (q.min || q.min == "") {
        uidash_toggle_vis_tab($('#instance'));
        uidash_toggle_vis_tab($('#parameters'));
      }
      if (q.monitor && q.load) {
        if (q.load.match(/https?:\/\//)) {
          $('body').attr('load-testset',q.load);
        } else {
          $("#templates div.menuitem").each(function(k,v){
            if ($(v).text() == q.load) { $(v).attr('data-selected','selected'); }
          });
        }
        uidash_activate_tab("#tabexecution");
        monitor_instance(q.monitor,$("body").attr('current-resources'),true,false);
      } else if (q.load) {
        if (q.load.match(/https?:\/\//)) {
          $('body').attr('load-testset',q.load);
        } else {
          $("#templates div.menuitem").each(function(k,v){
            if ($(v).text() == q.load) { $(v).attr('data-selected','selected'); }
          });
        }
        uidash_activate_tab("#tabexecution");
        create_instance($("body").attr('current-base'),q.load,true,false);
      } else if (q.instantiate) {
        if (q.instantiate.match(/https?:\/\//)) {
          uidash_activate_tab("#tabexecution");
          create_instance_from($("body").attr('current-base'),q.instantiate,false);
        } else {
          alert('Nope. Url!');
        }
      } else if (q.new || q.new == "") {
        uidash_activate_tab("#tabinstance");
        create_instance($("body").attr('current-base'),"Plain Instance",false,false);
      } else if (q.monitor) {
        uidash_activate_tab("#tabinstance");
        monitor_instance(q.monitor,$("body").attr('current-resources'),false,false);
      } else if (q.exec) {
        if (q.exec.match(/https?:\/\//)) {
          $('body').attr('load-testset',q.load);
        } else {
          $("#templates div.menuitem").each(function(k,v){
            if ($(v).text() == q.exec) { $(v).attr('data-selected','selected'); }
          });
        }
        uidash_activate_tab("#tabexecution");
        create_instance($("body").attr('current-base'),q.exec,true,true);
      }
    }
  });
  $.ajax({
    url: "transformations.xml",
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
      url: url + "/notifications/subscriptions/" + subscription + '/',
      data: sub_more
    });
    subscription_state = 'more';
  }
  if (num == 0 && subscription_state == 'more') {
    $.ajax({
      type: "PUT",
      url: url + "/notifications/subscriptions/" + subscription + '/',
      data: sub_less
    });
    subscription_state = 'less';
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

async function sse() { //{{{
  var url = $('body').attr('current-instance');
  if (subscription) {
    es = new EventSource(url + "/notifications/subscriptions/" + subscription + "/sse/");
    es.onopen = function() {
      append_to_log("monitoring", "opened", "nice.");
    };
    es.onmessage = async function(e) {
      data = JSON.parse(e.data);
      if (data['type'] == 'event') {
        switch(data['topic']) {
          case 'dataelements':
            monitor_instance_values("dataelements",data.content.values);
            break;
          case 'description':
            monitor_instance_dsl();
            break;
          case 'endpoints':
            monitor_instance_values("endpoints");
            break;
          case 'attributes':
            if (save['resources'] !=  data.content.values.resource) {
              await monitor_instance_values("attributes");
              monitor_instance_values("endpoints");
            } else {
              monitor_instance_values("attributes");
            }
            if (save['graph_theme'] != data.content.values.theme) {
              monitor_graph_change(true);
            }
            break;
          case 'task':
            if ($('#trackcolumn').length > 0) {
              $('#trackcolumn').append($('<iframe src="track.html?monitor=' + data.content.received['CPEE-INSTANCE-URL'].replace(/\/*$/,'/') + '"></iframe>'));
              $('#graphcolumn').addClass('resize');
            }
            break;
          case 'state':
            save['states'][data['content']['state']] = Date.parse(data.timestamp);
            monitor_instance_state_change(data['content']['state']);
            break;
          case 'position':
            monitor_instance_pos_change(data['content']);
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
      append_to_log("monitoring", "closed", "finished or abandoned or not existing or server down. one of these, i assume.");
      // setTimeout(sse,10000);
    };
  }
  await monitor_instance_values("attributes"); // attributes first, to catch the <resources> attribute which overrides current-resources
  monitor_instance_values("dataelements");
  monitor_instance_values("endpoints");
  monitor_instance_dsl();
  monitor_instance_state();
} //}}}

function monitor_instance(cin,rep,load,exec) {// {{{
  global_init();
  format_visual_clear();
  format_visual_vote_clear();

  $("body").attr('current-instance',sanitize_url(cin));
  $("body").attr('current-resources',sanitize_url(rep));

  $("input[name=instance-url]").val($("body").attr('current-instance'));
  $("input[name=res-url]").val($("body").attr('current-resources'));

  $('#parameters ui-content ui-area > button').attr('disabled','disabled');
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
      $("#current-instance").show();
      $("#current-instance").text(url.match(/(\d+)\/?$/)[1]);
      $("#current-instance").attr('href',url);
      $("#current-instance-properties").show();
      $("#current-instance-properties").attr('href',url + 'properties/');
      $("#current-instance-subscriptions").show();
      $("#current-instance-subscriptions").attr('href',url + 'notifications/subscriptions/');
      $("#current-instance-callbacks").show();
      $("#current-instance-callbacks").attr('href',url + 'callbacks/');
      $("#current-monitor").show();
      $("#current-monitor").attr('href','edit.html?monitor=' + url);
      $("#current-graph").show();
      $("#current-graph").attr('href','graph.html?monitor=' + url);
      $("#current-track").show();
      $("#current-track").attr('href','track.html?monitor=' + url);
      var q = $.parseQuerySimple();
      history.replaceState({}, '', '?' + (q.min || q.min=="" ? "min&" : "") + 'monitor='+url);

      // Change url to return to current instance when reloading (because new subscription is made)
      $("input[name=votecontinue]").prop( "checked", false );

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
        },
        error: function() {
          subscription = undefined;
          append_to_log("monitoring", "closed", "For Good.");
          sse();
        }
      });
    },
    error: function(a,b,c) {
      alert("This ain't no CPEE instance");
      uidash_activate_tab("#tabnew");
    }
  });
}// }}}

function get_resource(base, key, loc, cache) {
  cache[key] = {};
  let deferreds = [new $.Deferred(), new $.Deferred(), new $.Deferred()];
  $.ajax({
    url: base + 'endpoints/' + encodeURIComponent(loc) + "/symbol.svg",
    success: function(res) {
      cache[key]['symbol'] = res;
      deferreds[0].resolve(true);
    },
    error: deferreds[0].resolve
  })
  $.ajax({
    url: base + 'endpoints/' + encodeURIComponent(loc) + "/schema.rng",
    success: function(res) {
      cache[key]['schema'] = res;
      deferreds[1].resolve(true);
    },
    error: deferreds[1].resolve
  })
  $.ajax({
    url: base + 'endpoints/' + encodeURIComponent(loc) + "/properties.json",
    success: function(res) {
      cache[key]['properties'] = res;
      deferreds[2].resolve(true);
    },
    error: deferreds[2].resolve
  })
  return deferreds;
}

function monitor_instance_values(type,vals) {// {{{
  if (type == "dataelements" && save['state'] == "running") {
    let de = save[type].save();
    Object.entries(vals).forEach(([key,value]) => {
      let entry = $(de).find(' > dataelements > ' + key);
      if (entry.length > 0) {
        if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
          entry.text(value)
        } else {
          entry.text(JSON.stringify(value))
        }
      } else {
        let ele = $X('<' + key + ' xmlns="http://cpee.org/ns/properties/2.0"/>')
        if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
          $(ele).text(value)
        } else {
          $(ele).text(JSON.stringify(value))
        }
        $(de).find(' > dataelements').append(ele)
      }
    });
    save[type].content(de);
  } else {
    let url = $('body').attr('current-instance');
    return $.ajax({
      type: "GET",
      url: url + "/properties/" + type + "/",
      success: function(res){
        save[type].content(res);
        if (type == "endpoints") {
          save['endpoints_list'] = {};
          var tmp = {};
          $(res).find(" > endpoints > *").each(function(k,v) {
            save['endpoints_list'][v.localName] = v.lastChild.nodeValue;
            let rep = $('body').attr('current-resources');
            $.ajax({
              url: rep + 'endpoints/' + encodeURIComponent($(v).text()),
              success: function() {
                tmp[v.tagName] = {};
                $.when.apply($, get_resource(rep,v.tagName,$(v).text(),tmp)).then(function(x) {
                  save['endpoints_cache'] = tmp;
                  // when updating attributes clear the attributes, because they might change as well. New arguments are possible.
                  $('#dat_details').empty();
                  adaptor_update();
                });
              }
            });
            if (save['resources']) {
              let rep = save['resources'];
              $.ajax({
                url: rep + 'endpoints/' + encodeURIComponent(encodeURIComponent($(v).text())),
                success: function() {
                  tmp[v.tagName] = {};
                  $.when.apply($, get_resource(rep,v.tagName,encodeURIComponent($(v).text()),tmp)).then(function(x) {
                    save['endpoints_cache'] = tmp;
                    // when updating attributes clear the attributes, because they might change as well. New arguments are possible.
                    $('#dat_details').empty();
                    adaptor_update();
                  });
                }
              });
            }
          });
        } else if(type == "attributes") {
          if ($(" > attributes > resources",res).length > 0) {
            save['resources'] = $(" > attributes > resources",res).text();
          } else {
            save['resources'] = undefined;
          }
          if ($(" > attributes > modeltype",res).length > 0) {
            save['modeltype'] = $(" > attributes > modeltype",res).text();
          } else {
            save['modeltype'] = undefined;
          }
          if ($('#modifiers').length > 0) {
            if ($('#modifiers > div').length == 0) {
              modifiers_display().then(function(){ modifiers_select(); });
            } else {
              modifiers_select();
            }
          }
          var text = $(" > attributes > info",res).text() + " (" + url.replace(/\/$/,'').split(/[\\/]/).pop() + ")";
          $('#title').text(text);
          document.title = text;
          if ($('body').attr('current-save')) {
            $('body').attr('current-save-dir',$(" > attributes > design_dir",res).text());
          }
          if ($('body').attr('current-logs')) {
            var uuid = $(" > attributes > uuid",res).text();
            $("#current-log").show();
            $("#shifted-log").show();
            $("#current-log").attr('href',$('body').attr('current-logs') + uuid + '.xes.yaml');
            $("#shifted-log").attr('href',$('body').attr('current-logs') + uuid + '.xes.shift.yaml');
            if ($("#current-log").text() == '') {
              $("#current-log").text(uuid + '.xes.yaml');
            }
            if ($("#shifted-log").text() == '') {
              $("#shifted-log").text(uuid + '.xes.shift.yaml');
            }
          }
        }
      }
    });
  }
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
  // while inside and svgs are reloaded, do nothing here
  if (suspended_redrawing) { return; }
  if (save['graph_theme'] != theme) {
    // while inside and svgs are reloaded, do nothing here
    suspended_redrawing = true;
    save['graph_theme'] = theme;
    save['graph_adaptor'] = new WfAdaptor($('body').data('theme-base') + '/' + theme + '/theme.js',function(graphrealization){
      manifestation.endpoints = save.endpoints_list;
      graphrealization.draw_labels = function(max,labels,dimensions,striped) {
        $('#graphcanvas').css('grid-row', '1/span ' + (max.row + 2));
        if (striped == true) {
          if (!$('#graphgrid').hasClass('striped')) {
            $('#graphgrid').addClass('striped');
          }
        } else {
          $('#graphgrid').removeClass('striped');
        }

        $('.labelsrow, #graphgrid .graphlast').remove();
        let tcolumns = [];
        let tcolumntype = {};
        let tcolumncount = {}

        const mapPoints = new Map();
        const tcolumnsvgs = {};
        const iconsize = 10;
        const space = 5;

        const mapPointsBodSod = new Map();

        _.each(labels,function(val){
          if (val.label != "") {
            _.each(val.label,function(col) {
              if (!tcolumns.includes(col.column)) {
                tcolumns.push(col.column);
                tcolumncount[col.column] = 0;
                tcolumnsvgs[col.column] = {};
              }
              if (tcolumntype[col.column] == undefined && col.type != undefined) {
                tcolumntype[col.column] = col.type;
              }
              if (col.value != undefined) {
                let pos = dimensions.height_shift/2 + dimensions.height * (val.row - 1) + (dimensions.height / 2);
                let firstpos = dimensions.height_shift/2 + (dimensions.height / 2);

                if (col.type == "resource") {
                  for (const [k, v] of Object.entries(col.value)) {
                    var p = { AR: v };
                    if (!mapPoints.has(k)) {
                      p.y0 = p.y0 == undefined ? pos : p.y0;
                      p.ymax = (p.ymax == undefined) ? p.y0 : p.ymax;
                    } else {
                      p.y0 = mapPoints.get(k).y0;
                      p.ymax = mapPoints.get(k).ymax;
                    }
                    mapPoints.set(k, p);
                  }

                  let tsvg = $X('<g xmlns="http://www.w3.org/2000/svg" class="resource-row" element-row="' + (val.row-1) + '"></g>');

                  var cx = space;
                  var count = 0;
                  for (const [k, p] of mapPoints) {
                    let firstAssignFlag = false;
                    p.x = cx;

                    // Including Triangle
                    if (k in col.value) {   // Define points for a triangle pointing to the right
                      let inner;

                      if (p.AR == "Read") {
                        inner = $X('<polygon xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" points="' + (p.x) + ',' + pos + ' ' + (p.x + iconsize) + ',' + (pos + iconsize/2) + ' ' + (p.x + iconsize) + ',' + (pos - iconsize/2) + '" class="resource-point read"></polygon>');
                        if (pos == p.y0) { firstAssignFlag = true; }
                      } else if (p.AR == "Assign") {    // Define points for a triangle pointing to the left
                        inner = $X('<polygon xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" points="' + (p.x + iconsize) + ',' + pos + ' ' + (p.x) + ',' + (pos + iconsize/2) + ' ' + (p.x) + ',' + (pos - iconsize/2) + '" class="resource-point write"></polygon>');
                      } else if (p.AR == "AssignRead") {
                        inner = $X('<circle xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" cx="' + (p.x + iconsize/2) + '" cy="' + pos + '" r="' + (iconsize / 2) + '" class="resource-point both"></circle>');
                      } else if (p.AR == "ReadAssign") {
                        inner = $X('<circle xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" cx="' + (p.x + iconsize/2) + '" cy="' + pos + '" r="' + (iconsize / 2) + '" class="resource-point both"></circle>');
                        if (pos == p.y0) { firstAssignFlag = true; }
                      }

                      // extend the bars
                      if (pos > p.ymax) {
                        p.ymax = pos;
                      }

                      inner.append($X('<text xmlns="http://www.w3.org/2000/svg"></text>').text(k));
                      tsvg.append(inner);
                    }

                    if (firstAssignFlag) {
                      // Additional logic and construction of another polygon for orange triangle pointing left in row 0
                      p.y0 -= (val.row-1) * dimensions.height;
                      if (tcolumnsvgs[col.column][1] == undefined) {
                        tcolumnsvgs[col.column][1] = $X('<g xmlns="http://www.w3.org/2000/svg" class="resource-row" element-row="' + 0 + '"></g>');
                      }
                      tcolumnsvgs[col.column][1].append($X('<polygon xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" points="' + (p.x + iconsize) + ',' + firstpos + ' ' + (p.x) + ',' + (firstpos + iconsize/2) + ' ' + (p.x) + ',' + (firstpos - iconsize/2) + '" class="resource-point write"></polygon>').append($X('<text xmlns="http://www.w3.org/2000/svg"></text>').text(k)));
                    }
                    cx += iconsize + space;
                    count += 1;
                  }

                  if (tsvg.children().length > 0) {
                    tcolumnsvgs[col.column][val.row] = tsvg;
                  }

                //BODSOD Visualization
                }else if (col.type == "bodsod") {
                  for (const [k, v] of Object.entries(col.value)) {
                    var p = { AR: v };
                    if (!mapPointsBodSod.has(k)) {
                      p.y0 = p.y0 == undefined ? pos : p.y0;
                      p.ymax = (p.ymax == undefined) ? p.y0 : p.ymax;
                    } else {
                      p.y0 = mapPointsBodSod.get(k).y0;
                      p.ymax = mapPointsBodSod.get(k).ymax;
                    }
                    mapPointsBodSod.set(k, p);
                  }

                  let tsvg = $X('<g xmlns="http://www.w3.org/2000/svg" class="resource-row" element-row="' + (val.row-1) + '"></g>');

                  var cx = space;
                  var count = 0;
                  for (const [k, p] of mapPointsBodSod) {
                    p.x = cx;

                    // Including Triangle
                    if (k in col.value) {   // Define points for a triangle pointing to the right
                      let inner;
                      if (p.AR == "AssignRead") {
                        p.yc = dimensions.height_shift/2 + dimensions.height * val.row - 20;
                        if($(save['graph_adaptor'].get_description()).find('> concern[id="'+k+'"]')[0]){
                          type = $(save['graph_adaptor'].get_description()).find('> concern[id="'+k+'"]')[0].attributes["type"].value
                          if(type == 'No constraint') {
                            inner = $X('<circle xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" cx="' + (p.x + iconsize/2) + '" cy="' + pos + '" r="' + (iconsize / 2) + '" class="bodsod-point none"></circle>');
                          }else if (type == 'BOD'){
                            inner = $X('<circle xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" cx="' + (p.x + iconsize/2) + '" cy="' + pos + '" r="' + (iconsize / 2) + '" class="bodsod-point bod"></circle>');
                          }else {
                            inner = $X('<circle xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" cx="' + (p.x + iconsize/2) + '" cy="' + pos + '" r="' + (iconsize / 2) + '" class="bodsod-point sod"></circle>');
                          }
                        }
                      }

                      // extend the bars
                      if (pos > p.ymax) {
                        p.ymax = pos;
                      }

                      inner.append($X('<text xmlns="http://www.w3.org/2000/svg"></text>').text(k));
                      tsvg.append(inner);
                    }
                    cx += iconsize + space;
                    count += 1
                  }

                  if (tsvg.children().length > 0) {
                    tcolumnsvgs[col.column][val.row] = tsvg;
                  }

                //END BODSOD Visualization
                } else {
                  tsvg = $X('<text class="label" element-id="' + val.element_id + '" x="' + space + '" y="' + (dimensions.height * val.row - dimensions.height_shift) + '" xmlns="http://www.w3.org/2000/svg"></text>')
                  tsvg.text(col.value);
                  tsvg.mouseover(function(ev){ manifestation.events.mouseover($(ev.currentTarget).attr('element-id')); });
                  tsvg.mouseout(function(ev){ manifestation.events.mouseout($(ev.currentTarget).attr('element-id')); });
                  tsvg.click(function(ev){ manifestation.events.click($(ev.currentTarget).attr('element-id')); });
                  tcolumnsvgs[col.column][val.row] = tsvg;
                }

                tcolumncount[col.column] += 1;
              }
            });
          }
        });

        $('#graphgrid').css({
          'grid-template-rows': (dimensions.height_shift/2) + 'px repeat(' + max.row + ', 1fr) ' + (dimensions.height_shift/2) + 'px',
          'grid-template-columns': 'max-content' + (tcolumns.length > 0 ? ' repeat(' + tcolumns.length.toString() + ',max-content)' : '') + ' auto'
        });

        tcolumns.forEach(h => {
          if (Object.keys(tcolumnsvgs[h]).length > 0) {
            const svgcolumn = $X('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:x="http://www.w3.org/1999/xlink" class="labelsrow"></svg>');
            const svgback = $X('<g xmlns="http://www.w3.org/2000/svg"></g>');
            const svgfront = $X('<g xmlns="http://www.w3.org/2000/svg"></g>');
            let xwidth = 0;
            svgcolumn.append(svgback);
            svgcolumn.append(svgfront);
            svgcolumn.css('grid-row', '1/span ' + (max.row + 2))
            svgcolumn.css('grid-column', tcolumns.indexOf(tcolumns.first) + 2);
            svgcolumn.attr('height', $('#graphcanvas').attr('height'));
            $('#graphgrid').append(svgcolumn);

            for (var i = 0; i < max.row; i++) {
              let node = svgfront.append($(tcolumnsvgs[h][i+1]));
              if (xwidth < node[0].getBBox().width) { xwidth = node[0].getBBox().width; }
            }
            xwidth = xwidth + 2 * space;
            if (striped == true) {
              for (var i = 0; i < max.row; i++) {
                svgback.append($X('<rect xmlns="http://www.w3.org/2000/svg" element-row="' + i + '" class="stripe ' +  (i % 2 == 0 ? 'even' : 'odd') + '" x="0" y="' + (dimensions.height * i + dimensions.height_shift/2) + '" width="' + (xwidth + 1) + '" height="' + dimensions.height + '"></rect>'));
                svgback.append($X('<rect xmlns="http://www.w3.org/2000/svg" element-row="' + i + '" class="border" x="0" y="' + (dimensions.height * i + dimensions.height_shift/2) + '" height="' + dimensions.height + '" width="1"></rect>'));
              }
            }
            if (tcolumntype[h] == 'resource') {
              let count = 0;
              for (const [k, p] of mapPoints) {
                svgback.append($X('<line xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" x1="' + (p.x + iconsize/2) + '" y1="' + p.y0 + '" x2="' + (p.x + iconsize/2) + '" y2="' + (p.ymax + 0.01) + '" class="' + tcolumntype[h] + '-column" stroke-width="' + iconsize + '"><text>' + k + '</text></line>'));
                count += 1;
              }
            //BODSOD Line Generation
            } else if (tcolumntype[h] == 'bodsod'){
              let count = 0;
              for (const [k, p] of mapPointsBodSod) {
                if($(save['graph_adaptor'].get_description()).find('> concern[id="'+k+'"]')[0]){
                  type = $(save['graph_adaptor'].get_description()).find('> concern[id="'+k+'"]')[0].attributes["type"].value
                  text = k+": "+$(save['graph_adaptor'].get_description()).find('> concern[id="'+k+'"]')[0].attributes["name"].value+" ("+$(save['graph_adaptor'].get_description()).find('> concern[id="'+k+'"]')[0].attributes["role"].value+") "+" ["+$(save['graph_adaptor'].get_description()).find('> concern[id="'+k+'"]')[0].attributes["type"].value+"]"
                  if(type == 'No constraint') {
                    svgback.append($X('<line xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" x1="' + (p.x + iconsize/2) + '" y1="' + p.y0 + '" x2="' + (p.x + iconsize/2) + '" y2="' + (p.ymax + 0.01) + '" class="' + tcolumntype[h] + '-column none" stroke-width="' + iconsize + '"><text>' + text + '</text></line>'));
                  }else if (type == 'BOD'){
                    svgback.append($X('<line xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" x1="' + (p.x + iconsize/2) + '" y1="' + p.y0 + '" x2="' + (p.x + iconsize/2) + '" y2="' + (p.ymax + 0.01) + '" class="' + tcolumntype[h] + '-column bod" stroke-width="' + iconsize + '"><text>' + text + '</text></line>'));
                  }else {
                    svgback.append($X('<line xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" x1="' + (p.x + iconsize/2) + '" y1="' + p.y0 + '" x2="' + (p.x + iconsize/2) + '" y2="' + (p.ymax + 0.01) + '" class="' + tcolumntype[h] + '-column sod" stroke-width="' + iconsize + '"><text>' + text + '</text></line>'));
                  }
                  count += 1;
                }
              }
            }
            //END BODSOD Line Generation

            $('.resource-label').hide();  // Speech Bubble hide by default

            svgcolumn.attr('width', xwidth);
          }
        });

        // Add the last stripe
        var j = tcolumns.length;
        for (var i = 0; i < max.row; i++) {
          var ele = $('<div element-row="' + i + '" class="graphlast ' + (i % 2 == 0 ? 'odd' : 'even') + '" style="grid-column: ' + (j+2) + '; grid-row: ' + (i+2) + '; padding-bottom: ' + dimensions.height_shift + 'px">&#032;</div>');
          $('#graphgrid').append(ele);
        }
      };
      graphrealization.set_svg_container($('#graphcanvas'));
      graphrealization.set_label_container($('#graphgrid'));
      graphrealization.set_description($(dslx), true);
      graphrealization.notify = function(svgid) {
        var g = graphrealization.get_description();
        save['graph'] = $X(g);
        save['graph'].removeAttr('svg-id');
        save['graph'].removeAttr('svg-type');
        save['graph'].removeAttr('svg-subtype');
        save['graph'].removeAttr('svg-label');
        document.dispatchEvent(graph_changed);
        if (save['modeltype'] != 'CPEE') {
          $.ajax({
            type: "PUT",
            url: url + "/properties/attributes/modeltype/",
            data: {'value': 'CPEE'},
            error: report_failure
          });
          $.ajax({
            type: "PUT",
            url: url + "/properties/transformation/",
            contentType: 'text/xml',
            headers: {
              'Content-ID': 'transformation',
              'CPEE-Event-Source': myid
            },
            data: '<transformation xmlns="http://cpee.org/ns/properties/2.0"><description type="copy"/><dataelements type="none"/><endpoints type="none"/></transformation>',
            success: function() {
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
            },
            error: report_failure
          });
        } else {
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
        }
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

      // while inside and svgs are reloaded, do nothing here
      suspended_redrawing = false;
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
      if (force || !save['graph'] || (save['graph'] && save['graph'].serializePrettyXML() != $(dslx.documentElement).serializePrettyXML())) {
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
  if (event == "calling") {
    if (!save['activity_red_states'][content['activity-uuid']]) {
      save['activity_red_states'][content['activity-uuid']] = true
      format_visual_add(content.activity,"active")
    }
  } else if (event == "manipulating") {
    if (!save['activity_red_states'][content['activity-uuid']]) {
      save['activity_red_states'][content['activity-uuid']] = true
      format_visual_add(content.activity,"active")
    }
  } else if (event == "done") {
    if (save['activity_red_states'][content['activity-uuid']]) {
      format_visual_remove(content.activity,"active");
    }
    save['activity_red_states'][content['activity-uuid']] = true
    setTimeout(() => {delete save['activity_red_states'][content['activity-uuid']]},5000);
  }
} // }}}
function monitor_instance_pos_change(content) {// {{{
  if (content['at']) {
    $.each(content['at'],function(a,b){
      if (!save['activity_blue_states'][b.uuid]) {
        save['activity_blue_states'][b.uuid] = true
        format_visual_add(b.position,"passive");
      }
    });
  }
  if (content['after']) {
    $.each(content['after'],function(a,b){
      if (!save['activity_blue_states'][b.uuid]) {
        save['activity_blue_states'][b.uuid] = true
        format_visual_add(b.position,"passive");
      }
    });
  }
  if (content['unmark']) {
    $.each(content['unmark'],function(a,b){
      if (save['activity_blue_states'][b.uuid]) {
        format_visual_remove(b.position,"passive")
      }
      save['activity_blue_states'][b.uuid] = true
      setTimeout(() => {delete save['activity_blue_states'][b.uuid]},5000);
    });
  }
  if (!content['at'] && !content['unmark'] && !content['after'] && !content['wait']) {
    monitor_instance_pos();
  }
} // }}}


function monitor_instance_state_change(notification) { //{{{
  // sometimes, out of sheer network routingness, stopping comes after stopped, which fucks the UI hard
  // thus, we are having none of it
  if (notification == 'stopping' && save['states']['stopping'] - save['states']['stopped'] < 10)
    notification = 'stopped';
  if (notification == 'stopping' && save['state'] == 'stopped')
    return;

  if ($('#trackcolumn').length > 0) {
    if (notification == "finished" || notification == "abandoned") {
      parent.closeIFrame(window.location.search);
    }
  }
  if (notification == "ready" || notification == "stopped" || notification == "running") {
    $("#state button").removeAttr('disabled');
  }

  if (notification != save['state']) {
    save['state'] = notification;

    if (notification == "stopped") {
      monitor_instance_pos();
    }
    if (notification == "running") {
      // // we cant do that, because the events might not be ordered. so jus remove all the blue ones.
      // format_visual_clear();

      for (const [key, ele] of Object.entries(node_state)) {
        for (i=0; i<ele.passive; i++) {
          format_visual_remove(key,'passive');
        }
      }
      // save_blue_states has to be left alone, because we dont know the uuid
    }

    var but = "";
    if (notification == "ready" || notification == "stopped") {
      $('#state_extended').show();
      $("button[name=state_start]").show();
      $("button[name=state_stop]").hide();
      $("button[name=state_abandon]").show();
    } else if (notification == "running") {
      $('#state_extended').hide();
      $("button[name=state_start]").hide();
      $("button[name=state_stop]").show();
      $("button[name=state_abandon]").hide();
    } else {
      $('#state_extended').hide();
      $("button[name=state_start]").hide();
      $("button[name=state_stop]").hide();
      $("button[name=state_abandon]").hide();
    }

    // disable all input, also check themes
    format_visual_forms();
    // remove all markings with state change
    if (save['graph_adaptor'] && save['graph_adaptor'].illustrator) {
      save['graph_adaptor'].illustrator.get_elements().removeClass('marked');
      localStorage.removeItem('marked');
      localStorage.removeItem('marked_from');
    }

    if (notification != "ready" && notification != "stopped" && notification != "running") {
      $('#parameters ui-content ui-area > button').attr('disabled','disabled');
      $('#state_any').hide();
    } else {
      $('#parameters ui-content ui-area > button').removeAttr('disabled');
      $('#state_any').show();
    }

    $("#state_text").text(notification);
  }
}   //}}}
function monitor_instance_vote_add(parts) {// {{{
  var ctv = $("#votes");

  astr = '';
  if ($("input[name=votecontinue]").is(':checked'))
    astr += "<button id='vote_to_continue-" + parts.activity + "-" + parts.key + "' onclick='$(this).attr(\"disabled\",\"disabled\");monitor_instance_vote_remove(\"" + parts.activity + "\",\"" + parts.key + "\",\"true\");'>" + parts.activity + "</button>";
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
    url: url + "/properties/state/",
    data: ({value: "running"}),
    error: report_failure
  });
}// }}}
function aba_instance() {// {{{
  monitor_instance_state_change('abandoned');
  var url = $('body').attr('current-instance');
  $.ajax({
    type: "PUT",
    url: url + "/properties/state/",
    data: ({value: "abandoned"}),
    error: report_failure
  });
}// }}}
function stop_instance() {// {{{
  var url = $('body').attr('current-instance');
  $.ajax({
    type: "PUT",
    url: url + "/properties/state/",
    data: ({value: "stopping"}),
    error: report_failure
  });
}// }}}

function save_testsetfile() {// {{{
  var def = new $.Deferred();
  def.done(function(name,testset) {
    var ct = new Date();
    $('#savetestsetfile').attr('download',name + '.xml');
    $('#savetestsetfile').attr('href','data:application/xml;charset=utf-8;base64,' + $B64(testset.serializePrettyXML()));
    document.getElementById('savetestsetfile').click();
  });
  get_testset(def);
}// }}}

function get_testset(deferred) {// {{{
  var url = $('body').attr('current-instance');

  $.ajax({
    type: "GET",
    url: url + "/properties/",
    success: function(res){
      var testset = $X('<testset xmlns="http://cpee.org/ns/properties/2.0"/>');
      testset.append($(res.documentElement).children());
      $('testset > state',testset).remove();
      $('testset > status',testset).remove();
      $('testset > positions',testset).remove();
      $('testset > dsl',testset).remove();
      $('testset > description > *',testset).remove();
      $('testset > description',testset).append($('testset > dslx',testset).children());
      $('testset > transformation',testset).remove();
      $('testset > dsl',testset).remove();
      $('testset > dslx',testset).remove();
      $('testset > attributes > uuid',testset).remove();
      testset.append($X('<transformation xmlns="http://cpee.org/ns/properties/2.0"><description type="copy"/><dataelements type="none"/><endpoints type="none"/></transformation>'));
      var name =  $('testset > attributes > info',testset).text();
      $('[xmlns]',testset).each((idx,ele) => {
        if (ele.parentNode.namespaceURI == ele.getAttribute('xmlns')) {
          ele.removeAttribute('xmlns');
        }
      });
      $.ajax({
        type: "GET",
        url: url + "/notifications/subscriptions/",
        success: async function(res){
          let values = $("subscriptions > subscription[url]",res);
          let subs = $X('<subscriptions xmlns="http://riddl.org/ns/common-patterns/notifications-producer/2.0"/>');
          let promises = [];
          let scount = 0;
          values.each(function(){
            let sid = $(this).attr('id');
            if (sid.match(/^_/)) {
              scount += 1;
              promises.push(
                $.ajax({
                  type: "GET",
                  url: url + "/notifications/subscriptions/" + sid,
                  error: report_failure
                }).then(function(a) {
                  subs.append($(a.documentElement));
                })
              );
            };
          });
          await Promise.all(promises);
          if (scount > 0) { testset.append(subs); }
          deferred.resolve(name,testset);
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
  var start = parseInt(gc.attr('width'));
  $('#graphgrid > svg:not(#graphcanvas)').each( (i,ele) => {
    const gr = $X('<g transform="translate(' + start + ')" xmlns="http://www.w3.org/2000/svg"></g>');
    start = start + parseInt(ele.getAttribute('width'));
    $('g',ele).each((j,g) => {
      gr.append($(g).clone());
    });
    gc.append(gr);
  });
  gc.find('.selected').removeClass('selected');
  var varreps = {};
  $(window.document.styleSheets).each(function(i,x){
    if (x && x.href && x.ownerNode.attributes.getNamedItem('data-include-export')) {
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
      loc.attr('style',loc.attr('style') + ' display: none; ');
    }
  });
  gc.attr('width',start+1);
  $.ajax({
    type: "GET",
    url: url + "/properties/attributes/info/",
    success: function(res){
      $('#savesvgfile').attr('download',res + '.svg');
      $('#savesvgfile').attr('href','data:application/xml;charset=utf-8;base64,' + $B64(gc.serializePrettyXML()));
      document.getElementById('savesvgfile').click();
    },
    error: report_failure
  });
}// }}}
async function set_testset(testset,exec) {// {{{
  var url = $('body').attr('current-instance');

  var promises = [];

  var tset = $X('<properties xmlns="http://cpee.org/ns/properties/2.0"/>');
  tset.append($("testset > executionhandler",testset));
  tset.append($("testset > positions",testset));
  tset.append($("testset > dataelements",testset));
  tset.append($("testset > endpoints",testset));
  tset.append($("testset > attributes",testset));
  tset.append($("testset > description",testset));
  tset.append($("testset > transformation",testset));
  if (skip_location) {
    $('properties > attributes > info',tset).remove();
    $('properties > attributes > design_dir',tset).remove();
  }

  promises.push(
    $.ajax({
      type: "GET",
      url: url + "/notifications/subscriptions/",
      error: report_failure
    }).then(async function(res) {
      var values = $("subscriptions > subscription[url]",res);
      var vals = {};
      values.each(function(){
        vals[$(this).attr('url')] = $(this).attr('id');
      });
      await load_testset_handlers(url,testset,vals);
    })
  );
  promises.push(
    $.ajax({
      type: 'PATCH',
      url: url + "/properties/",
      contentType: 'text/xml',
      headers: {
       'Content-ID': 'properties',
       'CPEE-Event-Source': myid
      },
      data: tset.serializeXML(),
      error: report_failure
    })
  );

  await Promise.all(promises);

  document.dispatchEvent(model_loaded);

  $.ajax({
    type: "GET",
    url: url + "/properties/state/",
    dataType: "text",
    success: function(res){
      $.ajax({
        type: "PUT",
        url: url + "/properties/state/",
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

  var name = $("#templates div.menuitem[data-selected=selected]").text();
  var url;
  if (name) {
    if ($('body').attr('current-templates').match(/\?/)) {
      url = $('body').attr('current-templates').replace(/\?/,name + '.xml?');
    } else {
      url = $('body').attr('current-templates') + name + ".xml";
    }
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
    url: name + ".xml",
    success: function(res){
      $.ajax({
        type: "PUT",
        url: url + "/properties/attributes/modeltype/",
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
    error: report_failure,
    success: () => {
      document.dispatchEvent(model_loaded);
    }
  });
} //}}}

function load_testset_extract_handlers(inp,han,suburl) { //{{{
  inp.push("url="+encodeURIComponent(suburl).replace(/~/,'%7E'));
  $(">*",han).each(function(_,top){
    let events = [];
    let votes = [];
    $(">*",top).each(function(_,it){
      if (it.nodeName == 'event') {
        events.push($(it).text());
      }
      if (it.nodeName == 'vote') {
        votes.push($(it).text());
      }
    });
    if (events.length > 0) {
      inp.push("topic=" + $(top).attr('id'));
      inp.push("events=" + events.join(','));
    }
    if (votes.length > 0) {
      inp.push("topic=" + $(top).attr('id'));
      inp.push("votes=" + votes.join(','));
    }
  });
  return inp;
} //}}}

async function load_testset_handlers(url,testset,vals) {// {{{
  var promises = [];
  $("testset > subscriptions > *",testset).each(async function(){
    let han = this;
    let sid = $(han).attr('id');
    let suburl = $(han).attr('url');
    if (typeof(vals[suburl]) == 'undefined') {
      if ($("*",han).length > 0) {
        let inp = [];
        if (sid) { inp.push("id="+encodeURIComponent(sid)); }
        inp = load_testset_extract_handlers(inp,han,suburl);
        promises.push(
          $.ajax({
            type: "POST",
            url: url + "/notifications/subscriptions/",
            data: inp.join('&')
          })
        )
      }
    } else {
      if ($("*",han).length == 0) {
        $.ajax({
          type: "DELETE",
          url: url + "/notifications/subscriptions/" + vals[suburl] + '/'
        })
        delete vals[suburl];
      } else {
        let inp = load_testset_extract_handlers([],han,suburl);
        promises.push(
          $.ajax({
            type: "PUT",
            url: url + "/notifications/subscriptions/" + vals[suburl] + '/',
            data: inp.join('&')
          })
        )
      }
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
  if (node_state[what][cls] < 0)
    node_state[what][cls] = 0;
  format_visual_set(what);
}//}}}

function scroll_into_view(what) { //{{{
  if (save['state'] != "running") return;
  var tcontainer = $('#graphcolumn')[0];
  if ($('g[element-id="' + what + '"]').length > 0) {
    var telement = $('g[element-id="' + what + '"]')[0].getBBox().y;
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
    var taskname = this.nodeName;
    var taskstate = this.textContent;
    format_visual_add(taskname,save['state'] == 'running' ? (taskstate == 'at' ? 'active' : 'passive') : 'passive');
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
  message = message.replace(/&/g, '&amp;');
  message = message.replace(/</g, '&lt;');
  message = message.replace(/>/g, '&gt;');
  message = message.replace(/"/g, '&quot;');
  message = message.replace(/'/g, '&apos;');
  if (type == 'description/change') {
    $("#dat_log").prepend("<tr><td class='fixed'><a title=\"" + d.strftime("[%d/%b/%Y %H:%M:%S]") + "\">D</a></td><td class='fixed'>&#160;-&#160;</td><td class='fixed'><a title=\"" + what + "\">T</a></td><td class='fixed'>&#160;-&#160;</td><td class='fixed'>" +  type + "</td><td class='fixed'>&#160;-&#160;</td><td class='long'>... check in persistent log ...</td></tr>");
  } else {
    $("#dat_log").prepend("<tr><td class='fixed'><a title=\"" + d.strftime("[%d/%b/%Y %H:%M:%S]") + "\">D</a></td><td class='fixed'>&#160;-&#160;</td><td class='fixed'><a title=\"" + what + "\">T</a></td><td class='fixed'>&#160;-&#160;</td><td class='fixed'>" +  type + "</td><td class='fixed'>&#160;-&#160;</td><td class='long'>" +  message + "</td></tr>");
  }
  var dle = $("#dat_log").children();
  if (dle.length > 100) {
    dle.slice(100).each((k,ele) => {
      $(ele).remove();
    });
  }
}//}}}

function report_failure(){}

function ui_pos(e,bl) {
  var url = $('body').attr('current-instance');
  var coll = [];
  $('g.element.primitive > g.activities.active, g.element.primitive > g.activities.passive').each(function(a,b){
    coll.push([$(b).parent().attr('element-id'), $(b).parent().attr('element-type') == 'stop' ? 'after' : 'at']);
  });
  coll = bl(coll);
  var vals = "";
  $(coll).each(function(k,ele){
    vals += "<" + ele[0] + ">" + ele[1] + "</"  + ele[0] + ">";
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
    coll.splice(coll.findIndex((ele)=>ele[0] == $(e).attr('id')),1);
    return coll;
  });
}
function add_ui_pos(e) {
  ui_pos(e,function(coll){
    coll.push([$(e).attr('id'), e.nodeName == 'stop' ? 'after' : 'at']);
    return coll;
  });
}
