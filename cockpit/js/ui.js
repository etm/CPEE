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
    cockpit();
  }
});
