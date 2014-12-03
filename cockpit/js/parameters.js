$(document).ready(function() {
  // Color of save buttons for parameter area //{{{
  $('#parameters table.tabbar td.tab:not(.switch):not(.tabbehind)').click(function(event){
    mark_parameters_save($(event.target).parents('div.tabbed'));
  }); //}}}
  
  // Delete entries //{{{
  $(document).on('click','#parameters td.del a',function(event){
    var top = $(event.target).parents('.tabbed');
    remove_entry($("input",$(event.target).parents('tr')).get(0),false);
    mark_parameters_save(top);
    return false;
  }); //}}}

  // New entry //{{{
  $('#parameters .tabbehind button:nth-child(1)').click(function(){
    new_entry($(this).parents('div.tabbed'));
  }); //}}}

  // Save entries //{{{
  $('#parameters .tabbehind button:nth-child(2)').click(function(event){
    save_parameters($(event.target).parents('div.tabbed'));
  }); //}}}

  $(document).on('keyup','#dat_dataelements input',function(e){ mark_parameters_save($(e.target).parents('div.tabbed')); });
  $(document).on('keyup','#dat_endpoints input',function(e){ mark_parameters_save($(e.target).parents('div.tabbed')); });
});

function mark_parameters_save(top) { //{{{
  var visid = $('table.tabbar td.tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');
  var tab = $('#dat_' + visid);
  if (serialize_inputs(tab) != save[visid]) {
    $('table.tabbar .tabbehind button:nth-child(2)',top).addClass('highlight');
  } else {  
    $('table.tabbar .tabbehind button:nth-child(2)',top).removeClass('highlight');
  }
} //}}}
function save_parameters(top) { //{{{
  var visid = $('table.tabbar td.tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');
  var table = $('#dat_' + visid);
  var serxml = serialize_inputs(table);

  if (serxml != save[visid]) {
    save[visid] = serxml;
    var url = $("input[name=current-instance]").val();
    $('table.tabbar .tabbehind button:nth-child(2)',top).removeClass('highlight');
    $.ajax({
      type: "PUT", 
      url: url + "/properties/values/" + visid + "/",
      data: ({'content': serxml}),
    });
  }  
} //}}}

function serialize_inputs(parent) { //{{{
  var xml = $X('<content/>');
  var fields = $('input',parent);
  for (var i=0;i<fields.length; i+=2) {
    var k = $(fields[i]).val();
    var v = $(fields[i+1]).val();
    if (k.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
      xml.append($X('<' + k + '>' + v + '</' + k + '>'));
    }   
  }
  return xml.serializeXML();
} //}}}
