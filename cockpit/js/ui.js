$(document).ready(function() {
  if (!($.browser.name == "Firefox" && $.browser.version >= 20) && !($.browser.name == "Chrome" && $.browser.version >= 30)) {
    $('body').children().remove();
    $('body').append('Sorry, only Firefox >= 20.0 and Chrom(e|ium) >= 17 for now.');
  }  
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

  // Resize areas
  $('#detailcolumn').resizable({ 
    handles: { 'w' : '#handle2'},
    resize: function(event, ui) { 
      if ($.browser.name == "Chrome") {
        $('#handle2').offset({ left: ui.helper.offset().left+3 });
      }  
    }
  });
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
