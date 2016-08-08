$(document).ready(function() {
  // hook up dataelements with relaxngui //{{{
  $.ajax({
    type: "GET",
    url: "rngs/dataelements.rng",
    success: function(rng){
      save['dataelements'] = new RelaxNGui(rng,$('#dat_dataelements'));
    }
  }); //}}}
  // hook up endpoints with relaxngui //{{{
  $.ajax({
    type: "GET",
    url: "rngs/endpoints.rng",
    success: function(rng){
      save['endpoints'] = new RelaxNGui(rng,$('#dat_endpoints'));
    }
  }); //}}}
  // hook up attributes with relaxngui //{{{
  $.ajax({
    type: "GET",
    url: "rngs/attributes.rng",
    success: function(rng){
      save['attributes'] = new RelaxNGui(rng,$('#dat_attributes'));
    }
  }); //}}}

  // color of save button when changeing tabs //{{{
  $('#parameters ui-tabbar ui-tab:not(.switch)').click(function(event){
    highlight_save_button(event);
  }); //}}}

  // save entries //{{{
  $('#parameters ui-behind button:nth-child(2)').click(function(event){
    var visid = $('ui-tabbar ui-tab',$(event.target).parents('ui-tabbed')).not('.switch').not('.inactive').attr('data-tab');
    if (save[visid].has_changed()) {
      var url = $("#current-instance").text();
      $('#parameters ui-tabbar ui-behind button:nth-child(2)').removeClass('highlight');
      save[visid].set_checkpoint();
      $.ajax({
        type: "PUT",
        url: url + "/properties/values/" + visid + "/",
        data: ({'content': save[visid].save_text()}),
      });
    }
  }); //}}}

  // new entry //{{{
  $('#parameters ui-behind button:nth-child(1)').click(function(event){
    var but = $(document).find('#parameters ui-content ui-area:not(.inactive) button');
        but.click();
    var are = $(document).find('#parameters ui-content ui-area:not(.inactive)');
    var tab = $(document).find('#parameters ui-content ui-area:not(.inactive) .relaxngui_table');
        are.animate({ scrollTop: tab.height() }, "slow");
  }); //}}}

  // when keyup in one of the inputs, highlight the save button //{{{
  $(document).on('keyup','#dat_dataelements input, #dat_endpoints input, #dat_attributes input',function(event){
    highlight_save_button(event);
  }); //}}}
});

function highlight_save_button(event) {
  var visid = $('ui-tabbar ui-tab',$(event.target).parents('ui-tabbed')).not('.switch').not('.inactive').attr('data-tab');
  if (save[visid].has_changed()) {
    $('#parameters ui-tabbar ui-behind button:nth-child(2)').addClass('highlight');
  } else {
    $('#parameters ui-tabbar ui-behind button:nth-child(2)').removeClass('highlight');
  }
}
