$(document).ready(function() {
  var timer;

  $(document).on('input','#dat_details input, #dat_details textarea',function(e){
    clearTimeout(timer);
    timer = setTimeout(do_main_save, 5000);
  });
  $(document).on('change','#dat_details select',function(e){
    clearTimeout(timer);
    do_main_save();
  });
  $(document).on('blur','#dat_details input, #dat_details textarea',function(e){
    clearTimeout(timer);
    do_main_save();
  });
  $(document).on('keypress','#dat_details input',function(e){
    if (e.keyCode == 13) {
      clearTimeout(timer);
      do_main_save();
    }
  });
  $(document).on('relaxngui_remove', '#dat_details', function(e){
    clearTimeout(timer);
    do_main_save();
  });
});

function do_main_save() { //{{{
  if (save['details'].has_changed()) {
    var visid = 'details';
    var svgid = save[visid + '_target'].svgid;
    var desc  = save[visid + '_target'].model;
    var node  = desc.get_node_by_svg_id(svgid);

    var url = $("#current-instance").text();
    $('#main ui-tabbar ui-behind button').removeClass('highlight');
    save['details'].set_checkpoint();

    // pull out xml and add XMLNS
    // sadly we have to serialze, add in string and then parse again
    // as adding namespaces to nodes is not supported
    // serialization and reparsing is faster and more robust than xslt option
    var nnew = $(save['details'].save().documentElement);
        nnew.attr('svg-id',svgid);
        nnew.attr('trans-xmlns','http://cpee.org/ns/description/1.0');

    if ($('*[svg-id]',node).length > 0) {
      // TODO maybe not all children. Maybe only thingies that have svg-id but nothing with svg-id between it and node.
      nnew.append(node.children());
    }

    var ntxt = nnew.serializeXML();
        ntxt = ntxt.replace(/trans-xmlns/,'xmlns');

    node.replaceWith($X(ntxt));

    $.ajax({
      type: "PUT",
      url: url + "/properties/values/description/",
      data: ({'content': '<content>' + desc.get_description() + '</content>'})
    });
  }
} //}}}
