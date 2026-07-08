$(document).ready(function() { //{{{
  $.ajax({
    type: "GET",
    url: "rngs/requirements.rng",
    dataType: "xml",
    success: function(rng){
      save['requirements'] = new RelaxNGui(rng,$('#dat_requirements'));
    }
  });

  $("#verify").click(function(){
    var uuid = save.attributes_raw && save.attributes_raw.uuid;
    if (!uuid) {
      $('#comp_log').html('<p>No instance loaded.</p>');
      return;
    }

    var baseUrl = 'https://cpee.org/comp-log/';
    var currentUrl = baseUrl + uuid + '.xes.yaml';
    var allUrl    = baseUrl + uuid + '.all.xes.yaml';

    $('#comp-all-log').attr('href', allUrl).show();

    function tryLoad(url, fallback) {
      $.ajax({
        type: 'GET',
        url: url,
        dataType: 'text',
        success: function(yaml) {
          $('#comp-current-log').attr('href', url).text(url.split('/').pop()).show();
          displayComplianceMessages(yaml);
        },
        error: function() {
          if (fallback) {
            tryLoad(fallback, null);
          } else {
            $('#comp_log').html('<p>Could not load compliance log.</p>');
          }
        }
      });
    }

    tryLoad(currentUrl, baseUrl + uuid + '.current.xes.yaml');
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

function displayComplianceMessages(yaml) { //{{{
  var messages = [];
  var parts = yaml.split(/\n---\s*\n/);

  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (!part.match(/^event:/m)) continue;

    // No /m flag: $ matches end-of-string only, preventing premature match on
    // the first line of a multi-line YAML single-quoted scalar.
    var m = part.match(/\n  data:\s*([\s\S]*?)(?=\n  [a-zA-Z]|\s*$)/);
    if (!m) continue;

    var val = m[1].trim();
    if (!val) continue;

    // Remove surrounding YAML flow-scalar single quotes and unescape ''
    if (val.charAt(0) === "'" && val.charAt(val.length - 1) === "'") {
      val = val.slice(1, -1).replace(/''/g, "'");
    }
    // Collapse multi-line continuation whitespace (incl. column-0 continuations)
    val = val.replace(/\n[ \t]*/g, ' ').trim();

    messages.push(val);
  }

  if (messages.length === 0) {
    $('#comp_log').html('<div>No messages found.</div>');
    return;
  }

  var html = '<div>Pre-Tests</div>';
  for (var j = 0; j < messages.length; j++) {
    var msg = messages[j];
    var isHeader = /^Verifying Requirement R/.test(msg) || /^Requirement R/.test(msg);
    var cls = isHeader ? '' : ' class="indent"';
    html += '<div' + cls + '>' + $('<span>').text(msg).html() + '</div>';
  }
  $('#comp_log').html(html);
} //}}}

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
