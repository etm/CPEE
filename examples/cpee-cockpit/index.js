var running = false;
var save_state;
var save_dsl;
var save_desc;
var save_eps;
var save_pos;
var save_cvs;

$(document).ready(function() {
  $("button[name=base]").click(create_instance);
  $("button[name=instance]").click(load_instance);
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
});

function symclick(node) { // {{{
  var params = function(child, level) {
    var spaces = "";
    for(var s = 0; s < level; s++) {spaces += "&nbsp;&nbsp;&nbsp;&nbsp;";}
    for(var j = 0; j < child.childNodes.length; j++) {
      if(child.childNodes[j].nodeType == 1 && child.childNodes[j].nodeName == "parameter") {
        attrs.push({'name': spaces + child.childNodes[j].getAttribute('name'),'value':child.childNodes[j].childNodes[0].nodeValue, 'class-name':'tabledetailsdataname', 'class-value':'tabledetailsdatavalue'});
        params(child.childNodes[j], level+1);
      }
    }
  }
  
  var attrs = [];
  var table = $('#tabledetails');
  table.empty();
  switch(node.nodeName) {
    case 'call':
      attrs =[ 
        {'name':'id','value':node.getAttribute('id'), 'class-name':'tabledetailsdataname', 'class-value':'tabledetailsdatavalue'}, 
        {'name':'endpoint','value':node.getAttribute('endpoint'), 'class-name':'tabledetailsdataname', 'class-value':'tabledetailsdatavalue'}, 
        ]
        params(node, 0);
      break;
    case 'manipulate':
      attrs =[ 
        {'name':'id','value':node.getAttribute('id'), 'class-name':'tabledetailsdataname', 'class-value':'tabledetailsdatavalue'}, 
        {'name':'code-block','value':node.textContent, 'class-name':'tabledetailsdataname', 'class-value':'dsl'}, 
        ]
      break;
    case 'cycle':
    case 'alternative':
      attrs =[ 
        {'name':'conditon','value':node.getAttribute('condition'), 'class-name':'tabledetailsdataname', 'class-value':'tabledetailsdatavalue'}, 
        ]
      break;
    case 'parallel':
      attrs =[ 
        {'name':'wait','value':node.getAttribute('wait'), 'class-name':'tabledetailsdataname', 'class-value':'tabledetailsdatavalue'}, 
        ]
      break;
    case 'parallel_branch':
    case 'choose':
    case 'otherwise':
      return;
  }
  table.append('<tr><td colspan="2" class="tabledetailsheader"> Element: '+node.nodeName+'</td></tr>');
  for(var i=0; i<attrs.length;i++) {
    var tr = $('<tr></tr>');
    tr.append('<td class="'+attrs[i]['class-name']+'">' + attrs[i]['name'] + '</td>');
    tr.append('<td class="'+attrs[i]['class-value']+'">' + (attrs[i]['value'] == null ? "not given" : attrs[i]['value']) + '</td>');
    table.append(tr);
  }
} // }}}

