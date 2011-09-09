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

  // Delete Entries
  $('#dat_dataelements_template a').click(function(){
    remove_entry($("input",$(this).parent().parent()).get(0),false);
    return false;
  });
  $('#dat_endpoints_template a').click(function(){
    remove_entry($("input",$(this).parent().parent()).get(0),false);
    return false;
  });

  // New Entry Entries
  $('#parameters .tabbehind button').click(function(){
    new_entry($(this).parent().parent().parent().parent().parent());
  });
  $('#parameters .tabbehind button:nth-child(2)').click(save_entries);

  $('#dat_dataelements input').live('keypress',function(e){
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
    if (e.keyCode == 37 && $(e.target).caret().start == 0) {  //{{{
      var prev = null;
      $('#dat_dataelements input').each(function(){
        if (this == e.target) {
          if (prev) prev.focus();
          return false;
        }
        prev = this;
      });
    } //}}}
    if (e.keyCode == 39 && $(e.target).caret().end == $(e.target).val().length) {  //{{{
      var next = false;
      $('#dat_dataelements input').each(function(){
        if (next) { this.focus(); return false; }
        if (this == e.target) next = true;
      });
    } //}}}

    if (e.which == 100 && e.altKey == true) { // Ctrl-D -> Delete Entry //{{{
      remove_entry(e.target,true);
      return false;
    } //}}} 
    if (e.which == 110 && e.altKey == true) { // Ctrl-N -> New Entry //{{{
      new_entry($(this).parent().parent().parent().parent().parent().parent().parent());
      return false;
    } //}}}
    if (e.which == 115 && e.altKey == true) { // Ctrl-S -> Save Entries //{{{
      console.log('haller');
      return false;
    } //}}}
  });

  $('#dat_endpoints input').live('keypress',function(e){
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
    if (e.keyCode == 37 && $(e.target).caret().start == 0) {  //{{{
      var prev = null;
      $('#dat_endpoints input').each(function(){
        if (this == e.target) {
          if (prev) prev.focus();
          return false;
        }
        prev = this;
      });
    } //}}}
    if (e.keyCode == 39 && $(e.target).caret().end == $(e.target).val().length) {  //{{{
      var next = false;
      $('#dat_endpoints input').each(function(){
        if (next) { this.focus(); return false; }
        if (this == e.target) next = true;
      });
    } //}}}

    if (e.which == 100 && e.altKey == true) { // Ctrl-D -> Delete Entry //{{{
      remove_entry(e.target,true);
      return false;
    } //}}}
    if (e.which == 110 && e.altKey == true) { // Ctrl-N -> New Entry //{{{
      new_entry($(this).parent().parent().parent().parent().parent().parent().parent());
      return false;
    } //}}}
    if (e.which == 115 && e.altKey == true) { // Ctrl-S -> Save Entries //{{{
      console.log('haller');
      return false;
    } //}}}
  });
});

function remove_entry(target,foc) { //{{{
  var tr = $(target).parent().parent();
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
  var node = $('#dat_' + visid + '_template tr').clone();
  var vnode = $('#dat_' + visid).append(node);
  $('.pair_name',vnode).focus();
} //}}}

function save_entries(target,foc) { //{{{
} //}}}
