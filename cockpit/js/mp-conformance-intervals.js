$(document).ready(function() { //{{{
  $.ajax({
    type: "GET",
    url: "rngs/intervals.rng",
    dataType: "xml",
    success: function(rng){
      save['intervals'] = new RelaxNGui(rng,$('#dat_intervals'));
    }
  });
  document.addEventListener('attributes:changed', function (e) {
    let intervals = $X("<intervals xmlns='http://cpee.org/ns/properties/2.0'/>");
    let intervalsr;
    intervalsr = save.attributes_raw.intervals;
    if (intervalsr == "" || intervalsr == undefined) {
      return
    } else {
      // In this case we either have a single interval or multiple intervals in the attributes
      try {
        intervalsj = JSON.parse(intervalsr);
      } catch (error) {
        console.error("Intervals are not a valid JSON:", error.message)
        return
      }
    }
    // Object will contain a filed named interval that contains either a single interval object or an array of interval objects
    intervalsj = intervalsj["interval"]
    if(intervalsj == undefined) {
      console.error("Intervals json does not have the expected interval key")
      return
    }
    if (!Array.isArray(intervalsj)) {
      intervalsj = [intervalsj];
    }
    // For each interval, create a interval node, in the interval node add the 2 nodes with their respective values
    for (let intervalj of intervalsj) {
      let interval = $X("<interval xmlns=\"http://cpee.org/ns/properties/2.0'\"/>");
      for(let key in intervalj) {
        let ele = $X('<' + key + ' xmlns="http://cpee.org/ns/properties/2.0"/>');
        ele.text(intervalj[key]);
        interval.append(ele);
      }
      intervals.append(interval);
    }
    save['intervals'].content(intervals);
  });

  var timer;
  // when input in one of the inputs, save
  $(document).on('input','#dat_intervals input',function(event){
    clearTimeout(timer);
    timer = setTimeout(function(){ do_intervals_save(event); }, 5000);
  });
  $(document).on('relaxngui_remove', '#dat_intervals', function(event){
    clearTimeout(timer);
    do_intervals_save(event);
  });
  $(document).on('relaxngui_move', '#dat_intervals', function(event){
    clearTimeout(timer);
    do_intervals_save(event);
  });
  $(document).on('relaxngui_change', '#dat_intervals', function(event){
    clearTimeout(timer);
    do_intervals_save(event);
  });
}); //}}}

function do_intervals_save(event) { //{{{
  if (save['intervals'].has_changed()) {
    save['intervals'].set_checkpoint();
    var url = $('body').attr('current-instance');
    let intervalsj = save['intervals'].save_json();
    let att = save['attributes'].save();
    if ($(' > attributes > intervals', att).length == 0) {
      $(' > attributes',att).append($X('<intervals xmlns="http://cpee.org/ns/properties/2.0"/>'));
    }
    $(' > attributes > intervals', att).text(intervalsj);
    do_parameters_save_part('attributes',$(att).serializePrettyXML());
  }
} //}}}
