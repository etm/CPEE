$(document).ready(function() {
  $("#replay button").click(e => {
    $.ajax({
      url: $('#replay input').val(),
      type: 'GET',
      success: function(re) {
        var de;
        var ep;
        var at;
        var desc;
        try {
          jsyaml.loadAll(re,e => {
            if (e.event && e.event['cpee:lifecycle:transition'] == 'dataelements/change') {
              de = e.event.data.data_values;
            }
            if (e.event && e.event['cpee:lifecycle:transition'] == 'endpoints/change') {
              ep = e.event.data.data_values;
            }
            if (e.event && e.event['cpee:lifecycle:transition'] == 'attributes/change') {
              at = e.event.data.data_values;
            }
            if (e.event && e.event['cpee:description']) {
              desc = e.event['cpee:description'];
            }
            if (e.event && e.event['cpee:state'] == 'running') {
              throw BreakException;
            }
          });
        } catch(e) { /* just to break out of the iterator. what a shitty language */ }
      }
    });


    // load log with ajax
    // extract process model
    // initialize process model
    // set attributes
    // change start button to do replay
  });
});
