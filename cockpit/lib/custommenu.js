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
  var x = e.pageX;
  var y = e.pageY;
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
    var div = $('<div class="contextmenu"><table class="contextmenu"/></div>');
    for(head in items) {
      div.children(':first').append('<tr class="contextmenuheader"><td colspan="2">' + head + '</td></tr>');
      for(item in items[head]) {
        var icon = null;
        if(items[head][item].menu_icon) {
          icon = $X('<svg xmlns="http://www.w3.org/2000/svg" version="1.1">' +
                      '<g transform="translate(1,1) scale(0.5, 0.5)"/>' +
                    '</svg>');
          icon.children('g').append(items[head][item].menu_icon().children());
          icon = icon.serializeXML();
        }
        var row = $('<tr class="contextmenuitem"><td class="contextmenuicon"><div>' + (icon == null ? '' : icon) + '</div></td><td>' + items[head][item].label + '</td></tr>');
        div.children(':first').append(row);
        row.bind('click', items[head][item], function(event){
          event.data.function_call.apply(null, event.data.params);
        });
      }
    }
    div.css({'left':x+5,'top':y+5, 'display':'block'});
    $('body', document).append(div);
    if(($(window).height() < (y + div.height()))) { // contextmenu is position
      div.css({'top':$(window).height()-div.height()-5});
    }
    if((document.body.clientWidth < (x + div.width())) && (x-div.width()-5 >= 0)) { // contextmenu is position
      div.css({'left':x-div.width()-5});
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

    var off = target.offset();

    menu.css({'left':off.left,'top':off.top+target.outerHeight() + 1,'min-width': target.width()});
    if(($(window).height() < (y + menu.height()))) {
      menu.css({'top':$(window).height()-menu.height()-5});
    }
    if((document.body.clientWidth < (x + menu.width())) && (x-menu.width()-5 >= 0)) {
      menu.css({'left':x-menu.width()-5});
    }
  }
}  
