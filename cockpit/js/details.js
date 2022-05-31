$(document).ready(function() {
  var timer;

  $(document).on('input','#dat_details input, #dat_details textarea, #dat_details [contenteditable]',function(e){
    clearTimeout(timer);
    timer = setTimeout(do_main_save, 5000);
  });
  $(document).on('change','#dat_details select',function(e){
    clearTimeout(timer);
    do_main_save();
  });
  $(document).on('blur','#dat_details input, #dat_details textarea, #dat_details [contenteditable]',function(e){
    clearTimeout(timer);
    do_main_save();
  });
  $(document).on('keypress','#dat_details input',function(e){
    if (e.keyCode == 13) {
      clearTimeout(timer);
      do_main_save();
    }
  });
  $(document).on('keypress','#dat_details [contenteditable]',function(e){
    if (e.keyCode == 13) {
      document.execCommand('insertLineBreak')
      e.preventDefault()
    }
  });
  $(document).on('relaxngui_remove', '#dat_details', function(e){
    clearTimeout(timer);
    do_main_save();
  });
  $(document).on('relaxngui_move', '#dat_details', function(e){
    clearTimeout(timer);
    do_main_save();
  });
});

function do_main_save() { //{{{
  if (save['details'].has_changed()) {
    do_main_work();
  }
} //}}}

function do_main_work() { //{{{
  var svgid    = save['details_target'].svgid;
  var desc     = save['details_target'].model;
  var node     = desc.get_node_by_svg_id(svgid);
  var orignode = save['graph_adaptor'].illustrator.get_node_by_svg_id(svgid).parents('g.element[element-id]');
  var origtype = orignode.attr('element-type') + '_' + orignode.attr('element-endpoint');

  var url = $('body').attr('current-instance');
  save['details'].set_checkpoint();

  var nnew = $(save['details'].save().documentElement);
      nnew.attr('svg-id',svgid);

  if ($('*[svg-id]',node).length > 0) {
    nnew.append(node.children().filter(function(){ return this.attributes['svg-id'] != undefined; }));
  }

  if (node[0].namespaceURI == nnew.attr('xmlns')) { // remove xmlns when it is the same as in the parent node
    nnew[0].removeAttribute('xmlns');
  }
  node.replaceWith(nnew);

  var ttarget = manifestation.adaptor.illustrator.get_node_by_svg_id(svgid);
  var tnewnode = ttarget.parents('g.element[element-id]');
  var tnewtype = tnewnode.attr('element-type') + '_' + tnewnode.attr('element-endpoint');

  desc.refresh(function(graphrealization){
    var vtarget = manifestation.adaptor.illustrator.get_node_by_svg_id(svgid);
    if (vtarget.length > 0) {
      vtarget.parents('g.element[element-id]').addClass('selected');
    }
    manifestation.adaptor.illustrator.get_label_by_svg_id(svgid).addClass('selected');


    var newnode = vtarget.parents('g.element[element-id]');
    var newtype = newnode.attr('element-type') + '_' + newnode.attr('element-endpoint');
    var g = graphrealization.get_description();
    save['graph'] = $X(g);
    save['graph'].removeAttr('svg-id');
    save['graph'].removeAttr('svg-type');
    save['graph'].removeAttr('svg-subtype');
    save['graph'].removeAttr('svg-label');

    if (newtype != origtype) {
      manifestation.update_details(svgid);
      do_main_work();
    } else {
      $.ajax({
        type: "PUT",
        url: url + "/properties/description/",
        contentType: 'text/xml',
        headers: {
          'Content-ID': 'description',
          'CPEE-Event-Source': myid
        },
        data: desc.get_description()
      });
      adaptor_update();
      format_instance_pos();

      document.dispatchEvent(graph_changed);
    }

  });
} //}}}
