var finished;
var soll;
var running = false;

$(document).ready(function() {
  $("button[name=base]").click(create_instance);
  $("button[name=instance]").click(load_instance);
  $("button[name=testset]").click(load_testset);
  $.ajax({ 
    url: "Testsets.xml", 
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
    url: url + "/properties/values/context-variables/",
    success: function(res){
      var ctv = $("#context-variables");
      ctv.empty();
      var values = $("values > *",res);
      values.each(function(){
        ctv.append("<tr><td>" + this.nodeName  + "</td><td>⇒</td><td>" + $(this).text() + "</td></tr>");
      });
    }
  });      

  $.cors({
    type: "GET", 
    url: url + "/properties/values/endpoints/",
    success: function(res){
      var ctv = $("#endpoints");
      ctv.empty();
      var values = $("values > *",res);
      values.each(function(){
        ctv.append("<tr><td>" + this.nodeName  + "</td><td>⇒</td><td>" + $(this).text() + "</td></tr>");
      });
    }
  });

  $.cors({
    type: "GET",
    dataType: "text",
    url: url + "/properties/values/dsl/",
    success: function(res){
      var ctv = $("#description");
      ctv.empty();
      
      res = res.replace(/\t/g,'  ');
      res = res.replace(/\r/g,'');

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
    }
  });

  $.cors({
    type: "GET", 
    url: url + "/properties/values/positions/",
    success: function(res){
      var ctv = $("#positions");
      ctv.empty();
      var values = $("values > *",res);
      values.each(function(){
        ctv.append("<tr><td>" + this.nodeName  + "</td><td>⇒</td><td>" + $(this).text() + "</td></tr>");
      });
    }
  });

  $.cors({
    type: "GET", 
    url: url + "/properties/values/state/",
    dataType: "text",
    success: function(res){
      var ctv = $("#state");
      ctv.empty();
      ctv.append(res);
    }
  });
}// }}}

function load_testset() {// {{{
  if (running) return;
  running  = true;
  finished = 0;
  soll = 4;
  var url = $("input[name=instance-url]").val();
  $.ajax({ 
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
          var type = "GET";
          if (values.length > 0) {
            $.ajax({ 
              url: "Testsets.xsl",
              dataType: "text",
              success: function(res){ 
                $.cors({
                  type: "POST", 
                  url: url + "/properties/values/",
                  data: ({key: "transformation", value: res}),
                  success: function() { finished_load_testset(++finished); },
                  failure: report_failure
                });
                }  
            });
          } else {
            $.ajax({ 
              url: "Testsets.xsl",
              dataType: "text",
              success: function(res){ 
                $.cors({
                  type: "PUT", 
                  url: url + "/properties/values/transformation",
                  data: ({value: res}),
                  success: function() { finished_load_testset(++finished); },
                  failure: report_failure
                });
                }  
            });
          }
        },  
        failure: report_failure
      });
      
      $("testset > description",testset).each(function(){
        var name = this.nodeName;
        var val = $(this).serializeXML();
        $.cors({
          type: "PUT", 
          url: url + "/properties/values/description",
          data: ({value: val}),
          success: function() { finished_load_testset(++finished); },
          failure: report_failure
        });
      });
    }
  });
  running  = false;
}// }}}

function finished_load_testset(num) {// {{{
  if (num == soll)
    load_instance();
}// }}}

function load_testset_cvs(url,testset) {// {{{
  var temp = $("testset > context-variables > *",testset);
  soll += temp.length - 1;
  temp.each(function(){
    var name = this.nodeName;
    var val = $(this).text();
    $.cors({
      type: "POST", 
      url: url + "/properties/values/context-variables/",
      data: ({key:  name, value: val}),
      success: function(){ finished_load_testset(++finished); },
      failure: report_failure
    });  
  });
}// }}}

function load_testset_eps(url,testset) {// {{{
  var temp = $("testset > endpoints > *",testset);
  soll += temp.length - 1;
  temp.each(function(){
    var name = this.nodeName;
    var val = $(this).text();
    $.cors({
      type: "POST", 
      url: url + "/properties/values/endpoints/",
      data: ({key:  name, value: val}),
      success: function(){ finished_load_testset(++finished); },
      failure: report_failure
    });  
  });
}// }}}

function report_failure(){}
