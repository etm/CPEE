$(document).ready(function() {
  // hook up dataelements with relaxngui //{{{
  $.ajax({
    type: "GET",
    url: "rngs/dataelements.rng",
    dataType: "xml",
    success: function(rng){
      save['dataelements'] = new RelaxNGui(rng,$('#dat_dataelements'));
    }
  }); //}}}
  // hook up endpoints with relaxngui //{{{
  $.ajax({
    type: "GET",
    dataType: "xml",
    url: "rngs/endpoints.rng",
    success: function(rng){
      save['endpoints'] = new RelaxNGui(rng,$('#dat_endpoints'));
    }
  }); //}}}
  // hook up attributes with relaxngui //{{{
  $.ajax({
    type: "GET",
    dataType: "xml",
    url: "rngs/attributes.rng",
    success: function(rng){
      save['attributes'] = new RelaxNGui(rng,$('#dat_attributes'));
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

  var timer;
  // when input in one of the inputs, save
  $(document).on('input','#dat_dataelements input, #dat_endpoints input, #dat_attributes input',function(event){
    clearTimeout(timer);
    timer = setTimeout(function(){ do_parameters_save(event); }, 5000);
  });
  $(document).on('blur','#dat_dataelements input, #dat_endpoints input, #dat_attributes input',function(event){
    clearTimeout(timer);
    do_parameters_save(event);
  }); //}}}
  $(document).on('keypress','#dat_dataelements input, #dat_endpoints input, #dat_attributes input',function(event){
    if (event.keyCode == 13) {
      clearTimeout(timer);
      do_parameters_save(event);
    }
  }); //}}}
  $(document).on('relaxngui_remove', '#dat_dataelements, #dat_endpoints, #dat_attributes', function(event){
    clearTimeout(timer);
    do_parameters_save(event);
  });
});

function do_parameters_save(event) { //{{{
  var visid = $('ui-tabbar ui-tab',$(event.target).parents('ui-tabbed')).not('.switch').not('.inactive').attr('data-tab');
  if (save[visid].has_changed()) {
    var url = $("#current-instance").text();
    save[visid].set_checkpoint();
    $.ajax({
       type: "PUT",
       url: url + "/properties/values/" + visid + "/",
       data: ({'content': save[visid].save_text()}),
    });
  }
} //}}}
