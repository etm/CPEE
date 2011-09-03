function ui_tab_click(moi) { // {{{
  var active = $(moi).attr('id').replace(/tab/,'');
  var tab = $(moi).parent().parent().parent().parent();
  var tabs = [];
  $("td.tab",tab).each(function(){
    if (!$(this).attr('class').match(/switch/))
      tabs.push($(this).attr('id').replace(/tab/,''));
  });  
  $(".inactive",tab).removeClass("inactive");
  $.each(tabs,function(a,b){
    if (b != active) {
      $("#tab" + b).addClass("inactive");
      $("#area" + b).addClass("inactive");
    }  
  });
  ui_rest_resize();
} // }}}
function ui_toggle_vis_tab(moi) {// {{{
  var tabbar = $(moi).parent().parent().parent();
  var tab = $(tabbar).parent();
  var fix = $(tab).parent();
  $('h1',moi).toggleClass('margin');
  $("tr.border",tabbar).toggleClass('hidden');
  $("div.tabbelow",tab).toggleClass('hidden');
  $("td.tabbehind button",tabbar).toggleClass('hidden');
  if ($(fix).attr('class') && $(fix).attr('class').match(/fixedstate/)) {
    $(".fixedstatehollow").height($(fix).height());
  }  
  ui_rest_resize();
}// }}}

function ui_rest_resize() {
  if ($('div.tabbed.rest .tabbar')) {
    var theight = $(window).height() - $('div.tabbed.rest .tabbar').offset().top - $('div.tabbed.rest .tabbar').height();
    $('div.tabbed.rest .tabbelow').height(theight);
    $('div.tabbed.rest .tabbelow .column').height(theight);
  }  
}  

$(document).ready(function() {
  $(window).resize(ui_rest_resize);
});

