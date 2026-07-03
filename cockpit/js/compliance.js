$(document).ready(function() { //{{{
  $.ajax({
    type: "GET",
    url: "rngs/requirements.rng",
    dataType: "xml",
    success: function(rng){
      save['requirements'] = new RelaxNGui(rng,$('#dat_requirements'));
    }
  });

  document.addEventListener('attributes:changed', function (e) {
    let req = $X("<requirements xmlns='http://cpee.org/ns/properties/2.0'/>");
    let reqs;
    let regex = /\"\s*=>\s*"/g
    if (save.attributes_raw.requirements.match(regex)) {
      reqs = save.attributes_raw.requirements.replace(regex,"\":\"");
    } else {
      reqs = save.attributes_raw.requirements;
    }
    reqj = JSON.parse(reqs);
    for (let key in reqj) {
      let ele = $X("<" + key + " xmlns='http://cpee.org/ns/properties/2.0'/>");
          ele.text(reqj[key]);
      req.append(ele);
    }
    save['requirements'].content(req);
  });

  var timer;
  // when input in one of the inputs, save
  $(document).on('input','#dat_requirements input',function(event){
    clearTimeout(timer);
    timer = setTimeout(function(){ do_requirements_save(event); }, 5000);
  });
  $(document).on('relaxngui_remove', '#dat_requirements', function(event){
    clearTimeout(timer);
    do_requirements_save(event);
  });
  $(document).on('relaxngui_move', '#dat_requirements', function(event){
    clearTimeout(timer);
    do_requirements_save(event);
  });
  $(document).on('relaxngui_change', '#dat_requirements', function(event){
    clearTimeout(timer);
    do_requirements_save(event);
  });
}); //}}}

function do_requirements_save(event) { //{{{
  if (save['requirements'].has_changed()) {
    save['requirements'].set_checkpoint();
    var url = $('body').attr('current-instance');
    let reqj = save['requirements'].save_json();
    let att = save['attributes'].save();
    $(' > attributes > requirements', att).text(reqj);
    do_parameters_save_part('attributes',$(att).serializePrettyXML());
  }
} //}}}
