/*
  This file is part of CPEE.

  CPEE is free software: you can redistribute it and/or modify it under the terms
  of the GNU General Public License as published by the Free Software Foundation,
  either version 3 of the License, or (at your option) any later version.

  CPEE is distributed in the hope that it will be useful, but WITHOUT ANY
  WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
  PARTICULAR PURPOSE.  See the GNU General Public License for more details.

  You should have received a copy of the GNU General Public License along with
  CPEE (file COPYING in the main directory).  If not, see
  <http://www.gnu.org/licenses/>.
*/

(function($) { //{{{
  $.fn.drags = function() {
    var drag = $(this);
     
    this.on("mousedown", function(e) {
      drag.addClass('draggable');
      $(document).one("mouseup", function(e) {
        drag.removeClass('draggable');
        e.preventDefault();
      });
      e.preventDefault();
    });
    
    $(document).on("mousemove", function(e) {
      if (!drag.hasClass('draggable'))
        return;

      var prev = drag.prev();
      var next = drag.next(); 

      // Assume 50/50 split between prev and next then adjust to
      // the next X for prev
      var total = prev.outerWidth() + next.outerWidth();

      var pos = e.pageX - prev.offset().left;
      if (pos > total) {
        pos = total;
      }
      
      var leftPercentage = pos / total;
      var rightPercentage = 1 - leftPercentage; 

      prev.css('flex', leftPercentage.toString());
      next.css('flex', rightPercentage.toString()); 

      e.preventDefault();
    });
  }
})(jQuery); //}}}

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
}// }}}

$(document).ready(function() {
  if (!($.browser.name == "Firefox" && $.browser.version >= 20) && !($.browser.name == "Chrome" && $.browser.version >= 30)) {
    $('body').children().remove();
    $('body').append('Sorry, only Firefox >= 20.0 and Chrom(e|ium) >= 17 for now.');
  }  
  $('.columnresizehandle').drags();
  $('.tabbed table.tabbar td.tab.switch').click(function(){ui_toggle_vis_tab(this);});
  $('.tabbed table.tabbar td.tab').not('.switch').click(function(){ui_tab_click(this);});
});
