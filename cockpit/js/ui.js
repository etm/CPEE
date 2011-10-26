$(document).ready(function() {
  if (!($.browser.mozilla && parseInt($.browser.version) >= 6)) {
    $('body').children().remove();
    $('body').append('Sorry, only Firefox >= 6.0 for now.<br/>Chrom(ium|e) support will be added as soon as websocket >= hybi-08 is working (14.x ?).');
  }  
  // Resize areas //{{{
  $('#detailcolumn').resizable({ handles: { 'w' : '#handle2'}});
  $('#parameters .tabbelow').resizable({ 
    handles: { 's' : '#handle1'},
    resize: function(event, ui) { 
      $('#parameters .tabbelow').css('width','');
    }
  }); //}}}
  
  //////////////////////////////////// #parameters input stuff //{{{ 

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
  }); //}}} //}}}
  
  //////////////////////////////////// #details input stuff //{{{

  // Color of save buttons for parameter area //{{{
  $('#main table.tabbar td.tab:not(.switch):not(.tabbehind)').click(function(event){
    mark_main_save($(event.target).parents('div.tabbed'));
  }); //}}}

  // New entry //{{{
  $('#main .header button').live('click',function(){
    var node = new_entry($(this).parents('div.tabbed'));
    node.addClass('indent');
  }); //}}}
  
  // Delete entries //{{{
  $('#main td.del a').live('click',function(event){
    var top = $(event.target).parents('div.tabbed');
    remove_entry($("input",$(event.target).parents('tr')).get(0),false);
    mark_main_save(top);
    return false;
  }); //}}}

  // Save entries //{{{
  $('#main .tabbehind button').click(function(event){
    save_main($(event.target).parents('div.tabbed'));
  }); //}}}

  $('#dat_details input.pair_name, #dat_details input.pair_value').live('keyup',function(e){ mark_main_save($(e.target).parents('div.tabbed')); });
  $('#dat_details input.pair_name, #dat_details input.pair_value').live('keypress',function(e){ //{{{
    if (e.keyCode == 40) {  //{{{
      var next = false;
      $('#dat_details input.' + $(e.target).attr('class')).each(function(){
        if (next) { this.focus(); return false; }
        if (this == e.target) next = true;
      });
    } //}}}
    if (e.keyCode == 38) {  //{{{
      var prev = null;
      $('#dat_details input.' + $(e.target).attr('class')).each(function(){
        if (this == e.target) {
          if (prev) prev.focus();
          return false;
        }
        prev = this;
      });
    } // }}}
    if (e.keyCode == 37 && $(e.target).caret().start == 0 && $(e.target).attr('class') == 'pair_value') {  //{{{
      var prev = null;
      $('#dat_details input').each(function(){
        if (this == e.target) {
          if (prev) prev.focus();
          return false;
        }
        prev = this;
      });
    } //}}}
    if (e.keyCode == 39 && $(e.target).caret().end == $(e.target).val().length && $(e.target).attr('class') == 'pair_name') {  //{{{
      var next = false;
      $('#dat_details input').each(function(){
        if (next) { this.focus(); return false; }
        if (this == e.target) next = true;
      });
    } //}}}
    if (e.keyCode == 13 && $(e.target).caret().end == $(e.target).val().length && $(e.target).attr('class') == 'pair_value') {  //{{{
      var node = new_entry($(this).parents('div.tabbed'));
      node.addClass('indent');
    } //}}}

    if (e.which == 100 && e.ctrlKey == true) { // Ctrl-D -> Delete Entry //{{{
      remove_entry(e.target,true);
      return false;
    } //}}} 
    if (e.which == 110 && e.ctrlKey == true) { // Ctrl-N -> New Entry //{{{
      var node = new_entry($(this).parents('div.tabbed'));
      node.addClass('indent');
      return false;
    } //}}}
    if (e.which == 115 && e.ctrlKey == true) { // Ctrl-S -> Save Entries
      return false;
    }
  }); //}}} //}}}
});

function remove_entry(target,foc) { //{{{
  var tr = $($(target).parents('tr').get(0));
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
  var node = $('#dat_template_pair tr').clone();
  var vnode = $('#dat_' + visid).append(node);
  $('.pair_name',vnode).focus();
  return node;
} //}}}

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

function mark_main_save(top) { //{{{
  var visid = $('table.tabbar td.tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');
  var tab = $('#dat_' + visid);
  console.log(serialize_inputs(tab));
  if (serialize_details(tab) != save[visid]) {
    $('table.tabbar .tabbehind button:nth-child(2)',top).addClass('highlight');
  } else {  
    $('table.tabbar .tabbehind button:nth-child(2)',top).removeClass('highlight');
  }
} //}}}
function save_main(top) { //{{{
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
function serialize_details(parent) { //{{{
  var ele = $('input.pname_element');
  var xml = $X('<' + ele + />');
  switch(ele) {
    case 'call':
        xml.attr('id',$('input.pname_id').val());
        xml.attr('endpoint',$('input.pname_endpoint').val());

        if ($('manipulate',node).length > 0)
          table.append(create_area_property('Manipulate','',format_text_skim($('manipulate',node).text())));

        table.append(create_header('Parameters:'));

        table.append(create_input_property('Method','indent',$('parameters method',node).text()));
        $.each($('parameters parameters *',node),function(){
          table.append(create_input_pair(this.nodeName,'indent',$(this).text()));
        });
      break;
    case 'manipulate':
      table.append(create_input_property('ID','',$(node).attr('id')));
      table.append(create_input_property('Lay','',$(node).attr('lay')));
      table.append(create_area_property('Manipulate','',format_text_skim($(node).text())));
      break;
    case 'loop':
      if ($(node).attr('pre_test'))
        var mode = 'pre_test';
      if ($(node).attr('post_test'))
        var mode = 'pre_test';
      table.append(create_select_property('Mode','',mode,['post_test','pre_test']));
      table.append(create_input_property('Condition','',$(node).attr(mode)));
      reak;
    case 'choose':
      break;
    case 'alternative':
      table.append(create_input_property('Condition','',$(node).attr('condition')));
      break;
    case 'parallel':
      var wait = $(node).attr('condition') || '-1';
      table.append(create_input_property('Wait','',wait));
      table.append(create_line('Hint','-1 to wait for all branches'));
      break;
    case 'parallel_branch':
      table.append(create_input_property('Pass to branch','',$(node).attr('pass')));
      table.append(create_input_property('Local scope','',$(node).attr('local')));
      break;
    // TODO group
  }  

  return xml.serializeXML();
} //}}}
