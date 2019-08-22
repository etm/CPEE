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
        $("input[name=repo-url]").val(res['repo-url']);
        $("input[name=base-url]").val(res['base-url']);
        $("body").attr('current-resources',res['repo-url']);
        $("body").attr('current-base',res['base-url']);
        $("body").attr('current-testsets',res['testsets-url']);
        cockpit();
      },
      error: function(){
        $("body").attr('current-testsets','testsets/');
        if (location.protocol.match(/^file/)) {
          $("body").attr('current-resources',"http://localhost:" + $('body').data('res-port'));
          $("body").attr('current-base',"http://localhost:" + $('body').data('base-port'));
        } else {
          $("body").attr('current-resources',location.protocol + "//" + location.hostname + ":" + $('body').data('res-port'));
          $("body").attr('current-base',location.protocol + "//" + location.hostname + ":" + $('body').data('base-port'));
        }
        $("input[name=repo-url]").val($("body").attr('current-resources'));
        $("input[name=base-url]").val($("body").attr('current-base'));
        cockpit();
      }
    });
  }
});
