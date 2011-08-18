function contextmenu(items, x, y) {
  if($('div.contextmenu').length > 0) contextmenu_remove();
  var div = $('<div><table class="contextmenu"/></div>');
  for(head in items) {
    div.children(':first').append('<tr class="contextmenuheader"><td>' + head + '</td></tr>');
    for(item in items[head]) {
      var row = $('<tr class="contextmenuitem"><td>' + items[head][item].label + '</td></tr>');
      div.children(':first').append(row);
      row.bind('click', items[head][item], function(event){
        console.log(event.data.params);
        console.log(items[head][item].label);
        event.data.function_call.apply(null, event.data.params);
      });
    }
  }
  div.attr('class','contextmenu');
  div.css({'left':x+5,'top':y+5, 'display':'block'});
  $('body', document).append(div);
  $('body', document).bind('click',contextmenu_remove); // must the binding also be removed? (TODO)
  if(document.body.clientHeight - 20 < (y + div.height())) { // contextmenu is positioned upwards
    div.css({'top':y-div.height()-5});
  }
  if(document.body.clientWidth - 20 < (x + div.width())) { // contextmenu is positioned upwards
    div.css({'left':x-div.width()-5});
  }
}

function contextmenu_remove() {
  $('.contextmenu:first').remove();
  $('body', document).unbind('click',contextmenu_remove);
}

