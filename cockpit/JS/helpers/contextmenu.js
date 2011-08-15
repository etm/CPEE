function contextmenu(items, x, y) {
  var div = $('<div><table/></div>');
  for(item in items) {
    var row = $('<tr class="contextmenuitem"><td>' + item + '</td></tr>');
    div.children(':first').append(row);
    row.bind('click', items[item], function(event){
      console.log('with params');
      console.log(event.data.params);
      event.data.function_call.apply(null, event.data.params);
    });
  }
  div.attr('class','contextmenu');
  div.css({'left':x+5,'top':y+5, 'display':'block'});
  $('body', document).append(div);
  $('body', document).bind('click',contextmenu_remove); // must the binding also be removed? (TODO)
}

function contextmenu_remove() {
  console.log('body click');
  $('.contextmenu:first').remove();
  $('body', document).unbind('click',contextmenu_remove);
}

