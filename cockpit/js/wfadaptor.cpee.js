function create_header(value){ //{{{
  var tmp = $("#prop_template_header tr").clone();
  $('.header_value',tmp).text(value);
  return tmp;
} //}}}
function create_sizer(){ //{{{
  var tmp = $("#prop_template_sizer tr").clone();
  return tmp;
} //}}}
function create_line(main,text){ //{{{
  var tmp = $("#prop_template_line tr").clone();
  $('.line_main',tmp).text(main);
  $('.line_text',tmp).text(text);
  return tmp;
} //}}}
function create_element(content,svgid){ //{{{
  var tmp = $("#prop_template_readonly tr").clone();
  $('.prop_name',tmp).text('Element');
  $('.prop_value',tmp).val(content);
  $('.prop_value',tmp).addClass('pname_element');
  $('.prop_value',tmp).parent().append($("<input type='hidden' class='pname_svgid' value='" + svgid + "'>"));
  return tmp;
} //}}}
function create_readonly_property(name,content){ //{{{
  var tmp = $("#prop_template_readonly tr").clone();
  $('.prop_name',tmp).text(name);
  $('.prop_value',tmp).val(content);
  $('.prop_value',tmp).addClass('pname_' + name.toLowerCase());
  return tmp;
} //}}}
function create_input_property(name,cls,content){ //{{{
  var tmp = $("#prop_template_input tr").clone();
  tmp.addClass(cls);
  $('.prop_name',tmp).text(name);
  $('.prop_value',tmp).val(content);
  $('.prop_value',tmp).addClass('pname_' + name.toLowerCase());
  return tmp;
} //}}}
function create_select_property(name,cls,content,alts){ //{{{
  var tmp = $("#prop_template_select tr").clone();
  tmp.addClass(cls);
  $('.prop_name',tmp).text(name);
  $('.prop_value',tmp).addClass('pname_' + name.toLowerCase());
  $.each(alts,function(a,b){
    var o = $('<option value="' + b + '">' + b + '</option>');
    if (b == content) o.attr('selected','selected');
    $('.prop_value',tmp).append(o);
  });  
  return tmp;
} //}}}
function create_area_property(name,cls,content){ //{{{
  var tmp = $("#prop_template_area tr").clone();
  tmp.addClass(cls);
  $('.prop_name',tmp).text(name);
  $('.prop_value',tmp).addClass('pname_' + name.toLowerCase());
  $('.prop_value',tmp).text(content);
  return tmp;
} //}}}
function create_input_pair(name,cls,content){ //{{{
  var tmp = $("#dat_template_pair tr").clone();
  tmp.addClass(cls);
  $('.pair_name',tmp).val(name);
  $('.pair_value',tmp).val(content);
  return tmp;
} //}}}

