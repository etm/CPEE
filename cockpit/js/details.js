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
  console.log('hallo');
  var visid = $('table.tabbar td.tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');
  var tab = $('#dat_' + visid);
  var details = serialize_details(tab).serializeXML();
  if (details != save[visid]) {
    $('table.tabbar .tabbehind button:nth-child(2)',top).addClass('highlight');
  } else {  
    $('table.tabbar .tabbehind button:nth-child(2)',top).removeClass('highlight');
  }
} //}}}
function save_main(top) { //{{{
  var visid = $('table.tabbar td.tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');
  var tab  = $('#dat_' + visid);
  var node = graphrealization.description.get_node_by_svg_id($('input.pname_svgid').val());
  var newn = serialize_details(tab).attr('svg-id',$('input.pname_svgid').val());
  if (newn.children().length == 0) {
    newn.append(node.children());
  }  
  node.replaceWith(newn);
} //}}}

function serialize_details(parent) { //{{{
  var ele = $('input.pname_element',parent).val();
  var xml = $X('<' + ele + '/>');
  switch(ele) {
    case 'call':
        xml.attr('id',$('input.pname_id').val());
        if ($('input.pname_lay',parent).length > 0) {
          xml.attr('lay',$('input.pname_lay').val());
        }  
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
      xml.attr('id',$('input.pname_id').val());
      if ($('textarea.pname_manipulate',parent).length > 0) {
        xml.text($('textarea.pname_manipulate',parent).val());
      }
      break;
    case 'loop':
      xml.attr($('select.pname_mode').val(),$('input.pname_condition').val());
      break;
    case 'choose':
      break;
    case 'alternative':
      xml.attr('condition',$('input.pname_condition').val());
      break;
    case 'parallel':
      if (parseInt($('input.pname_wait').val()) > -1) {
        xml.attr('wait',$('input.pname_wait').val());
      }  
      break;
    case 'parallel_branch':
      if ($('input.pname_pass',parent).length > 0) {
        xml.attr('pass',$('input.pname_pass').val());
      }  
      if ($('input.pname_local',parent).length > 0) {
        xml.attr('local',$('input.pname_local').val());
      }  
      break;
    // TODO group
  }  

  return xml;
} //}}}
