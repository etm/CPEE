$(document).ready(function() {
  if (!($.browser.mozilla && parseInt($.browser.version) >= 6)) {
    $('body').children().remove();
    $('body').append('Sorry, only Firefox >= 6.0 for now.<br/>Chrom(ium|e) support will be added as soon as websocket >= hybi-08 is working (14.x ?).');
  }  

  // Resize areas
  $('#detailcolumn').resizable({ handles: { 'w' : '#handle2'}});
  $('#parameters .tabbelow').resizable({ 
    handles: { 's' : '#handle1'},
    resize: function(event, ui) { 
      $('#parameters .tabbelow').css('width','');
    }
  });
});

// flexible parameter input

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

