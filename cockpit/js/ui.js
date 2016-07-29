$(document).ready(function() {
  if (!($.cookie('cpee_iagree'))) {
    var skip = false;

    $('body').children().each(function(key,c){
      if (skip) {
        $(c).remove();
      } else {
        $(c).removeClass('hidden');
      }
      skip = true;
    });

    $("#iagree").click(function(){
      if($(this).is(':checked')){
        $("#icontinue").prop("disabled", false);
      } else {
        $("#icontinue").prop("disabled", true);
      }
    });
    $("#icontinue").click(function(){
      $.cookie('cpee_iagree','yes');
      location.reload();
    });
  }
});

// flexible parameter input
function remove_entry(target,foc) { // {{{
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
} // }}}

function new_entry(top) { // {{{
  var visid = $('ui-tabbar ui-tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');
  var node = $('#dat_template_pair tr').clone();
  var vnode = $('#dat_' + visid).append(node);
  $('.pair_name',vnode).focus();
  return node;
} // }}}
