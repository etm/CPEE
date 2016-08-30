$(document).ready(function() {
  $('#main ui-behind button').hide();

  // save buttons shown or not //{{{
  $('#main ui-tabbar ui-tab:not(.switch)').click(function(event){
    var me = $(event.target).parents('ui-tab');
    if ($('#state').text() != 'finished')
      if (me.attr('id') == 'tabdetails') {
        $('#main ui-behind button').show();
      } else {
        $('#main ui-behind button').hide();
      }
  }); //}}}

  $('#main ui-behind button:nth-child(2)').click(function(event){
    var visid = $('ui-tabbar ui-tab',$(event.target).parents('ui-tabbed')).not('.switch').not('.inactive').attr('data-tab');
    if (save[visid].has_changed()) {
      var url = $("#current-instance").text();
      $('#main ui-tabbar ui-behind button:nth-child(2)').removeClass('highlight');
      save[visid].set_checkpoint();
      $.ajax({
        type: "PUT",
        url: url + "/properties/values/description/",
        data: ({'content': save[visid].save_text()}),
      });
    }
  }); //}}}

  $(document).on('keyup','#dat_details input.pair_name, #dat_details input.prop_value, #dat_details textarea.prop_value, #dat_details select.prop_value, #dat_details input.pair_value',function(e){ mark_main_save($(e.target).parents('ui-tabbed')); });
  $(document).on('change','#dat_details select.prop_value',function(e){ mark_main_save($(e.target).parents('ui-tabbed')); });
});

function mark_main_save(top) { //{{{
  var visid = $('ui-tabbar ui-tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');

  if (save[visid].has_changed()) {
    $('ui-tabbar ui-behind button',top).addClass('highlight');
  } else {
    $('ui-tabbar ui-behind button',top).removeClass('highlight');
  }
} //}}}
