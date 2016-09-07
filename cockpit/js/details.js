$(document).ready(function() {
  $('#main ui-tabbar ui-behind button').hide();

  // save button shown or not //{{{
  $('#main ui-tabbar ui-tab:not(.switch)').click(function(event){
    var me = $(event.target);
    if ($('#state').text() != 'finished')
      if (me.data('tab') == 'details') {
        $('#main ui-tabbar ui-behind button').show();
      } else {
        $('#main ui-tabbar ui-behind button').hide();
      }
  }); //}}}

  $('#main ui-tabbar ui-behind button').click(function(event){
    if (save['details'].has_changed()) {
      var visid = 'details';
      var svgid = save[visid + '_target'].svgid;
      var desc  = save[visid + '_target'].model;
      var node  = desc.get_node_by_svg_id(svgid);

      var url = $("#current-instance").text();
      $('#main ui-tabbar ui-behind button').removeClass('highlight');
      save['details'].set_checkpoint();

      var nnew = $(save['details'].save().documentElement);
          nnew.attr('svg-id',svgid);

      node.replaceWith(nnew);

      $.ajax({
        type: "PUT",
        url: url + "/properties/values/description/",
				data: ({'content': '<content>' + desc.get_description() + '</content>'})
      });
    }
  }); //}}}

  $(document).on('keyup','#dat_details input, #dat_details textarea, #dat_details select',function(e){ mark_main_save(); });
  $(document).on('change','#dat_details select',function(e){ mark_main_save(); });
});

function mark_main_save() { //{{{
  if (save['details'].has_changed()) {
    $('#main ui-tabbar ui-behind button').addClass('highlight');
  } else {
    $('#main ui-tabbar ui-behind button').removeClass('highlight');
  }
} //}}}