function CPEE(adaptor) {
  this.adaptor = adaptor;
  this.elements = elements = {};
  this.events = events = {};

  this.noarrow = noarrow = ['alternative', 'otherwise'];

  // Events
  this.events.mousedown = function(svgid, e, child, sibling) { // {{{
    if(e.button == 0) {  // left-click
    } else if(e.button == 1) { // middle-click
    } else if(e.button == 2) { // right-click
      var xml_node = adaptor.description.get_node_by_svg_id(svgid);
      var group = null;
      var menu = {};
  
      if(child) {
        group = elements[xml_node.get(0).tagName].description.permissible_children(xml_node);
        if(group.length > 0) menu['Insert into'] = group;
      }
      if(sibling) {
        group = elements[xml_node.parent().get(0).tagName].description.permissible_children(xml_node);
        if(group.length > 0) menu['Insert after'] = group;
      }
  
      if(xml_node.get(0).tagName != 'description')
        menu['Remove Element'] = [{'label': 'Actual Element', 
                        'function_call': adaptor.description.remove, 
                        'menu_icon': function() {
                          var icon =  elements[xml_node.get(0).tagName].illustrator.svg();
                          icon.children('.rfill').css({'fill':'red','fill-opacity':'0.5'});
                          return icon;
                        },
                        'params': [null, xml_node]}];
      if($('> manipulate', xml_node).length > 0 && xml_node.get(0).tagName == 'call') {
        menu['Remove Element'].push({'label': 'Remove Script Block', 
                        'function_call': adaptor.description.remove, 
                        'menu_icon': function() {
                          var icon =  elements.callmanipulate.illustrator.svg();
                          icon.children('.rfill:last').css({'fill':'red','fill-opacity':'0.5'});
                          return icon;
                        },
                        'params': ['> manipulate', xml_node]});
      }
      contextmenu(menu, e);
    }
    return false;
  } // }}} 
  this.events.click = function(svgid, e) { // {{{ 
    if (adaptor.description.get_node_by_svg_id(svgid).length == 0) {
      return;
    }

    $('#main .tabbehind button').show();
    if ($('#main .tabbehind button').hasClass('highlight')) {
      var check = confirm("Discard changes?");
      if (check)
        $('#main .tabbehind button').removeClass('highlight');
      else  
        return;
    }  

    var visid = 'details';
    var tab   = $('#dat_' + visid);
    var node  = adaptor.description.get_node_by_svg_id(svgid).get(0);
  
    tab.empty();
    tab.append(create_element(node.nodeName,svgid));
    switch(node.nodeName) {
      case 'call':
        tab.append(create_readonly_property('ID',$(node).attr('id')));
        tab.append(create_input_property('Endpoint','',$(node).attr('endpoint')));
  
        if ($('manipulate',node).length > 0)
          tab.append(create_area_property('Script','',format_text_skim($('manipulate',node).text())));
  
        tab.append(create_header('Parameters:'));
  
        tab.append(create_input_property('Label','indent',$('parameters label',node).text()));
        tab.append(create_input_property('Method','indent',$('parameters method',node).text()));
        $.each($('parameters parameters *',node),function(){
          tab.append(create_input_pair(this.nodeName,'indent',$(this).text()));
        });
        break;
      case 'manipulate':
        tab.append(create_readonly_property('ID',$(node).attr('id')));
        tab.append(create_area_property('Script','',format_text_skim($(node).text())));
        break;
      case 'loop':
        if ($(node).attr('pre_test') != undefined)
          var mode = 'pre_test';
        if ($(node).attr('post_test') != undefined)
          var mode = 'post_test';
        tab.append(create_select_property('Mode','',mode,['post_test','pre_test']));
        tab.append(create_input_property('Condition','',$(node).attr(mode)));
        break;
      case 'choose':
        break;
      case 'alternative':
        tab.append(create_input_property('Condition','',$(node).attr('condition')));
        break;
      case 'critical':
        var sid = ($(node).attr('sid') == '' ? 'section' : $(node).attr('sid'));
        tab.append(create_input_property('SID','',sid));
        tab.append(create_line('Hint','Identical SID\'s shared by between differnt "critical" elements define mutual exclusive areas'));
        break;
      case 'parallel':
        var wait = ($(node).attr('wait') == '' || $(node).attr('wait') == undefined ? '-1' : $(node).attr('wait'));
        tab.append(create_input_property('Wait','',wait));
        tab.append(create_line('Hint','-1 to wait for all branches'));
        break;
      case 'parallel_branch':
        tab.append(create_input_property('Pass to branch','',$(node).attr('pass')));
        tab.append(create_input_property('Local scope','',$(node).attr('local')));
        break;
      // TODO group
    }
    // add the sizer in order for colspan to work
    tab.append(create_sizer());
    save['details'] = serialize_details(tab).serializeXML();
  } // }}}
  this.events.dblclick = function(svgid, e) { // {{{
    $('.tile[element-id = "' + svgid + '"]').css('display','none');
    var xml_node = adaptor.description.get_node_by_svg_id(svgid);
    if(xml_node.attr('collapsed') == undefined || xml_node.attr('collapsed') == 'false') {xml_node.attr('collapsed','true');}
    else {xml_node.attr('collapsed','false');}
    adaptor.description.update(svgid);
    return false;
  } // }}}
  this.events.mouseover = function(svgid, e) { // {{{
    $('.tile[element-id = "' + svgid + '"]').css('display','block');
    return false;
  } // }}}
  this.events.mouseout = function(svgid, e) { // {{{
    $('.tile[element-id = "' + svgid + '"]').css('display','none');
    return false;
  } // }}}
  this.events.dragstart = function (svgid, e) { //{{{
  } //}}}
  
  // Primitive Elements
  this.elements.callinjection = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'abstract', 
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="rfill stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">c</text>' +
                    '<circle cx="28" cy="27" r="9" class="rfill stand"/>' + 
                    '<text transform="translate(28,31)" class="small">i</text>' +
                  '</svg>');
      }
    },//}}}
  'description' : {//{{{
    'create':  function(target) {
      var node = null;
      node = $X('<call id="' + adaptor.description.get_free_id() + '" endpoint="" xmlns="http://this.org/ns/description/1.0"><parameters><label></label><method>post</method><parameters/></parameters><manipulate output="result"/></call>');
      return node;
    },
    'permissible_children': function(node) {
      if(node.children('manipulate').lenght < 1)
        return [
         {'label': 'Script Block', 
          'function_call': adaptor.description.insert_last_into, 
          'menu_icon': elements.callmanipulate.illustrator.svg, 
          'params': [adaptor.description.elements.manipulate.create, node]}
        ];
      return [];
    }
  },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, true);
    },
    'click': events.click,
   }//}}}
  }; /*}}}*/
  this.elements.callcorrelation = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'abstract', 
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<rect x="1" y="1" width="28" height="28" rx="4" class="rfill stand"/>' +
                    '<path transform="scale(0.7) translate(12, 2)" class="stand" style="fill:#000000;" d="m 19.511059,31.248618 0,-23.6413153 -3.940219,0 0,15.7608793 -7.8804404,-7.88044 0,7.88044 -7.88043943,-7.88044 0,15.760876 z"/>' +
                    '<circle cx="28" cy="27" r="9" class="rfill stand"/>' + 
                    '<text transform="translate(28,31)" class="small">c</text>' +
                  '</svg>');
      }
    },//}}}
  'description' : {//{{{
    'create':  function(target) {
      var node = null;
      node = $X('<call id="' + adaptor.description.get_free_id() + '" endpoint="correlation" xmlns="http://this.org/ns/description/1.0"><parameters><label></label><method>post</method><parameters/></parameters><manipulate output="result"/></call>');
      return node;
    },
    'permissible_children': function(node) {
      if(node.children('manipulate').lenght < 1)
        return [
         {'label': 'Script Block', 
          'function_call': adaptor.description.insert_last_into, 
          'menu_icon': elements.callmanipulate.illustrator.svg, 
          'params': [adaptor.description.elements.manipulate.create, node]}
        ];
      return [];
    }
  },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, true);
    },
    'click': events.click,
   }//}}}
  }; /*}}}*/
  this.elements.callinstantiation = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'abstract', 
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<rect x="1" y="1" width="28" height="28" rx="4" class="rfill stand"/>' +
                    '<path transform="scale(0.7) translate(12, 2)" class="stand" style="fill:#000000;" d="m 19.511059,31.248618 0,-23.6413153 -3.940219,0 0,15.7608793 -7.8804404,-7.88044 0,7.88044 -7.88043943,-7.88044 0,15.760876 z"/>' +
                    '<circle cx="28" cy="27" r="9" class="rfill stand"/>' + 
                    '<text transform="translate(28,32)" class="small">i</text>' +
                  '</svg>');
      }
    },//}}}
  'description' : {//{{{
    'create':  function(target) {
      var node = null;
      node = $X('<call id="' + adaptor.description.get_free_id() + '" endpoint="instantiate" xmlns="http://this.org/ns/description/1.0"><parameters><label></label><method>post</method><parameters/></parameters><manipulate output="result"/></call>');
      return node;
    },
    'permissible_children': function(node) {
      if(node.children('manipulate').lenght < 1)
        return [
         {'label': 'Script Block', 
          'function_call': adaptor.description.insert_last_into, 
          'menu_icon': elements.callmanipulate.illustrator.svg, 
          'params': [adaptor.description.elements.manipulate.create, node]}
        ];
      return [];
    }
  },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, true);
    },
    'click': events.click,
   }//}}}
  }; /*}}}*/
  this.elements.callmanipulate = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'abstract', 
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<rect x="1" y="1" width="28" height="28" rx="4" class="rfill stand"/>' +
                    '<path transform="scale(0.7) translate(12, 2)" class="stand" style="fill:#000000;" d="m 19.511059,31.248618 0,-23.6413153 -3.940219,0 0,15.7608793 -7.8804404,-7.88044 0,7.88044 -7.88043943,-7.88044 0,15.760876 z"/>' +
                    '<circle cx="28" cy="27" r="9" class="rfill stand"/>' + 
                    '<text transform="translate(28,31)" class="small">s</text>' +
                  '</svg>');
      }
    },//}}}
  'description' : {//{{{
    'create':  function(target) {
      var node = null;
      node = $X('<call id="' + adaptor.description.get_free_id() + '" endpoint="" xmlns="http://this.org/ns/description/1.0"><parameters><label></label><method>post</method><parameters/></parameters><manipulate output="result"/></call>');
      return node;
    },
    'permissible_children': function(node) {
      if(node.children('manipulate').lenght < 1)
        return [
         {'label': 'Script Block', 
          'function_call': adaptor.description.insert_last_into, 
          'menu_icon': elements.callmanipulate.illustrator.svg, 
          'params': [adaptor.description.elements.manipulate.create, node]}
        ];
      return [];
    }
  },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, true);
    },
    'click': events.click,
   }//}}}
  }; /*}}}*/
  this.elements.call = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'primitive', 
      'endnodes' : 'this',
      'resolve_symbol' : function(node) { 
        if($(node).attr('endpoint') == 'instantiation') {
          return 'callinstantiation'; 
          return illustrator.elements.callinstantiation.draw(node, pos, block);
        } else if($(node).attr('endpoint') == 'correlation') {
          return 'callcorrelation'; 
          return illustrator.elements.callcorrelation.draw(node, pos, block);
        } else if($('parameters > service', node).length > 0) {
          return 'callinjection'; 
          return illustrator.elements.callinjection.draw(node, pos, block);
        } else if($('manipulate', node).length > 0) {
          return 'callmanipulate'; 
          return illustrator.elements.callmanipulate.draw(node, pos, block);
        } else {
          return'call' 
          return illustrator.draw.draw_symbol('call', $(node).attr('svg-id'), pos.row, pos.col);
        }
      },
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<rect x="1" y="1" width="28" height="28" rx="4" class="rfill stand"/>' +
                    '<path transform="scale(0.7) translate(12, 2)" class="stand" style="fill:#000000;" d="m 19.511059,31.248618 0,-23.6413153 -3.940219,0 0,15.7608793 -7.8804404,-7.88044 0,7.88044 -7.88043943,-7.88044 0,15.760876 z"/>' +
                  '</svg>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<call id="' + adaptor.description.get_free_id() + '" endpoint="" xmlns="http://cpee.org/ns/description/1.0"/>');
        node.append($X('<parameters xmlns="http://cpee.org/ns/description/1.0"><label></label><method>post</method><parameters/></parameters>'));
        return node;
      },
      'permissible_children': function(node) {
        if(node.children('manipulate').length < 1) 
          return [
           {'label': 'Script Block', 
            'function_call': adaptor.description.insert_last_into, 
            'menu_icon': elements.callmanipulate.illustrator.svg, 
            'params': [adaptor.description.elements.manipulate.create, node]}
          ];
        return [];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, true);
    },
    'click': events.click,
    'dragstart': events.dragstart,
   }//}}}
  }; /*}}}*/
  this.elements.manipulate = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'primitive',
      'endnodes' : 'this',
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<rect x="1" y="1" width="28" height="28" rx="4" class="rfill stand"/>' +
                    '<text transform="translate(15,21)" class="normal">s</text>' +
                  '</svg>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<manipulate id="' + adaptor.description.get_free_id() + '" xmlns="http://cpee.org/ns/description/1.0"/>');
        return node;
      },
      'permissible_children': function(node) {
        return [];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,false, true);
    },
    'click': events.click,
   }//}}}
  }; /*}}}*/
  this.elements.constraints = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'primitive',
      'endnodes' : 'this',
      'svg': function() {
        return false;
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<manipulate id="' + adaptor.description.get_free_id() + '" xmlns="http://cpee.org/ns/description/1.0"/>');
        return node;
      },
      'permissible_children': function(node) {
        return [];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,false, true);
    },
    'click': events.click,
   }//}}}
  }; /*}}}*/
  
  // Complex Elements
  this.elements.choose = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'aggregate',
      'closeblock': false,
      'expansion' : function(node) { 
        return 'horizontal';
      }, 
      'col_shift' : function(node) { 
        return false; 
      },
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<rect transform="rotate(45,14,12)" x="7" y="3" width="21" height="21" class="stand"/>' +
                    '<circle cx="15.5" cy="15.5" r="7" class="stand"/>' + 
                  '</svg>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<choose xmlns="http://cpee.org/ns/description/1.0"><otherwise/></choose>');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
      'permissible_children': function(node) {
        var func = null;
        if(node.get(0).tagName == 'choose') { func = adaptor.description.insert_first_into }
        else { func = adaptor.description.insert_after }
        if(node.children('parallel_branch').length > 0) {
          return [{'label': 'Parallel Branch', 
           'function_call': func, 
           'menu_icon': elements.parallel_branch.illustrator.svg, 
           'params': [adaptor.description.elements.parallel_branch.create, node]}];
        }
        var childs = [{'label': 'Alternative', 
         'function_call': func, 
         'menu_icon': elements.alternative.illustrator.svg, 
         'params': [adaptor.description.elements.alternative.create, node]}];
        if((node.children('otherwise').length == 0) && node.parents('parallel').length == node.parents('parallel_branch').length) 
          childs.push({'label': 'Otherwise', 
           'function_call': func, 
           'menu_icon': elements.otherwise.illustrator.svg, 
           'params': [adaptor.description.elements.otherwise.create, node]});
        if(node.parents('parallel').length > node.parents('parallel_branch').length) 
          childs.push({'label': 'Parallel Branch', 
           'function_call': func, 
           'menu_icon': elements.parallel_branch.illustrator.svg, 
           'params': [adaptor.description.elements.parallel_branch.create, node]});
        return childs; 
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, true);
    },
    'click': events.click,
    'dblclick': events.dblclick,
    'mouseover': events.mouseover,
    'mouseout': events.mouseout,
   }//}}}
  };  /*}}}*/
  this.elements.otherwise = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'passthrough',
      'closeblock': false,
      'expansion' : function(node) { 
        return 'vertical';
      }, 
      'col_shift' : function(node) { 
        return false; 
      },
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<line x1="15" y1="0" x2="15" y2="28" class="standwithout"/>' +
                    '<line x1="9" y1="21" x2="21" y2="9" class="stand"/>' +
                  '</svg>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<otherwise xmlns="http://cpee.org/ns/description/1.0"/>');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
      'permissible_children': function(node) {
        var func = null;
        var childs = null;
        if(node.get(0).tagName == 'otherwise') { func = adaptor.description.insert_first_into }
        else { func = adaptor.description.insert_after }
        return [
          {'label': 'Service Call with Script Block', 
           'function_call': func, 
           'menu_icon': elements.callmanipulate.illustrator.svg, 
           'params': [adaptor.description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': elements.call.illustrator.svg, 
           'params': [adaptor.description.elements.call.create, node]},
          {'label': 'Script', 
           'function_call': func, 
           'menu_icon': elements.manipulate.illustrator.svg, 
           'params': [adaptor.description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': elements.parallel.illustrator.svg, 
           'params': [adaptor.description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': elements.choose.illustrator.svg, 
           'params': [adaptor.description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': elements.loop.illustrator.svg, 
           'params': [adaptor.description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': elements.critical.illustrator.svg, 
           'params': [adaptor.description.elements.critical.create, node]}
        ];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, false);
    },
    'click': events.click,
    'dblclick': events.dblclick, 
    'mouseover': events.mouseover,
    'mouseout': events.mouseout,
   }//}}}
  }; /*}}}*/
  this.elements.alternative = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'passthrough',
      'closeblock':false,
      'expansion' : function(node) { 
        return 'vertical';
      }, 
      'col_shift' : function(node) { 
        return false;
      },
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="standwithout"/>' + 
                    '<text transform="translate(15,20)" class="normal">{..}</text>' +
                  '</svg>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<alternative condition="" xmlns="http://cpee.org/ns/description/1.0"/>');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
      'permissible_children': function(node) {
        if(node.get(0).tagName == 'alternative') { func = adaptor.description.insert_first_into }
        else { func = adaptor.description.insert_after }
        if(node.parents('parallel').length > node.parents('parallel_branch').length && node.get(0).tagName == 'alternative') 
          return [{'label': 'Parallel Branch', 
           'function_call': func, 
           'menu_icon': elements.parallel_branch.illustrator.svg, 
           'params': [adaptor.description.elements.parallel_branch.create, node]}];
        return [
          {'label': 'Service Call with Script Block', 
           'function_call': func, 
           'menu_icon': elements.callmanipulate.illustrator.svg, 
           'params': [adaptor.description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': elements.call.illustrator.svg, 
           'params': [adaptor.description.elements.call.create, node]},
          {'label': 'Script', 
           'function_call': func, 
           'menu_icon': elements.manipulate.illustrator.svg, 
           'params': [adaptor.description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': elements.parallel.illustrator.svg, 
           'params': [adaptor.description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': elements.choose.illustrator.svg, 
           'params': [adaptor.description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': elements.loop.illustrator.svg, 
           'params': [adaptor.description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': elements.critical.illustrator.svg, 
           'params': [adaptor.description.elements.critical.create, node]}
        ];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, false);
    },
    'click': events.click,
    'dblclick': events.dblclick, 
    'mouseover': events.mouseover,
    'mouseout': events.mouseout,
   }//}}}
  };  /*}}}*/
  this.elements.loop = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'this',
      'closeblock' : true,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<rect transform="rotate(45,14,12)" x="7" y="3" width="21" height="21" class="stand"/>' +
                    '<line x1="10.5" y1="20.5" x2="20.5" y2="10.5" class="stand"/>' +
                    '<line x1="10.5" y1="10.5" x2="20.5" y2="20.5" class="stand"/>' +
                  '</svg>');
      }
    },// }}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<loop pre_test="" xmlns="http://cpee.org/ns/description/1.0"/>');
        return node;
      },
      'permissible_children': function(node) {
        var func = null;
        if(node.get(0).tagName == 'loop') { func = adaptor.description.insert_first_into }
        else { func = adaptor.description.insert_after }
        var childs = [
          {'label': 'Service Call with Script Block', 
           'function_call': func, 
           'menu_icon': elements.callmanipulate.illustrator.svg, 
           'params': [adaptor.description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': elements.call.illustrator.svg, 
           'params': [adaptor.description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'menu_icon': elements.manipulate.illustrator.svg, 
           'params': [adaptor.description.elements.manipulate.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': elements.choose.illustrator.svg, 
           'params': [adaptor.description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': elements.loop.illustrator.svg, 
           'params': [adaptor.description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': elements.critical.illustrator.svg, 
           'params': [adaptor.description.elements.critical.create, node]}
        ];
        if(node.parent('parallel').length > node.parent('parallel_branch').length) {
          childs.push({'label': 'Parallel Branch',
                       'function_call': func, 
                       'menu_icon': elements.parallel_branch.illustrator.svg, 
                       'params': [adaptor.description.elements.parallel_branch.create, node]}
                      );
        } else {
          childs.push({'label': 'Parallel',
                       'function_call': func, 
                       'menu_icon': elements.parallel.illustrator.svg, 
                       'params': [adaptor.description.elements.parallel.create, node]}
                      );
        }
        return childs;
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, true);
    },
    'click': events.click,
    'dblclick': events.dblclick, 
    'mouseover': events.mouseover,
    'mouseout': events.mouseout,
   }//}}}
  };  /*}}}*/
  this.elements.parallel = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'this',
      'closeblock' : false,
      'border': true,
      'expansion' : function(node) { 
        // check if any sibling other than 'parallel_branch' is present 
        if($(node).children(':not(parallel_branch)').length > 0) return 'vertical';
        return 'horizontal';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<rect transform="rotate(45,14,12)" x="7" y="3" width="21" height="21" class="stand"/>' +
                    '<text transform="translate(12,25)" class="normallarge">+</text>' +
                    '<text transform="translate(18,16)" class="small">=</text>' +
                  '</svg>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<parallel xmlns="http://cpee.org/ns/description/1.0"/>');
        return node;
      },
      'permissible_children': function(node) {
        var childs =  [
          {'label': 'Service Call with Script Block', 
           'function_call': adaptor.description.insert_last_into, 
           'menu_icon': elements.callmanipulate.illustrator.svg, 
           'params': [adaptor.description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': adaptor.description.insert_last_into, 
           'menu_icon': elements.call.illustrator.svg, 
           'params': [adaptor.description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': adaptor.description.insert_last_into, 
           'menu_icon': elements.manipulate.illustrator.svg, 
           'params': [adaptor.description.elements.manipulate.create, node]},
          {'label': 'Choose', 
           'function_call': adaptor.description.insert_last_into, 
           'menu_icon': elements.choose.illustrator.svg, 
           'params': [adaptor.description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': adaptor.description.insert_last_into, 
           'menu_icon': elements.loop.illustrator.svg, 
           'params': [adaptor.description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': adaptor.description.insert_last_into, 
           'menu_icon': elements.critical.illustrator.svg, 
           'params': [adaptor.description.elements.critical.create, node]},
          {'label': 'Parallel Branch',
           'function_call': adaptor.description.insert_last_into, 
           'menu_icon': elements.parallel_branch.illustrator.svg, 
           'params': [adaptor.description.elements.parallel_branch.create, node]}
        ];
        if(node.get(0).tagName != 'parallel')
          childs.push({'label': 'Parallel', 
             'function_call': adaptor.description.insert_last_into, 
             'menu_icon': elements.parallel.illustrator.svg, 
             'params': [adaptor.description.elements.parallel.create, node]});
        return childs;
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, true);
    },
    'click': events.click,
    'dblclick': events.dblclick, 
    'mouseover': events.mouseover,
    'mouseout': events.mouseout,
   }//}}}
  };  /*}}}*/
  this.elements.parallel_branch = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'this',
      'closeblock' : false,
      'expansion' : function(node) { 
        return 'vertical';
      },
      'col_shift' : function(node) {
        if(node.parentNode.tagName == 'choose') return false;
        if($(node).parents('parallel').first().children(':not(parallel_branch)').length > 0) return true;
        return false; 
      },
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<rect transform="rotate(45,14,12)" x="7" y="3" width="21" height="21" class="stand"/>' +
                    '<text transform="translate(15,20)" class="small">+|</text>' +
                  '</svg>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<parallel_branch xmlns="http://cpee.org/ns/description/1.0"/>');
        return node;
      },
      'permissible_children': function(node) {
        var func = null;
        var childs = null;
        if(node.get(0).tagName == 'parallel_branch') { func = adaptor.description.insert_first_into }
        else { func = adaptor.description.insert_after }
        childs =  [
          {'label': 'Service Call with Script Block', 
           'function_call': func, 
           'menu_icon': elements.callmanipulate.illustrator.svg, 
           'params': [adaptor.description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': elements.call.illustrator.svg, 
           'params': [adaptor.description.elements.call.create, node]},
          {'label': 'Script', 
           'function_call': func, 
           'menu_icon': elements.manipulate.illustrator.svg, 
           'params': [adaptor.description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': elements.parallel.illustrator.svg, 
           'params': [adaptor.description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': elements.choose.illustrator.svg, 
           'params': [adaptor.description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': elements.loop.illustrator.svg, 
           'params': [adaptor.description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': elements.critical.illustrator.svg, 
           'params': [adaptor.description.elements.critical.create, node]},
        ];
        if(node.parents('choose').length > node.parents('alternative, otherwise').length && node.get(0).tagName == 'parallel_branch') {
          return [{'label': 'Alternative', 
           'function_call': func, 
           'menu_icon': elements.alternative.illustrator.svg, 
           'params': [adaptor.description.elements.alternative.create, node]}];
        }
        return childs;
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, false);
    },
    'click': events.click,
    'dblclick': events.dblclick, 
    'mouseover': events.mouseover,
    'mouseout': events.mouseout,
   }//}}}
  };  /*}}}*/
  this.elements.critical = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'aggregate',
      'closeblock' : false,
      'border': true,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">⚠</text>' +
                  '</svg>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<critical sid="section" xmlns="http://cpee.org/ns/description/1.0"/>');
        return node;
      },
      'permissible_children': function(node) {
        var func = null;
        if(node.get(0).tagName == 'critical') { func = adaptor.description.insert_first_into }
        else { func = adaptor.description.insert_after }
        return [
          {'label': 'Service Call with Script Block', 
           'function_call': func, 
           'menu_icon': elements.callmanipulate.illustrator.svg, 
           'params': [adaptor.description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': elements.call.illustrator.svg, 
           'params': [adaptor.description.elements.call.create, node]},
          {'label': 'Script', 
           'function_call': func, 
           'menu_icon': elements.manipulate.illustrator.svg, 
           'params': [adaptor.description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': elements.parallel.illustrator.svg, 
           'params': [adaptor.description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': elements.choose.illustrator.svg, 
           'params': [adaptor.description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': elements.loop.illustrator.svg, 
           'params': [adaptor.description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': elements.critical.illustrator.svg, 
           'params': [adaptor.description.elements.critical.create, node]},
        ];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, true);
    },
    'click': events.click,
    'dblclick': events.dblclick, 
    'mouseover': events.mouseover,
    'mouseout': events.mouseout,
   }//}}}
  };  /*}}}*/
  this.elements.group = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'aggregate',
      'closeblock' : false,
      'border': 'injectiongroup', // other value than true,false inidcates the used class for the svg-object
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg': function() {
        return false;
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<critical sid="section" xmlns="http://cpee.org/ns/description/1.0"/>');
        return node;
      },
      'permissible_children': function(node) {
        var func = null;
        if(node.get(0).tagName == 'group') { func = adaptor.description.insert_first_into }
        else { func = adaptor.description.insert_after }
        return [
        ];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, true);
    },
    'click': events.click,
    'dblclick': events.dblclick, 
    'mouseover': events.mouseover,
    'mouseout': events.mouseout,
   }//}}}
  };  /*}}}*/
  this.elements.start = this.elements.description = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'description',
      'endnodes' : 'passthrough',
      'closeblock' : false,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' +
                  '</svg>');
      }
    },//}}}
    'description' : {//{{{
      'permissible_children': function(node) {
        var func = null;
        if(node.get(0).tagName == 'description') { func = adaptor.description.insert_first_into }
        else { func = adaptor.description.insert_after }
        return [
          {'label': 'Service Call with Script Block', 
           'function_call': func, 
           'menu_icon': elements.callmanipulate.illustrator.svg, 
           'params': [adaptor.description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': elements.call.illustrator.svg, 
           'params': [adaptor.description.elements.call.create, node]},
          {'label': 'Script Task', 
           'function_call': func, 
           'menu_icon': elements.manipulate.illustrator.svg, 
           'params': [adaptor.description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': elements.parallel.illustrator.svg, 
           'params': [adaptor.description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': elements.choose.illustrator.svg, 
           'params': [adaptor.description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': elements.loop.illustrator.svg, 
           'params': [adaptor.description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': elements.critical.illustrator.svg, 
           'params': [adaptor.description.elements.critical.create, node]}
        ];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      events.mousedown(node,e,true, false);
    },
    'click': events.click,
    'dblclick': events.dblclick, 
    'mouseover': events.mouseover,
    'mouseout': events.mouseout,
   }//}}}
  }; /*}}}*/
.5}
