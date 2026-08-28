var parameters_changed = new Event("parameters:changed", {"bubbles":true, "cancelable":false});
var attributes_changed = new Event("attributes:changed", {"bubbles":true, "cancelable":false});
var endpoints_changed = new Event("endpoints:changed", {"bubbles":true, "cancelable":false});
var dataelements_changed = new Event("dataelements:changed", {"bubbles":true, "cancelable":false});
var documents_changed = new Event("documents:changed", {"bubbles":true, "cancelable":false});
var attributes_loaded = new Event("attributes:loaded", {"bubbles":true, "cancelable":false});
var endpoints_loaded = new Event("endpoints:loaded", {"bubbles":true, "cancelable":false});
var dataelements_loaded = new Event("dataelements:loaded", {"bubbles":true, "cancelable":false});
var documents_loaded = new Event("documents:loaded", {"bubbles":true, "cancelable":false});

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
  // hook up documents with relaxngui //{{{
  $.ajax({
    type: "GET",
    dataType: "xml",
    url: "rngs/documents.rng",
    success: function(rng){
      let cds = $('body').attr('current-document-store');
      save['documents'] = new RelaxNGui(rng,$('#dat_documents'),undefined,false,typeof(cds) != "undefined");
    }
  }); //}}}

  // new entry //{{{
  $('#parameters ui-content ui-area > button, ui-tabbed.parameters ui-content ui-area > button').click(function(event){
    var but = $(document).find('#parameters ui-content ui-area:not(.inactive) > div button.relaxngui_control, ui-tabbed.parameters ui-content ui-area:not(.inactive) > div button.relaxngui_control');
        but.click();
    var inp = $(document).find('#parameters ui-content ui-area:not(.inactive) > div input, ui-tabbed.parameters ui-content ui-area:not(.inactive) > div input');
        $(inp[inp.length-2]).focus();
    var are = $(document).find('#parameters ui-content ui-area:not(.inactive) > div, ui-tabbed.parameters ui-content ui-area:not(.inactive) > div');
    var tab = $(document).find('#parameters ui-content ui-area:not(.inactive) > div > div, ui-tabbed.parameters ui-content ui-area:not(.inactive) > div > div');
        are.animate({ scrollTop: tab.height() }, "slow");
  }); //}}}

  var timer;
  // when input in one of the inputs, save
  $(document).on('input','#dat_dataelements input, #dat_endpoints input, #dat_attributes input, #dat_documents input',function(event){
    clearTimeout(timer);
    timer = setTimeout(function(){ do_parameters_save(event); }, 5000);
  });
  $(document).on('relaxngui_remove', '#dat_dataelements, #dat_endpoints, #dat_attributes, #dat_documents', function(event){
    clearTimeout(timer);
    do_parameters_save(event);
  });
  $(document).on('relaxngui_move', '#dat_dataelements, #dat_endpoints, #dat_attributes, #dat_documents', function(event){
    clearTimeout(timer);
    do_parameters_save(event);
  });
  $(document).on('relaxngui_change', '#dat_dataelements, #dat_endpoints, #dat_attributes, #dat_documents', function(event){
    clearTimeout(timer);
    do_parameters_save(event);
  });
});

function do_parameters_save(event) { //{{{
  var visid = $('ui-tabbar ui-tab',$(event.target).parents('ui-tabbed')).not('.switch').not('.inactive').attr('data-tab');
  if (save[visid].has_changed()) {
    save[visid].set_checkpoint();
    var url = $('body').attr('current-instance');
    document.dispatchEvent(parameters_changed);
    document.dispatchEvent(eval(visid + '_changed'));
    do_parameters_save_part(visid,save[visid].save_text());
  }
} //}}}

function do_parameters_save_part(visid,send) { //{{{
  $.ajax({
    type: "PUT",
    url: url + "/properties/" + visid + "/",
    contentType: 'text/xml',
    headers: {
      'Content-ID': visid,
      'CPEE-Event-Source': myid
    },
    data: send
  });
} //}}}

function do_parameters_save_document(id,file,content) { //{{{
  let name = $('input#' + id).parent().find('input.relaxngui_cell').first().get_val();
  if (!name) {
    return '';
  } else {
    return do_parameters_save_document_exec(name,file.type,content.result);
  }
} //}}}

function do_parameters_save_document_exec(name,filetype,content,type='replace') {
  let surl = $.path_join($('body').attr('current-document-store'),save.attributes_raw.uuid,name);

  let append = '';
  if (type != 'replace') {
    append = '?append';
  }

  $.ajax({
    type: "PUT",
    url: surl + append,
    contentType: (filetype == "" ? "application/octet-stream" : filetype),
    headers: {
      'Content-ID': 'file'
    },
    data: content
  });

  return surl;
}

function do_parameters_get_document_exec(name,lines=0) {
  let surl = $.path_join($('body').attr('current-document-store'),save.attributes_raw.uuid,name);

  let append = '';
  if (parseInt(lines) > 0) {
    append = '?tail=' + parseInt(lines);
  }

  return $.ajax({
    type: "GET",
    url: surl + append
  }).then(function(content){
    return content.split('\n').filter(function(line){ return line.trim() != ''; }).map(function(line){ return JSON.parse(line); });
  });
}
