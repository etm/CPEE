$(document).ready(function() {
  // save buttons shown or not //{{{
  $('#main table.tabbar td.tab:not(.switch):not(.tabbehind)').click(function(event){
    var me = $(event.target).parents('td.tab');
    if (me.attr('id') == 'tabdetails') {
      $('#main .tabbehind button').show();
    } else {
      $('#main .tabbehind button').hide();
    }  
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
  }); //}}}
});

function mark_main_save(top) { //{{{
  var visid = $('table.tabbar td.tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');
  var tab = $('#dat_' + visid);
  console.log(serialize_details(tab));
  if (serialize_details(tab) != save[visid]) {
    $('table.tabbar .tabbehind button:nth-child(2)',top).addClass('highlight');
  } else {  
    $('table.tabbar .tabbehind button:nth-child(2)',top).removeClass('highlight');
  }
} //}}}
function save_main(top) { //{{{
  var visid = $('table.tabbar td.tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');
  var tab = $('#dat_' + visid);
  console.log(serialize_details(tab));
} //}}}

function serialize_details(parent) { //{{{
  var ele = $('input.pname_element',parent).val();
  var xml = $X('<' + ele + '/>');
  switch(ele) {
    case 'call':
        xml.attr('id',$('input.pname_id').val());
        xml.attr('endpoint',$('input.pname_endpoint').val());

        var para = $X('<parameters/>');
        xml.append(para);
        
        if ($('input.pname_method',parent).length > 0) {
          var pars = $X('<parameters/>');
          var meth = $X('<method/>');
              meth.text($('input.pname_method',parent).val());
          para.append(meth);
          para.append(pars);
          $('tr.pair',parent).each(function(){
            var nam = $('input.pair_name',this).val();
            var val = $('input.pair_value',this).val();
            var par = $X('<' + nam + '/>');
            par.text(val);
            pars.append(par);
          });
        }

        if ($('textarea.pname_manipulate',parent).length > 0) {
          var mani = $X('<manipulate/>');
              mani.text($('textarea.pname_manipulate',parent).val());
          xml.append(mani);
        }
      break;
    case 'manipulate':

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
