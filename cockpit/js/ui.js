function config_defaults(){
  var default_values = {};
  // logs is missing, so that the button is not shown, when there is no info
  if (location.protocol.match(/^file/)) {
    default_values['base-url'] = 'http://localhost:' + $('body').data('base-port');
  } else if (location.port == '') {
    default_values['base-url'] = $.path_join(location.protocol + "//", location.hostname, location.pathname, $('body').data('base-engine'));
  } else {
    default_values['base-url'] = location.protocol + "//" + location.hostname + ":" + $('body').data('base-port');
  }
  default_values['templates-url'] = 'templates/';
  return default_values;
}

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
        var res_def = config_defaults();
        $("body").attr('current-base',(res['base-url'] || res_def['base-url']).replace("%host",window.location.host));
        $("body").attr('current-templates',(res['templates-url'] || res_def['templates-url']).replace("%host",window.location.host));
        $.each(res, function(key, value){ // just leave it out when it is not configured
          if (key != 'base-url' && key != 'templates-url') {
            $("body").attr('current-' + key.replace(/-url$/,''), value.replace("%host",window.location.host));
          }
        });
        cockpit();
      },
      error: function(){
        alert('fix your config.json');
      }
    });
  }
});

// unmark if storage changes. shit has potentially been copied or marked in other tabs.
$(window).bind('storage', function (e) {
  if (localStorage.getItem('marked_from') != myid) {
    save['graph_adaptor'].illustrator.get_elements().removeClass('marked');
  }
});
