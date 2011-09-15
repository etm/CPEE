$(document).ready(function() {
  if (!($.browser.mozilla && parseInt($.browser.version) >= 6)) {
    $('body').children().remove();
    $('body').append('Sorry, only Firefox >= 6.0 for now.<br/>Chrom(ium|e) support will be added as soon as websocket >= hybi-08 is working (14.x ?).');
  }  

  // resize areas
  $('#detailcolumn').resizable({ handles: { 'w' : '#handle2'}});
  $('#parameters .tabbelow').resizable({ 
    handles: { 's' : '#handle1'},
    resize: function(event, ui) { 
      $('#parameters .tabbelow').css('width','');
    }
  });

  $('#parameters table.tabbar td.tab:not(.switch):not(.tabbehind)').click(function(event){
    mark_save($(event.target).parents('div.tabbed'));
  });  

  // Delete Entries //{{{
  $('#dat_dataelements_template a').click(function(event){
    var top = $(event.target).parents('div.tabbed');
    remove_entry($("input",$(event.target).parents('tr')).get(0),false);
    mark_save(top);
    return false;
  });
  $('#dat_endpoints_template a').click(function(event){
    var top = $(event.target).parents('div.tabbed');
    remove_entry($("input",$(event.target).parents('tr')).get(0),false);
    mark_save(top);
    return false;
  }); //}}}

  // New Entry //{{{
  $('#parameters .tabbehind button:nth-child(1)').click(function(){
    new_entry($(this).parents('div.tabbed'));
  }); //}}}

  // Save Entries //{{{
  $('#parameters .tabbehind button:nth-child(2)').click(function(event){
    save_entries($(event.target).parents('div.tabbed'));
  }); //}}}

  $('#dat_dataelements input').live('keyup',function(e){ mark_save($(e.target).parents('div.tabbed')); });
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
      save_entries($(this).parents('div.tabbed'));
      return false;
    } //}}} 
  }); //}}}

  $('#dat_endpoints input').live('keyup',function(e){ mark_save($(e.target).parents('div.tabbed')); });
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
      save_entries($(this).parents('div.tabbed'));
      return false;
    } //}}}
  }); //}}}
});

function remove_entry(target,foc) { //{{{
  var tr = $(target).parents('tr');
  if (foc) {
    var par = tr.parent();
    $('input.' + $(target).attr('class'),par).each(function(){
      if (this == target) {
        if (prev) prev.focus();
        return false;
      }
      prev = this;
    });
  }  
  tr.remove();
}   //}}}

function new_entry(top) { //{{{
  var visid = $('table.tabbar td.tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');
  var node = $('#dat_' + visid + '_template tr').clone(true);
  var vnode = $('#dat_' + visid).append(node);
  $('.pair_name',vnode).focus();
} //}}}

function save_entries(top) { //{{{
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

function mark_save(top) { //{{{
  var visid = $('table.tabbar td.tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');
  var tab = $('#dat_' + visid);
  console.log(serialize_inputs(tab));
  console.log(save[visid]);
  if (serialize_inputs(tab) != save[visid]) {
    $('table.tabbar .tabbehind button:nth-child(2)',top).addClass('highlight');
  } else {  
    $('table.tabbar .tabbehind button:nth-child(2)',top).removeClass('highlight');
  }
} //}}}

function serialize_hash(ary) { //{{{
  var xml = $X('<content/>');
  $.each(ary,function(k,v) {
    if (k.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
      xml.append($X('<' + k + '>' + v + '</' + k + '>'));
    }
  });
  return xml.serializeXML();
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

