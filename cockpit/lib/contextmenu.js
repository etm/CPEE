function contextmenu(items, e) {
  var x = e.pageX;
  var y = e.pageY;
  console.log("1");
  if($('div.contextmenu').length > 0) contextmenu_remove();
  console.log("2");
  var div = $('<div><table class="contextmenu"/></div>');
  for(head in items) {
    div.children(':first').append('<tr class="contextmenuheader"><td colspan="2">' + head + '</td></tr>');
    for(item in items[head]) {
      var icon = null;
      if(items[head][item].menu_icon) {
        icon = $X('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" height="2em" width="2em">' +
                    '<g transform="translate(5,8) scale(0.5, 0.5)"/>' +
                  '</svg>');
        icon.children('g').append(items[head][item].menu_icon().children());
        icon = icon.serializeXML();
      }
      var row = $('<tr class="contextmenuitem"><td class="contextmenuicon">' + (icon == null ? '' : icon) + '</td><td>' + items[head][item].label + '</td></tr>');
      div.children(':first').append(row);
      row.bind('click', items[head][item], function(event){
        event.data.function_call.apply(null, event.data.params);
      });
    }
  }
  div.attr('class','contextmenu');
  div.css({'left':x+5,'top':y+5, 'display':'block'});
  $('body', document).append(div);
  if((document.body.clientHeight < (y + div.height())) && (y-div.height()-5 >= 0)) { // contextmenu is positioned upwards
    div.css({'top':y-div.height()-5});
  }
  if((document.body.clientWidth < (x + div.width())) && (x-div.width()-5 >= 0)) { // contextmenu is positioned upwards
    div.css({'left':x-div.width()-5});
  }
  e.stopPropagation();
  $('body', document).bind('mousedown',contextmenu_remove); 
}

function contextmenu_remove() {
  console.log('remove CM');
  $('.contextmenu:first').remove();
  $('body', document).unbind('mousedown',contextmenu_remove);
}

