$(document).ready(function() {
  if (!($.cookie('cpee_iagree'))) {
    var skip = false;

    $('body').children().each(function(key,c){
      if (skip) {
        $(c).remove();
      } else {
        $(c).removeClass('hidden');
      }
      skip = true;
    });

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
  }
});
