$(document).ready(function() {
  // Color of save buttons for parameter area //{{{
  $('#parameters table.tabbar td.tab:not(.switch):not(.tabbehind)').click(function(event){
    mark_parameters_save($(event.target).parents('div.tabbed'));
  }); //}}}
  
  // Delete entries //{{{
  $('#parameters td.del a').live('click',function(event){
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

  $('#dat_dataelements input').live('keyup',function(e){ mark_parameters_save($(e.target).parents('div.tabbed')); });
  $('#dat_dataelements input').live('keypress',function(e){ //{{{
    if (e.keyCode == 40) {  //{{{
      var next = false;
      $('#dat_dataelements input.' + $(e.target).attr('class')).each(function(){
        if (next) { this.focus(); return false; }
        if (this == e.target) next = true;
      });
    } //}}}
    if (e.keyCode == 38) {  //{{{
      var prev = null;
      $('#dat_dataelements input.' + $(e.target).attr('class')).each(function(){
        if (this == e.target) {
          if (prev) prev.focus();
          return false;
        }
        prev = this;
      });
    } // }}}
    if (e.keyCode == 37 && $(e.target).caret().start == 0 && $(e.target).attr('class') == 'pair_value') {  //{{{
      var prev = null;
      $('#dat_dataelements input').each(function(){
        if (this == e.target) {
          if (prev) prev.focus();
          return false;
        }
        prev = this;
      });
    } //}}}
    if (e.keyCode == 39 && $(e.target).caret().end == $(e.target).val().length && $(e.target).attr('class') == 'pair_name') {  //{{{
      var next = false;
      $('#dat_dataelements input').each(function(){
        if (next) { this.focus(); return false; }
        if (this == e.target) next = true;
      });
    } //}}}
    if (e.keyCode == 13 && $(e.target).caret().end == $(e.target).val().length && $(e.target).attr('class') == 'pair_value') {  //{{{
      new_entry($(this).parents('div.tabbed'));
    } //}}}

    if (e.which == 100 && e.ctrlKey == true) { // Ctrl-D -> Delete Entry //{{{
      remove_entry(e.target,true);
      return false;
    } //}}} 
    if (e.which == 110 && e.ctrlKey == true) { // Ctrl-N -> New Entry //{{{
      new_entry($(this).parents('div.tabbed'));
      return false;
    } //}}}
    if (e.which == 115 && e.ctrlKey == true) { // Ctrl-S -> Save Entries //{{{
      save_parameters($(this).parents('div.tabbed'));
      return false;
    } //}}} 
  }); //}}}

  $('#dat_endpoints input').live('keyup',function(e){ mark_parameters_save($(e.target).parents('div.tabbed')); });
  $('#dat_endpoints input').live('keypress',function(e){ //{{{
    if (e.keyCode == 40) {  //{{{
      var next = false;
      $('#dat_endpoints input.' + $(e.target).attr('class')).each(function(){
        if (next) { this.focus(); return false; }
        if (this == e.target) next = true;
      });
    } //}}}
    if (e.keyCode == 38) {  //{{{
      var prev = null;
      $('#dat_endpoints input.' + $(e.target).attr('class')).each(function(){
        if (this == e.target) {
          if (prev) prev.focus();
          return false;
        }
        prev = this;
      });
    } //}}}
    if (e.keyCode == 37 && $(e.target).caret().start == 0 && $(e.target).attr('class') == 'pair_value') {  //{{{
      var prev = null;
      $('#dat_endpoints input').each(function(){
        if (this == e.target) {
          if (prev) prev.focus();
          return false;
        }
        prev = this;
      });
    } //}}}
    if (e.keyCode == 39 && $(e.target).caret().end == $(e.target).val().length && $(e.target).attr('class') == 'pair_name') {  //{{{
      var next = false;
      $('#dat_endpoints input').each(function(){
        if (next) { this.focus(); return false; }
        if (this == e.target) next = true;
      });
    } //}}}
    if (e.keyCode == 13 && $(e.target).caret().end == $(e.target).val().length && $(e.target).attr('class') == 'pair_value') {  //{{{
      new_entry($(this).parents('div.tabbed'));
    } //}}}

    if (e.which == 100 && e.ctrlKey == true) { // Ctrl-D -> Delete Entry //{{{
      remove_entry(e.target,true);
      return false;
    } //}}}
    if (e.which == 110 && e.ctrlKey == true) { // Ctrl-N -> New Entry //{{{
      new_entry($(this).parents('div.tabbed'));
      return false;
    } //}}}
    if (e.which == 115 && e.ctrlKey == true) { // Ctrl-S -> Save Entries //{{{
      save_parameters($(this).parents('div.tabbed'));
      return false;
    } //}}}
  }); //}}}
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
