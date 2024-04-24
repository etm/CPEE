$(document).ready(function(){
  var history = 1;
  var current_command = 1;
  var dragging = 0;
  var url = location.href + (location.href.match(/\/$/) ? '' : '/');
  var ansi_up = new AnsiUp;
  $('.console-line:last-child .edit').focus();
  $(document).on('click', '.console-line:last-child', function(e) {
    $('.console-line:last-child .edit').focus();
  });
  $(document).on('keydown', 'body', function(e) {
    if ((e.ctrlKey && e.keyCode == 86) || !e.ctrlKey) {
      $('.console-line:last-child .edit').focus();
    } else {
      return;
    }
    if (e.keyCode == 38) {
      var anakin = $('.console-line:last-child .edit');
      if(current_command<history) {
        current_command++;
      }
      anakin.text($(".console-line:nth-last-child("+current_command+") > .edit").text());
      anakin.focus();
      jQuery.event.trigger({type:'keyup',which:35,charCode:35,ctrlKey: false});
      return false;
    } else if (e.keyCode == 40) {
      var anakin = $('.console-line:last-child .edit');
      if(current_command>1) {
        current_command--;
      }
      anakin.html($(".console-line:nth-last-child("+current_command+") > .edit").text());
    } else if (e.keyCode == 13) {
      var anakin = $('.console-line:last-child .edit');
      var anakin_str = anakin.text().split(" ");
      var command= "";
      var cc = 0;
      history++;
      current_command=1;
      anakin_str.forEach(function(x){
        if (cc==0){
          command="cmd="+x;
          cc++;
        } else{
          command+=" "+x;
        }
      });
      if(anakin_str[0]=="clear"){
        window.location.reload();
        return false;
      }
      $.ajax({
        url: url,
        type: 'get',
        data: command,
        success: function(data) {
          if(jQuery.type(data)=="string"){
            var appendix = '';
            appendix += $.trim(data) + "\n";
            if(anakin_str[0]=="help")
              appendix+="\033[1m\033[31mclear\033[0m\033[0m\n  Clear screen.";
            var node = $("<div style='white-space: pre-wrap;'/>");
                node.html(ansi_up.ansi_to_html(appendix));
            anakin.parent().append(node);
          }
        },
        error: function(data) {
          anakin.parent().append("<div>server made a boo boo</div>");
        },
        complete: function(data) {
          var node = $("#console-template").clone().appendTo("body");
          node.show();
          node.removeAttr('id');
          $('.edit:last-child',node).focus();
        }
      });
      anakin.attr('contenteditable',false);
      return false;
    }
  });
});
