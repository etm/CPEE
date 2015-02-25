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
  $.fn.dragcolumn = function() {
    var drag = $(this);
    var prev = drag.prev();
    var next = drag.next(); 
     
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
  $.fn.dragresize = function() {
    var drag = $(this);
    var prev = drag.prev();
    var initpos = 0;
    var initheight = $(".content",prev).height();
     
    this.on("mousedown", function(e) {
      drag.addClass('draggable');
      initpos = e.pageY;
      $(document).one("mouseup", function(e) {
        drag.removeClass('draggable');
        e.preventDefault();
      });
      e.preventDefault();
    });
    
    $(document).on("mousemove", function(e) {
      if (!drag.hasClass('draggable'))
        return;

      var pos = initheight - (initpos - e.pageY);
      if (pos < 0)
        return;

      $(".content",prev).css('height', pos.toString());

      e.preventDefault();
    });
  }
})(jQuery); //}}}

function ui_tab_click(moi) { // {{{
  var active = $(moi).attr('data-tab');
  var tabbed = $(moi).parents('.tabbed');
  var tabs = [];
  $(".tab",tabbed).each(function(){
    if (!$(this).attr('class').match(/switch/))
      tabs.push($(this).attr('data-tab'));
  });  
  $(".inactive",tabbed).removeClass("inactive");
  $.each(tabs,function(a,b){
    if (b != active) {
      $(".tab[data-tab=" + b + "]",tabbed).addClass("inactive");
      $(".area[data-belongs-to-tab=" + b + "]",tabbed).addClass("inactive");
    }  
  });
} // }}}
function ui_toggle_vis_tab(moi) {// {{{
  var tabbed = $(moi).parents('.tabbed');
  tabbed.toggleClass('off');
}// }}}

$(document).ready(function() {
  if (!($.browser.name == "Firefox" && $.browser.version >= 20) && !($.browser.name == "Chrome" && $.browser.version >= 30)) {
    $('body').children().remove();
    $('body').append('Sorry, only Firefox >= 20.0 and Chrom(e|ium) >= 17 for now.');
  }  
  $('.tabbed.rest .content .area.resizehandle').dragcolumn();
  $('.resizehandle:not(.area)').dragresize();
  $('.tabbed .tabbar .tab.switch').click(function(){ui_toggle_vis_tab(this);});
  $('.tabbed .tabbar .tab').not('.switch').click(function(){ui_tab_click(this);});
});
