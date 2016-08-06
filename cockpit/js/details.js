$(document).ready(function() {
  $('#main ui-behind button').hide();

  // save buttons shown or not //{{{
  $('#main ui-tabbar ui-tab:not(.switch)').click(function(event){
    var me = $(event.target).parents('ui-tab');
    if ($('#state').text() != 'finished')
      if (me.attr('id') == 'tabdetails') {
        $('#main ui-behind button').show();
      } else {
        $('#main ui-behind button').hide();
      }  
  }); //}}}

  // New entry //{{{
  $(document).on('click','#parameters ui-behind button:nth-child(1)',function(event){
    var but = $(document).find('#parameters ui-content ui-area:not(.inactive) button');
    but.click(); 
  }); //}}}
  
  // Delete entries //{{{
  $(document).on('click','#main td.del a',function(event){
    var top = $(event.target).parents('ui-tabbed');
    remove_entry($("input",$(event.target).parents('tr')).get(0),false);
    mark_main_save(top);
    return false;
  }); //}}}

  // Save entries //{{{
  $('#main ui-behind button').click(function(event){
    save_main($(event.target).parents('ui-tabbed'));
  }); //}}}

  $(document).on('keyup','#dat_details input.pair_name, #dat_details input.prop_value, #dat_details textarea.prop_value, #dat_details select.prop_value, #dat_details input.pair_value',function(e){ mark_main_save($(e.target).parents('ui-tabbed')); });
  $(document).on('change','#dat_details select.prop_value',function(e){ mark_main_save($(e.target).parents('ui-tabbed')); });
});

function mark_main_save(top) { //{{{
  var visid = $('ui-tabbar ui-tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');
  var tab  = $('#dat_' + visid);
  var details = serialize_details(tab).serializeXML();

  if (details != save[visid]) {
    $('ui-tabbar ui-behind button',top).addClass('highlight');
  } else {  
    $('ui-tabbar ui-behind button',top).removeClass('highlight');
  }
} //}}}
function save_main(top) { //{{{
  var visid   = $('ui-tabbar ui-tab',top).not('.switch').not('.inactive').attr('id').replace(/tab/,'');
  var tab     = $('#dat_' + visid);
  var node    = graphrealization.description.get_node_by_svg_id($('input.pname_svgid').val());
  var details = serialize_details(tab).serializeXML();
  if (details != save[visid]) {
    save[visid] = details;
    $('ui-tabbar ui-behind button',top).removeClass('highlight');

    var newn = serialize_details(tab).attr('svg-id',$('input.pname_svgid').val());
    if (newn.children().length == 0) {
      newn.append(node.children());
    }  
    node.replaceWith(newn);
    $('ui-tabbar ui-behind button:nth-child(2)',top).removeClass('highlight');

    save_description();
  }  
} //}}}

function save_description() {
  var serxml = graphrealization.description.get_description();
  var url = $("#current-instance").text();
  $.ajax({
    type: "PUT", 
    url: url + "/properties/values/description/",
    data: ({'content': '<content>' + serxml + '</content>'}),
  });
}

function serialize_details(parent) { //{{{
  var ele = $('input.pname_element',parent).val();
  var xml = $X('<' + ele + ' xmlns="http://cpee.org/ns/description/1.0"/>');
  switch(ele) {
    case 'call':
        xml.attr('id',$('input.pname_id').val());
        xml.attr('endpoint',$('input.pname_endpoint').val());

        var para = $X('<parameters xmlns="http://cpee.org/ns/description/1.0"/>');
        xml.append(para);
        
        if ($('input.pname_method',parent).length > 0) {
          var pars = $X('<parameters xmlns="http://cpee.org/ns/description/1.0"/>');
          var meth = $X('<method xmlns="http://cpee.org/ns/description/1.0"/>');
              meth.text($('input.pname_method',parent).val());
          var labl = $X('<label xmlns="http://cpee.org/ns/description/1.0"/>');
              labl.text($('input.pname_label',parent).val());
          para.append(labl);
          para.append(meth);
          para.append(pars);
          $('tr.pair',parent).each(function(){
            var nam = $('input.pair_name',this).val();
            var val = $('input.pair_value',this).val();
            var par = $X('<' + nam + ' xmlns="http://cpee.org/ns/description/1.0"/>');
            par.text(val);
            pars.append(par);
          });
        }

        if ($('textarea.pname_finalize',parent).length > 0) {
          var mani = $X('<finalize xmlns="http://cpee.org/ns/description/1.0"/>');
              mani.text($('textarea.pname_finalize',parent).val());
          xml.append(mani);
        }
        if ($('textarea.pname_update',parent).length > 0) {
          var mani = $X('<update xmlns="http://cpee.org/ns/description/1.0"/>');
              mani.text($('textarea.pname_update',parent).val());
          xml.append(mani);
        }
      break;
    case 'manipulate':
      xml.attr('id',$('input.pname_id').val());
      if ($('textarea.pname_script',parent).length > 0) {
        xml.text($('textarea.pname_script',parent).val());
      }
      break;
    case 'loop':
      xml.attr($('select.pname_mode').val(),$('input.pname_condition').val());
      break;
    case 'choose':
      xml.attr('mode',$('select.pname_mode').val());
      break;
    case 'alternative':
      xml.attr('condition',$('input.pname_condition').val());
      break;
    case 'critical':
      xml.attr('sid',$('input.pname_sid').val());
      break;
    case 'parallel':
      if (parseInt($('input.pname_wait').val()) > -1) {
        xml.attr('wait',$('input.pname_wait').val());
      }  
      break;
    case 'parallel_branch':
      if ($('input.pname_pass',parent).length > 0) {
        xml.attr('pass',$('input.pname_pass').val());
      }  
      if ($('input.pname_local',parent).length > 0) {
        xml.attr('local',$('input.pname_local').val());
      }  
      break;
    // TODO group
  }  

  return xml;
} //}}}
