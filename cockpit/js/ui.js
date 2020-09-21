$(document).ready(function() {
  if (!($.cookie('cpee_iagree')) && $("body > div[id='disclaimer']").length > 0) {
    $("body > :not([id='disclaimer'])").remove();
    $("body > [id='disclaimer']").removeClass('hidden');

    $("#iagree").click(function(){
      if($(this).is(':checked')){
        $("#icontinue").prop("disabled", false);
      } else {
        $("#icontinue").prop("disabled", true);
      }
    });
    $("#icontinue").click(function(){
      $.cookie('cpee_iagree','yes');
      location.reload();
    });
  } else {
    $.ajax({
      url: "config.json",
      success: function(res){
        $("input[name=res-url]").val(res['res-url']);
        $("input[name=base-url]").val(res['base-url']);
        $("body").attr('current-resources',res['res-url']);
        $("body").attr('current-base',res['base-url']);
        $("body").attr('current-save',res['save-url']);
        $("body").attr('current-templates',res['testsets-url']);
        cockpit();
      },
      error: function(){
        $("body").attr('current-templates','templates/');
        if (location.protocol.match(/^file/)) {
          $("body").attr('current-resources',"http://localhost:" + $('body').data('res-port'));
          $("body").attr('current-base',"http://localhost:" + $('body').data('base-port'));
          $("body").attr('current-save',"http://localhost:" + $('body').data('base-port') + '/design');
        } else {
          $("body").attr('current-resources',location.protocol + "//" + location.hostname + ":" + $('body').data('res-port'));
          $("body").attr('current-base',location.protocol + "//" + location.hostname + ":" + $('body').data('base-port'));
          $("body").attr('current-save',location.protocol + "//" + location.hostname + ":" + $('body').data('base-port') + '/design');
        }
        $("input[name=res-url]").val($("body").attr('current-resources'));
        $("input[name=base-url]").val($("body").attr('current-base'));
        cockpit();
      }
    });
  }
});

$(document).on('copy', '[contenteditable]', function (e) {
  e = e.originalEvent;
  var selectedText = window.getSelection();
  var range = selectedText.getRangeAt(0);
  var selectedTextReplacement = range.toString()
  e.clipboardData.setData('text/plain', selectedTextReplacement);
  e.preventDefault(); // default behaviour is to copy any selected text
});

// Paste fix for contenteditable
$(document).on('paste', '[contenteditable]', function (e) {
    e.preventDefault();

    if (window.clipboardData) {
        content = window.clipboardData.getData('Text');
        if (window.getSelection) {
            var selObj = window.getSelection();
            var selRange = selObj.getRangeAt(0);
            selRange.deleteContents();
            selRange.insertNode(document.createTextNode(content));
        }
    } else if (e.originalEvent.clipboardData) {
        content = (e.originalEvent || e).clipboardData.getData('text/plain');
        document.execCommand('insertText', false, content);
    }
});
