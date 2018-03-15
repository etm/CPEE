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
        $("body").attr('current-testsets',res['testsets-url']);
        cockpit();
      },
      error: function(){
        $("body").attr('current-testsets','testsets/');
        if (location.protocol.match(/^file/)) {
          $("input[name=base-url]").val("http://localhost:" + $('body').data('base-port'));
          $("input[name=repo-url]").val("http://localhost:" + $('body').data('res-port'));
        } else {
          $("input[name=base-url]").val(location.protocol + "//" + location.hostname + ":" + $('body').data('base-port'));
          $("input[name=repo-url]").val(location.protocol + "//" + location.hostname + ":" + $('body').data('res-port'));
        }
        cockpit();
      }
    });
  }
});
