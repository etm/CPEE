$(document).ready(function() {
  $("#replay button").click(e => {
    $.ajax({
      url: $('#replay input').val(),
      type: 'GET',
      success: function(re) {
        ma = re.match(/--\nevent:\n(.|\n)*?\n-/g);
        ma.forEach(m => {
          console.log(m.replace(/^--\nevent:\n/g,'').replace(/\n-$/g,''));
        });
      }
    });


    // load log with ajax
    // extract process model
    // initialize process model
    // set attributes
    // change start button to do replay
  });
});
