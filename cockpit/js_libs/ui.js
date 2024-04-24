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

function ui_click_tab(moi) { // {{{
  $(moi).trigger('click');
} // }}}

function ui_close_tab(moi){
  var active = $(moi).parent().attr('data-tab');
  var tabbed = $(moi).parent().parent().parent();
  var is_inactive = $(moi).parent().hasClass('inactive');
  $('*[data-tab=' + active + ']').remove();
  $('*[data-belongs-to-tab=' + active + ']').remove();
  if (!is_inactive)
    ui_click_tab($('ui-tabbar ui-tab.default'));
}

function ui_add_close(moi) {
  $(moi).append($('<ui-close>✖</ui-close>'));
}

function ui_empty_tab_contents(id) {
  $('ui-content ui-area[data-belongs-to-tab=' + id + ']').empty();
}

function ui_add_tab(tabbed,title,id,closeable,additionalclasses) {
  additionalclasses = typeof additionalclasses !== 'undefined' ? additionalclasses : '';
  if ($('ui-tabbar ui-tab[data-tab=' + id + ']').length > 0) {
    ui_activate_tab($('ui-tabbar ui-tab[data-tab=' + id + ']'));
    return false;
  } else {
    var instab = $("<ui-tab class='inactive" + (closeable ? ' closeable' : '') + (additionalclasses == '' ? '' : ' ' + additionalclasses) + "' data-tab='" + id + "'>" + title + "</ui-tab>");
    var insarea = $("<ui-area data-belongs-to-tab='" + id + "' class='inactive'></ui-area>");
    $(tabbed).find('ui-behind').before(instab);
    $(tabbed).find('ui-content').append(insarea);
    ui_add_close($('ui-tabbar ui-tab[data-tab=' + id + ']'));
    return true;
  }
}
function ui_add_tab_active(tabbed,title,id,closeable,additionalclasses) {
  var state = ui_add_tab(tabbed,title,id,closeable,additionalclasses);
  if (state) { ui_activate_tab($('ui-tabbar ui-tab[data-tab=' + id + ']')); }
  return state;
}

function ui_clone_tab(tabbar,original,title,id,closeable,additionalclasses) {
  additionalclasses = typeof additionalclasses !== 'undefined' ? additionalclasses : '';
  var instab = $("<ui-tab class='inactive" + (closeable ? ' closeable' : '') + (additionalclasses == '' ? '' : ' ' + additionalclasses) + "' data-tab='" + id + "' id='tab_" + id + "'>" + title + "</ui-tab>");
  var insarea = original.clone();
  insarea.attr("data-belongs-to-tab",id);
  insarea.attr("class","inactive");
  $(tabbar).find('ui-behind').before(instab);
  $(tabbar).parent().append(insarea);
  ui_add_close($('ui-tabbed ui-tab[data-tab=' + id + ']'));
}

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
    var initheight = 0;

    this.on("mousedown", function(e) {
      drag.addClass('draggable');
      initpos = e.pageY;
      initheight = $("ui-content",prev).height();
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

      $("ui-content",prev).css('height', pos.toString());

      e.preventDefault();
    });
  }
})(jQuery); //}}}

function ui_activate_tab(moi) { // {{{
  var active = $(moi).attr('data-tab');
  var tabbed = $(moi).parent().parent();
  var tabs = [];
  $("ui-tabbar > ui-tab",tabbed).each(function(){
    if (!$(this).attr('class').match(/switch/)) {
      tabs.push($(this).attr('data-tab'));
    }
  });
  $(".inactive",tabbed).removeClass("inactive");
  $.each(tabs,function(a,b){
    if (b != active) {
      $("ui-tabbar ui-tab[data-tab=" + b + "]",tabbed).addClass("inactive");
      $("ui-content *[data-belongs-to-tab=" + b + "]",tabbed).addClass("inactive");
    }
  });
} // }}}
function ui_toggle_vis_tab(moi) {// {{{
  if ($(moi)[0].nodeName == 'UI-TABBED') {
    var tabbed = $(moi);
  }
  if ($(moi)[0].nodeName == 'UI-TAB') {
    var tabbed = $(moi).parent().parent();
  }
  if (tabbed) {
    tabbed.toggleClass('off');
  }
}// }}}

$(document).ready(function() {
  if (!($.browser.name == "Firefox" && $.browser.version >= 20) && !($.browser.name == "Chrome" && $.browser.version >= 30)) {
    $('body').children().remove();
    $('body').append('Sorry, only Firefox >= 20.0 and Chrom(e|ium) >= 17 for now.');
  }
  $('ui-rest ui-content ui-resizehandle').dragcolumn();
  $('*[is=x-ui] > ui-resizehandle').dragresize();
  $(document).on('click','ui-tabbar ui-tab.switch',function(){ui_toggle_vis_tab(this);});
  $(document).on('click','ui-tabbar ui-tab:not(.switch)',function(){ui_activate_tab(this);});
  ui_add_close($('ui-tabbar ui-tab.closeable'));
  $(document).on('click','ui-tabbar ui-tab.closeable ui-close',function(){ui_close_tab(this);});
});