function create_instance() {// {{{
  var name = prompt("Instance name?");
  if (name != null) {
    if (name.match(/\S/)) {
      var base = $("input[name=base-url]").val();
      $.cors({
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
  
function load_instance() {// {{{
  var url = $("input[name=instance-url]").val();
  $.cors({
    type: "GET", 
    url: url + "/properties/schema/",
    success: function(res){
      $(".hidden").removeClass("hidden");
      $("input[name=instance-url]").attr("readonly","readonly");
      $("button[name=instance]").attr("disabled","disabled");
      $("input[name=base-url]").attr("readonly","readonly");
      $("button[name=base]").attr("disabled","disabled");
      setTimeout('monitor_instance();finished_monitor_instance();', 0);
    },
    failure: function() {
      alert("This ain't no CPEE instance");
    }  
  });      
}// }}}

function monitor_instance() {// {{{
  var url = $("input[name=instance-url]").val();

  if (save_state == "finished")
    return;

  $.cors({
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

  $.cors({
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

  if (save_state != "running" && save_state != "finished") {
    $.cors({
      type: "GET",
      dataType: "text",
      url: url + "/properties/values/dsl/",
      success: function(res){
        if (res != save_dsl) {
          save_dsl = res;
          var ctv = $("#areadsl");
          ctv.empty();
          
          res = res.replace(/\t/g,'  ');
          res = res.replace(/\r/g,'');

          res = res.replace(/^activity\s+:([\w_]+)/g,"<span class='activities' id=\"activity_$1\">activity :$1</span>");

          var m;
          while (m = res.match(/^ +|^(?!<div style=)|^\z/m)) {
            m = m[0];
            var tm = (m.length + 2) * 0.6 + 2 * 0.6;
            res = res.replace(/^ +|^(?!<div style=)|^\z/m,"<div style='text-indent:-" + tm + "em;margin-left:" + tm + "em'>" + "&#160;".repeat(m.length));
          }
          res = res.replace(/  /g," &#160;");
          res = res.replace(/\n\z/g,"\n<div>&#160;");
          res = res.replace(/\n|\z/g,"</div>\n");
          
          ctv.append(res);
          $.cors({
            type: "GET",
            url: url + "/properties/values/description/",
            success: function(res){
              g = new WFGraph(res, $("#canvas").get(0));
              g.generateGraph({
               symclick: symclick
              });
            }
          });
        }
      }
    });
  }  

  $.cors({
    type: "GET", 
    url: url + "/properties/values/positions/",
    success: function(res){
      var values = $("values > *",res);
      var temp = "";
      $('span.active').removeClass("active");
      $("svg use.active").each(function(a,b){b.setAttribute("class","activities");});
      values.each(function(){
        temp += "<tr><td>" + this.nodeName  + "</td><td>⇒</td><td>\"" + $(this).text() + "\"</td></tr>";
        $('#activity_' + this.nodeName).addClass("active");
        $('#graph_' + this.nodeName).each(function(a,b){b.setAttribute("class","active activities");});
      });

      if (temp != save_pos) {
        save_pos = temp;
        var ctv = $("#positions");
        ctv.empty();
        ctv.append(temp);
      }  
    }
  });

  $.cors({
    type: "GET", 
    url: url + "/properties/values/state/",
    dataType: "text",
    success: function(res){
      if (res != save_state) {
        save_state = res;
        var ctv = $("#state");
        ctv.empty();

        var but = "";
        if (res == "ready" || res == "stopped") {
          but = "<td>⇒</td><td><button onclick='$(this).attr(\"disabled\",\"disabled\");start_instance();'>Start</button></td>";
        }
        if (res == "running") {
          but = "<td>⇒</td><td><button onclick='$(this).attr(\"disabled\",\"disabled\");stop_instance();'>Stop</button></td>";
        }

        ctv.append("<tr><td>" + res + "</td>" + but + "</tr>");
      }  
    }
  });
}// }}}

function finished_monitor_instance() {// {{{
  if (save_state != "finished")
    setTimeout('monitor_instance();finished_monitor_instance();', 1000);
}// }}}

function start_instance() {// {{{
  var url = $("input[name=instance-url]").val();
  $.cors({
    type: "PUT", 
    url: url + "/properties/values/state",
    data: ({value: "running"}),
    failure: report_failure
  });
}// }}}

function stop_instance() {// {{{
  var url = $("input[name=instance-url]").val();
  $.cors({
    type: "PUT", 
    url: url + "/properties/values/state",
    data: ({value: "stopped"}),
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

      $.cors({
        type: "GET", 
        url: url + "/properties/values/context-variables/",
        success: function(res){
          var rcount = 0;
          var values = $("values > *",res);
          var length = values.length;
          values.each(function(){
            var name = this.nodeName;
            $.cors({
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
      
      $.cors({
        type: "GET", 
        url: url + "/properties/values/endpoints/",
        success: function(res){
          var rcount = 0;
          var values = $("values > *",res);
          var length = values.length;
          values.each(function(){
            var name = this.nodeName;
            $.cors({
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

      $.cors({
        type: "GET", 
        url: url + "/properties/values/transformation/",
        success: function(res){
          var values = $("not-existing",res);
          try {
          $("testset > transformation > *",testset).each(function(){
            var val = $(this).serializeXML();
            if (values.length > 0) {
              $.cors({
                type: "POST", 
                url: url + "/properties/values/",
                data: ({key: "transformation", value: val}),
                success: function() { load_testset_des(url,testset); },
                failure: report_failure
              });
            } else {
              $.cors({
                type: "PUT", 
                url: url + "/properties/values/transformation",
                data: ({value: val}),
                success: function() { load_testset_des(url,testset); },
                failure: report_failure
              });
            }
          });
          } catch(e) {
            console.log(e.toString());
          }  
        },  
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
    $.cors({
      type: "PUT", 
      url: url + "/properties/values/description",
      data: ({value: val}),
      failure: report_failure
    });
  });
} // }}}

function load_testset_cvs(url,testset) {// {{{
  $("testset > context-variables > *",testset).each(function(){
    var name = this.nodeName;
    var val = $(this).text();
    $.cors({
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
    $.cors({
      type: "POST", 
      url: url + "/properties/values/endpoints/",
      data: ({key:  name, value: val}),
      failure: report_failure
    });  
  });
}// }}}

function tab_click(active,inactive) { // {{{
  $(".inactivearea").removeClass("inactivearea");
  $(".tabactive").removeClass("tabactive");
  $(".tabinactive").removeClass("tabinactive");
  $("#area" + inactive).addClass("inactivearea");
  $("#tab" + active).addClass("tabactive");
  $("#tab" + inactive).addClass("tabinactive");
} // }}}

function report_failure(){}
