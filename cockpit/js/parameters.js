$(document).ready(function() {
  // Color of save buttons for parameter area //{{{
  $('#parameters ui-tabbar ui-tab:not(.switch)').click(function(event){
    mark_parameters_save($(event.target).parents('ui-tabbed'));
  }); //}}}

  // Delete entries //{{{
  $(document).on('click','#parameters td.del a',function(event){
    var top = $(event.target).parents('ui-tabbed');
    remove_entry($("input",$(event.target).parents('tr')).get(0),false);
    mark_parameters_save(top);
    return false;
  }); //}}}

  // New entry //{{{
  $('#parameters ui-behind button:nth-child(1)').click(function(){
    new_entry($(this).parents('ui-tabbed'));
  }); //}}}

  // Save entries //{{{
  $('#parameters ui-behind button:nth-child(2)').click(function(event){
    save_parameters($(event.target).parents('ui-tabbed'));
  }); //}}}

  $(document).on('keyup','#dat_dataelements input',function(e){ mark_parameters_save($(e.target).parents('ui-tabbed')); });
  $(document).on('keyup','#dat_endpoints input',function(e){ mark_parameters_save($(e.target).parents('ui-tabbed')); });
  $(document).on('keyup','#dat_attributes input',function(e){ mark_parameters_save($(e.target).parents('ui-tabbed')); });
});

function mark_parameters_save(top) { //{{{
  var visid = $('ui-tabbar ui-tab',top).not('.switch').not('.inactive').attr('data-tab');
  var tab = $('#dat_' + visid);
  if (serialize_inputs(tab) != save[visid]) {
    $('ui-tabbar ui-behind button:nth-child(2)',top).addClass('highlight');
  } else {
    $('ui-tabbar ui-behind button:nth-child(2)',top).removeClass('highlight');
  }
} //}}}
function save_parameters(top) { //{{{
  var visid = $('ui-tabbar ui-tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');
  var table = $('#dat_' + visid);
  var serxml = serialize_inputs(table);

  if (serxml != save[visid]) {
    save[visid] = serxml;
    var url = $("#current-instance").text();
    $('ui-tabbar ui-behind button:nth-child(2)',top).removeClass('highlight');
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
