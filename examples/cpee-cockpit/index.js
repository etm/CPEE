$(document).ready(function() {
  $("button[name=base]").click(create_instance);
  $("button[name=instance]").click(load_instance);
  $("button[name=testset]").click(load_testset);
  $.ajax({ 
    url: "Testsets.xml", 
    success: function(result){
      $('testset',result).each(function(){
        var ts = $(this).text();
        $('select[name=testset-names]').append(
          $("<option></option>").attr("value",ts).text(ts)
        );
      });
    }
  });
});

function create_instance() {
  var name = prompt("Instance name?");
  if (name != null) {
    if (name.match(/\S/)) {
      var base = $("input[name=base-url]").val();
      $.cors({
        type: "POST", 
        url: base,
        data: "name=" + name, 
        success: function(res){
          $("input[name=instance-url]").val((base + "//" + res.responseText + "/").replace(/\/+/g,"/").replace(/:\//,"://"));
        },  
        failure: report_failure
      });
    } else {
      alert("An instance name is necessary!");
    }
  }  
}

function load_instance() {
  alert("Hello world1!");
}

function load_testset() {
  var url = $("input[name=instance-url]").val();
  $.ajax({ 
    url: "Testsets/" + $('select[name=testset-names]').val() + ".xml",
    success: function(result){ 
      var testset = result; 
  
      $.cors({
        type: "GET", 
        url: url + "/properties/values/context-variables/",
        success: function(res){
          var rcount = 0;
          var values = $("values > *",res.responseXML);
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
          var values = $("values > *",res.responseXML);
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
      
      $.ajax({ 
        url: "Testsets.xsl",
        dataType: "text",
        success: function(result){ 
          alert(result);
          $.cors({
            type: "POST", 
            url: url + "/properties/values/",
            data: ({key: "transformation", value: result}),
            failure: report_failure
          });
        }  
      });

    }
  });
  
}

function load_testset_cvs(url,testset) {
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
}

function load_testset_eps(url,testset) {
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
}

function report_failure(){}
