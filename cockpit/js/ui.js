function config_defaults(){
  var default_values = {};
  // logs is missing, so that the button is not shown, when there is no info
  if (location.protocol.match(/^file/)) {
    default_values['res-url']  = 'http://localhost:' + $('body').data('res-port');
    default_values['base-url'] = 'http://localhost:' + $('body').data('base-port');
    default_values['save-url'] = 'http://localhost:' + $('body').data('base-port') + '/design';
  } else {
    default_values['res-url']  = location.protocol + "//" + location.hostname + ":" + $('body').data('res-port');
    default_values['base-url'] = location.protocol + "//" + location.hostname + ":" + $('body').data('base-port');
    default_values['save-url'] = location.protocol + "//" + location.hostname + ":" + $('body').data('base-port') + '/design';
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
        if (res['log-url']) { // just leave it out when it is not configured
          $("body").attr('current-logs',res['log-url'].replace("%host",window.location.host));
        }
        if (res['res-url']) {
          $("body").attr('current-resources',res['res-url'].replace("%host",window.location.host));
        } else {
          $("body").attr('current-resources',res_def['res-url'].replace("%host",window.location.host));
        }
        if (res['base-url']) {
          $("body").attr('current-base',res['base-url'].replace("%host",window.location.host));
        } else {
          $("body").attr('current-base',res_def['base-url'].replace("%host",window.location.host));
        }
        if (res['save-url']) {
          $("body").attr('current-save',res['save-url'].replace("%host",window.location.host));
        } else {
          $("body").attr('current-save',res_def['save-url'].replace("%host",window.location.host));
        }
        if (res['templates-url']) {
          $("body").attr('current-templates',res['templates-url'].replace("%host",window.location.host));
        } else {
          $("body").attr('current-templates',res_def['templates-url'].replace("%host",window.location.host));
        }
        $("input[name=res-url]").val($("body").attr('current-resources').replace("%host",window.location.host));
        $("input[name=base-url]").val($("body").attr('current-base').replace("%host",window.location.host));
        cockpit();
      },
      error: function(){
        var res = config_defaults();
        $("body").attr('current-resources',res['res-url'].replace("%host",window.location.host));
        $("body").attr('current-base',res['base-url'].replace("%host",window.location.host));
        $("body").attr('current-save',res['save-url'].replace("%host",window.location.host));
        $("body").attr('current-templates',res['templates-url'].replace("%host",window.location.host));
        $("input[name=res-url]").val($("body").attr('current-resources'));
        $("input[name=base-url]").val($("body").attr('current-base'));
        cockpit();
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
