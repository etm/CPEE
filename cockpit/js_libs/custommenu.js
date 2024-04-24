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

function CustomMenu(e) {
  var target = $(e.target);
  var off = target.offset();
  var remove = function(event) {};
  this.remove = remove;
  e.stopPropagation();

  this.contextmenu = function(items) {
    remove = function(event) {
      if (!event) {
        $('.contextmenu:first').remove();
        $('body', document).unbind('mousedown',remove);
        return;
      }

      if($(event.target).parent('tr.contextmenuitem') && (event.button == 0)) { $(event.target).click(); }
      $('.contextmenu:first').remove();
      $('body', document).unbind('mousedown',remove);
    }
    $('body', document).bind('mousedown',remove);

    if($('div.contextmenu').length > 0) remove();
    var div = $('<div class="contextmenu" oncontextmenu="return false"><table class="contextmenu"/></div>');
    for(head in items) {
      div.children(':first').append('<tr class="contextmenuheader"><td colspan="2">' + head + '</td></tr>');
      for(item of items[head]) {
        var icon = null;
        if(item.menu_icon) {
          icon = $X('<svg xmlns="http://www.w3.org/2000/svg" version="1.1">' +
                      '<g transform="translate(1,1) scale(0.5, 0.5)"/>' +
                    '</svg>');
          icon.children('g').append(item.menu_icon.clone().children());
          icon = icon.serializeXML();
        }
        if(item.text_icon) {
          icon = item.text_icon;
        }
        var row = $('<tr class="contextmenuitem"><td class="contextmenuicon"><div>' + (icon == null ? '' : icon) + '</div></td><td class="' + (item.class ? ' ' + item.class: '') + '">' + item.label + '</td></tr>');
        div.children(':first').append(row);
        row.bind('click', item, function(event){
          event.data.function_call.apply(null, event.data.params);
        });
      }
    }
    div.css({'left':off.left+15,'top':off.top+15, 'display':'block'});
    $('body', document).append(div);
    if(($(window).height() < (off.top + div.height() + 15))) { // contextmenu is position
      div.css({'top':$(window).height()-div.height()-15});
    }
    if((document.body.clientWidth < (off.left + div.width())) && (off.left-div.width()-15 >= 0)) { // contextmenu is position
      div.css({'left':off.left-div.width()-15});
    }
  }

  this.menu = function(menu,call) {
    remove = function(event) {
      if ($(event.target).parent('div.menu') && (event.button == 0)) { $(event.target).click(); }
      menu.hide();
      $('body', document).unbind('mousedown',remove);
      $("div.menuitem",$(menu)).each(function(ind,ele){
        $(ele).unbind('click',mitemclick);
      });
    }

    menu.show();
    var mitemclick = function(ele){
      $("div.menuitem[data-selected=selected]",$(menu)).each(function(ind,rem){ $(rem).removeAttr('data-selected'); });
      $(ele.target).attr('data-selected','selected');
      call(ele.target);
    };
    $('body', document).bind('mousedown',remove);

    $("div.menuitem",$(menu)).each(function(ind,ele){
      $(ele).bind('click',mitemclick);
    });

    menu.css({'left':off.left,'top':off.top+target.outerHeight() + 1,'min-width': target.width()});
    if(($(window).height() < (off.top + menu.height() + 15))) {
      menu.css({'top':$(window).height()-menu.height()-15});
    }
    if((document.body.clientWidth < (off.left + menu.width())) && (off.left-menu.width()-15 >= 0)) {
      menu.css({'left':off.left-menu.width()-15});
    }
  }
}
