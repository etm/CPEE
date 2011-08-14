function contextmenu(id, items, x, y) {
  console.log(items);
  console.log(x);
  console.log(y);
  var div = $('<div><table><tr><td><b>Selected ' + id +'</b></td></tr></div>');
  for(item in items) {
    div.children(':first').append('<tr><td>'+items[item]+'</td></tr>');
  }
  div.attr('class','contextmenu');
  div.css({'left':x-10,'top':y-10, 'display':'block'});
  $('body', document).append(div);
  $('body', document).bind('click',contextmenu_remove);

  return 42;
}

function contextmenu_remove() {
  console.log('body click');
  $('.contextmenu:first').remove();
  $('body', document).unbind('click',contextmenu_remove);
}

