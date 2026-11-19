$(document).ready(function() { //{{{
  $.ajax({
    type: "GET",
    url: "rngs/aggregations.rng",
    dataType: "xml",
    success: function(rng){
      save['aggregations'] = new RelaxNGui(rng,$('#dat_aggregations'));
    }
  });
  document.addEventListener('attributes:changed', function (e) {
    let aggregations = $X("<aggregations xmlns='http://cpee.org/ns/properties/2.0'/>");
    let aggregationsr;
    aggregationsr = save.attributes_raw.aggregations;
    if (aggregationsr == "" || aggregationsr == undefined) {
      return
    } else {
      // In this case we either have a single aggregation or multiple aggregations in the attributes
      try {
        aggregationsj = JSON.parse(aggregationsr);
      } catch (error) {
        console.error("aggregations are not a valid JSON:", error.message)
        return
      }
    }
    // Object will contain a filed named aggregation that contains either a single aggregation object or an array of rule objects
    aggregationsj = aggregationsj["rule"]
    if(aggregationsj == undefined) {
      console.error("aggregations json does not have the expected aggregation key")
      return
    }
    if (!Array.isArray(aggregationsj)) {
      aggregationsj = [aggregationsj];
    }
    // For each aggregation, create a aggregation node, in the rule node add the 2 nodes with their respective values
    for (let aggregationj of aggregationsj) {
      let aggregation = $X("<aggregation xmlns=\"http://cpee.org/ns/properties/2.0'\"/>");
      for(let key in aggregationj) {
        let ele = $X('<' + key + ' xmlns="http://cpee.org/ns/properties/2.0"/>');
        ele.text(aggregationj[key]);
        aggregation.append(ele);
      }
      aggregations.append(aggregation);
    }
    save['aggregations'].content(aggregations);
  });

  var timer;
  // when input in one of the inputs, save
  $(document).on('input','#dat_aggregations input',function(event){
    clearTimeout(timer);
    timer = setTimeout(function(){ do_aggregations_save(event); }, 5000);
  });
  $(document).on('relaxngui_remove', '#dat_aggregations', function(event){
    clearTimeout(timer);
    do_aggregations_save(event);
  });
  $(document).on('relaxngui_move', '#dat_aggregations', function(event){
    clearTimeout(timer);
    do_aggregations_save(event);
  });
  $(document).on('relaxngui_change', '#dat_aggregations', function(event){
    clearTimeout(timer);
    do_aggregations_save(event);
  });
}); //}}}

function do_aggregations_save(event) { //{{{
  if (save['aggregations'].has_changed()) {
    save['aggregations'].set_checkpoint();
    var url = $('body').attr('current-instance');
    let aggregationsj = save['aggregations'].save_json();
    let att = save['attributes'].save();
    if ($(' > attributes > aggregations', att).length == 0) {
      $(' > attributes',att).append($X('<aggregations xmlns="http://cpee.org/ns/properties/2.0"/>'));
    }
    $(' > attributes > aggregations', att).text(aggregationsj);
    do_parameters_save_part('attributes',$(att).serializePrettyXML());
  }
} //}}}
