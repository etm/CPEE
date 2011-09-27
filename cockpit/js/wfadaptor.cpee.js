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
function create_readonly_property(name,content){ //{{{
  var tmp = $("#prop_template_input tr").clone();
  $('.prop_name',tmp).text(name);
  $('.prop_value',tmp).val(content);
  $('.prop_value',tmp).attr('readonly','readonly');
  return tmp;
} //}}}
function create_input_property(name,cls,content){ //{{{
  var tmp = $("#prop_template_input tr").clone();
  tmp.addClass(cls);
  $('.prop_name',tmp).text(name);
  $('.prop_value',tmp).addClass('pname_' + name.toLowerCase());
  $('.prop_value',tmp).val(content);
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

function create_cpee_elements(adaptor) {
  var illustrator = adaptor.illustrator;
  var description = adaptor.description;
  var cpee = {};

  cpee.events = {}; // {{{
  cpee.events.mousedown = function(node, e, child, sibling) { // {{{
    if(e.button == 0) {  // left-click
    } else if(e.button == 1) { // middle-click
    } else if(e.button == 2) { // right-click
      var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('element-id'));
      var group = null;
      var menu = {};

      if(child) {
        group = cpee.elements[xml_node.get(0).tagName].description.permissible_children(xml_node);
        if(group.length > 0) menu['Inster into'] = group;
      }
      if(sibling) {
        group = cpee.elements[xml_node.parent().get(0).tagName].description.permissible_children(xml_node);
        if(group.length > 0) menu['Insert after'] = group;
      }

      if(xml_node.get(0).tagName != 'description')
        menu['Remove Element'] = [{'label': 'Actual Element', 
                        'function_call': description.remove, 
                        'menu_icon': function() {
                          var icon =  cpee.elements[xml_node.get(0).tagName].illustrator.svg();
                          icon.children('circle').css({'fill':'red','fill-opacity':'0.5'});
                          return icon;
                        },
                        'params': [null, xml_node]}];
      if($('> manipulate', xml_node).length > 0 && xml_node.get(0).tagName == 'call') {
        menu['Remove Element'].push({'label': 'Remove Manipulate Block', 
                        'function_call': description.remove, 
                        'menu_icon': function() {
                          var icon =  cpee.elements.callmanipulate.illustrator.svg();
                          icon.children('circle:last').css({'fill':'red','fill-opacity':'0.5'});
                          return icon;
                        },
                        'params': ['> manipulate', xml_node]});
      }
      contextmenu(menu, e);
    }
    return false;
  } // }}} 
  cpee.events.click = function(svgnode, e) { // {{{ 
    var table = $('#dat_details');
    var node  = description.get_node_by_svg_id($(svgnode).parents(':first').attr('element-id')).get(0);

    table.empty();
    table.append(create_readonly_property('Element',node.nodeName));
    switch(node.nodeName) {
      case 'call':
        table.append(create_input_property('ID','',$(node).attr('id')));
        table.append(create_input_property('Lay','',$(node).attr('lay')));
        table.append(create_input_property('Endpoint','',$(node).attr('endpoint')));

        if ($('manipulate',node).length > 0)
          table.append(create_area_property('Manipulate','',format_text_skim($('manipulate',node).text())));

        table.append(create_header('Parameters:'));

        table.append(create_input_property('Method','indent',$('parameters method',node).text()));
        $.each($('parameters parameters *',node),function(){
          table.append(create_input_pair(this.nodeName,'indent',$(this).text()));
        });
        break;
      case 'manipulate':
        table.append(create_input_property('ID','',$(node).attr('id')));
        table.append(create_input_property('Lay','',$(node).attr('lay')));
        table.append(create_area_property('Manipulate','',format_text_skim($(node).text())));
        break;
      case 'loop':
        if ($(node).attr('pre_test'))
          var mode = 'pre_test';
        if ($(node).attr('post_test'))
          var mode = 'pre_test';
        table.append(create_select_property('Mode','',mode,['post_test','pre_test']));
        table.append(create_input_property('Condition','',$(node).attr(mode)));
        break;
      case 'choose':
        break;
      case 'alternative':
        table.append(create_input_property('Condition','',$(node).attr('condition')));
        break;
      case 'parallel':
        var wait = $(node).attr('condition') || '-1';
        table.append(create_input_property('Wait','',wait));
        table.append(create_line('Hint','-1 to wait for all branches'));
        break;
      case 'parallel_branch':
        table.append(create_input_property('Pass to branch','',$(node).attr('pass')));
        table.append(create_input_property('Local scope','',$(node).attr('local')));
        break;
      // TODO group
    }
    // add the sizer in order for colspan to work
    table.append(create_sizer());
  } // }}}
  cpee.events.dblclick = function(node, e) { // {{{
    $('.tile[element-id = "' + $(node).parents(':first').attr('element-id') + '"]').css('display','none');
    var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('element-id'));
    if(xml_node.attr('collapsed') == undefined || xml_node.attr('collapsed') == 'false') {xml_node.attr('collapsed','true');}
    else {xml_node.attr('collapsed','false');}
    description.update();
    return false;
  } // }}}
  cpee.events.mouseover = function(node, e) { // {{{
    $('.tile[element-id = "' + $(node).parents(':first').attr('element-id') + '"]').css('display','block');
    return false;
  } // }}}
  cpee.events.mouseout = function(node, e) { // {{{
    $('.tile[element-id = "' + $(node).parents(':first').attr('element-id') + '"]').css('display','none');
    return false;
  } // }}}
  cpee.events.dragstart = function (node, e) {
  }
  // }}}

  cpee.elements = {}; // {{{

/* {{{
    {'label': 'Service Call with Manipulate Block', 
     'function_call': func, 
     'params': [description.elements.callmanipulate.create, node]},
    {'label': 'Service Call', 
     'function_call': func, 
     'params': [description.elements.call.create, node]},
    {'label': 'Manipulate Block', 
     'function_call': func, 
     'params': [description.elements.callmanipulate.create, node]},
    {'label': 'Manipulate', 
     'function_call': func, 
     'params': [description.elements.manipulate.create, node]},
    {'label': 'Parallel', 
     'function_call': func, 
     'params': [description.elements.parallel.create, node]},
    {'label': 'Parallel Branch', 
     'function_call': func, 
     'params': [description.elements.parallel_branch.create, node]},
    {'label': 'Choose', 
     'function_call': func, 
     'params': [description.elements.choose.create, node]},
    {'label': 'Alternative', 
     'function_call': func, 
     'params': [description.elements.alternative.create, node]},
    {'label': 'Otherwise', 
     'function_call': func, 
     'params': [description.elements.otherwise.create, node]},
    {'label': 'Loop', 
     'function_call': func, 
     'params': [description.elements.loop.create, node]},
    {'label': 'Critical', 
     'function_call': func, 
     'params': [description.elements.critical.create, node]},
}}} */

// Primitives 
  cpee.elements.callmanipulate = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'abstract', 
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">c</text>' +
                    '<circle cx="28" cy="27" r="9" class="stand"/>' + 
                    '<text transform="translate(28,31)" class="small">m</text>' +
                  '</svg>');
      }
    },//}}}
  'description' : {//{{{
    'create':  function(target) {
      var node = null;
      node = $X('<call xmlns="http://cpee.org/ns/description/1.0"><manipulate/></call>');
      return node;
    },
    'permissible_children': function(node) {
      if(node.children('manipulate').lenght < 1)
        return [
         {'label': 'Manipulate Block', 
          'function_call': description.insert_last_into, 
          'menu_icon': cpee.elements.callmanipulate.illustrator.svg, 
          'params': [description.elements.manipulate.create, node]}
        ];
      return [];
    }
  },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, true);
    },
    'click': cpee.events.click,
   }//}}}
 }; /*}}}*/

  cpee.elements.call = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'primitive', 
      'endnodes' : 'this',
      'resolve_symbol' : function(node) { 
        if($(node).children('manipulate').length > 0) {
          return 'callmanipulate'; 
          return illustrator.elements.callmanipulate.draw(node, pos, block);
        } else {
          return'call' 
          return illustrator.draw.draw_symbol('call', $(node).attr('svg-id'), pos.row, pos.col);
        }
      },
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">c</text>' +
                  '</svg>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<call id="" endpoint="" xmlns="http://cpee.org/ns/description/1.0"/>');
        node.append($X('<parameters><method>post</method><parameters/></parameters>'));
        return node;
      },
      'permissible_children': function(node) {
        if(node.children('manipulate').length < 1) 
          return [
           {'label': 'Manipulate Block', 
            'function_call': description.insert_last_into, 
            'menu_icon': cpee.elements.callmanipulate.illustrator.svg, 
            'params': [description.elements.manipulate.create, node]}
          ];
        return [];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, true);
    },
    'click': cpee.events.click,
    'dragstart': cpee.events.dragstart,
   }//}}}
  }; /*}}}*/

  cpee.elements.manipulate = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'primitive',
      'endnodes' : 'this',
      'svg': function() {
        return $X('<svg class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">m</text>' +
                  '</svg>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        // if(target.get(0).tagName == 'call') ... means a manipukate block is requested
        var node = $X('<manipulate xmlns="http://cpee.org/ns/description/1.0"/>');
        return node;
      },
      'permissible_children': function(node) {
        return [];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,false, true);
    },
    'click': cpee.events.click,
   }//}}}
  }; /*}}}*/

// Complex 
  cpee.elements.choose = { /*{{{*/
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
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">σ</text>' +
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
        if(node.get(0).tagName == 'choose') { func = description.insert_first_into }
        else { func = description.insert_after }
        if(node.children('parallel_branch').length > 0) {
          return [{'label': 'Parallel Branch', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel_branch.illustrator.svg, 
           'params': [description.elements.parallel_branch.create, node]}];
        }
        var childs = [{'label': 'Alternative', 
         'function_call': func, 
         'menu_icon': cpee.elements.alternative.illustrator.svg, 
         'params': [description.elements.alternative.create, node]}];
        if((node.children('otherwise').length == 0) && node.parents('parallel').length == node.parents('parallel_branch').length) 
          childs.push({'label': 'Otherwise', 
           'function_call': func, 
           'menu_icon': cpee.elements.otherwise.illustrator.svg, 
           'params': [description.elements.otherwise.create, node]});
        if(node.parents('parallel').length > node.parents('parallel_branch').length) 
          childs.push({'label': 'Parallel Branch', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel_branch.illustrator.svg, 
           'params': [description.elements.parallel_branch.create, node]});
        return childs; 
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, true);
    },
    'click': cpee.events.click,
    'dblclick': cpee.events.dblclick,
    'mouseover': cpee.events.mouseover,
    'mouseout': cpee.events.mouseout,
   }//}}}
  };  /*}}}*/

  cpee.elements.otherwise = { /*{{{*/
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
                    '<circle cx="15" cy="15" r="14" class="standwithout"/>' + 
                    '<text transform="translate(15,20)" class="normal">{⁎}</text>' +
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
        if(node.get(0).tagName == 'otherwise') { func = description.insert_first_into }
        else { func = description.insert_after }
        return [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': func, 
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': cpee.elements.call.illustrator.svg, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel.illustrator.svg, 
           'params': [description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': cpee.elements.choose.illustrator.svg, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': cpee.elements.loop.illustrator.svg, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': cpee.elements.critical.illustrator.svg, 
           'params': [description.elements.critical.create, node]}
        ];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, false);
    },
    'click': cpee.events.click,
    'dblclick': cpee.events.dblclick, 
    'mouseover': cpee.events.mouseover,
    'mouseout': cpee.events.mouseout,
   }//}}}
  }; /*}}}*/
  
  cpee.elements.alternative = { /*{{{*/
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
        var node = $X('<alternative xmlns="http://cpee.org/ns/description/1.0"/>');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
      'permissible_children': function(node) {
        if(node.get(0).tagName == 'alternative') { func = description.insert_first_into }
        else { func = description.insert_after }
        if(node.parents('parallel').length > node.parents('parallel_branch').length && node.get(0).tagName == 'alternative') 
          return [{'label': 'Parallel Branch', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel_branch.illustrator.svg, 
           'params': [description.elements.parallel_branch.create, node]}];
        return [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': func, 
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': cpee.elements.call.illustrator.svg, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel.illustrator.svg, 
           'params': [description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': cpee.elements.choose.illustrator.svg, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': cpee.elements.loop.illustrator.svg, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': cpee.elements.critical.illustrator.svg, 
           'params': [description.elements.critical.create, node]}
        ];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, false);
    },
    'click': cpee.events.click,
    'dblclick': cpee.events.dblclick, 
    'mouseover': cpee.events.mouseover,
    'mouseout': cpee.events.mouseout,
   }//}}}
  };  /*}}}*/
  
  cpee.elements.loop = { /*{{{*/
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
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,23)" class="normallarge">↺</text>' +
                  '</svg>');
      }
    },// }}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<loop xmlns="http://cpee.org/ns/description/1.0"/>');
        return node;
      },
      'permissible_children': function(node) {
        var func = null;
        if(node.get(0).tagName == 'loop') { func = description.insert_first_into }
        else { func = description.insert_after }
        var childs = [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': func, 
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': cpee.elements.call.illustrator.svg, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': cpee.elements.choose.illustrator.svg, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': cpee.elements.loop.illustrator.svg, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': cpee.elements.critical.illustrator.svg, 
           'params': [description.elements.critical.create, node]}
        ];
        if(node.parent('parallel').length > node.parent('parallel_branch').length) {
          childs.push({'label': 'Parallel Branch',
                       'function_call': func, 
                       'menu_icon': cpee.elements.parallel_branch.illustrator.svg, 
                       'params': [description.elements.parallel_branch.create, node]}
                      );
        } else {
          childs.push({'label': 'Parallel',
                       'function_call': func, 
                       'menu_icon': cpee.elements.parallel.illustrator.svg, 
                       'params': [description.elements.parallel.create, node]}
                      );
        }
        return childs;
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, true);
    },
    'click': cpee.events.click,
    'dblclick': cpee.events.dblclick, 
    'mouseover': cpee.events.mouseover,
    'mouseout': cpee.events.mouseout,
   }//}}}
  };  /*}}}*/
  
  cpee.elements.parallel = { /*{{{*/
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
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">||</text>' +
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
          {'label': 'Service Call with Manipulate Block', 
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.call.illustrator.svg, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Choose', 
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.choose.illustrator.svg, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.loop.illustrator.svg, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.critical.illustrator.svg, 
           'params': [description.elements.critical.create, node]},
          {'label': 'Parallel Branch',
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.parallel_branch.illustrator.svg, 
           'params': [description.elements.parallel_branch.create, node]}
        ];
        if(node.get(0).tagName != 'parallel')
          childs.push({'label': 'Parallel', 
             'function_call': description.insert_last_into, 
             'menu_icon': cpee.elements.parallel.illustrator.svg, 
             'params': [description.elements.parallel.create, node]});
        return childs;
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, true);
    },
    'click': cpee.events.click,
    'dblclick': cpee.events.dblclick, 
    'mouseover': cpee.events.mouseover,
    'mouseout': cpee.events.mouseout,
   }//}}}
  };  /*}}}*/
  
  cpee.elements.parallel_branch = { /*{{{*/
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
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,20)" class="normal">|</text>' +
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
        if(node.get(0).tagName == 'parallel_branch') { func = description.insert_first_into }
        else { func = description.insert_after }
        childs =  [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': func, 
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': cpee.elements.call.illustrator.svg, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel.illustrator.svg, 
           'params': [description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': cpee.elements.choose.illustrator.svg, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': cpee.elements.loop.illustrator.svg, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': cpee.elements.critical.illustrator.svg, 
           'params': [description.elements.critical.create, node]},
        ];
        if(node.parents('choose').length > node.parents('alternative, otherwise').length && node.get(0).tagName == 'parallel_branch') {
          return [{'label': 'Alternative', 
           'function_call': func, 
           'menu_icon': cpee.elements.alternative.illustrator.svg, 
           'params': [description.elements.alternative.create, node]}];
//          childs.push({'label': 'Alternative', 
//           'function_call': func, 
//           'params': [description.elements.alternative.create, node]});
        }
        return childs;
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, false);
    },
    'click': cpee.events.click,
    'dblclick': cpee.events.dblclick, 
    'mouseover': cpee.events.mouseover,
    'mouseout': cpee.events.mouseout,
   }//}}}
  };  /*}}}*/
  
  cpee.elements.critical = { /*{{{*/
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
                    '<text transform="translate(16.5,21.5)" class="normal">⚠</text>' +
                  '</svg>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<critical xmlns="http://cpee.org/ns/description/1.0"/>');
        return node;
      },
      'permissible_children': function(node) {
        var func = null;
        if(node.get(0).tagName == 'critical') { func = description.insert_first_into }
        else { func = description.insert_after }
        return [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': func, 
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': cpee.elements.call.illustrator.svg, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel.illustrator.svg, 
           'params': [description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': cpee.elements.choose.illustrator.svg, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': cpee.elements.loop.illustrator.svg, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': cpee.elements.critical.illustrator.svg, 
           'params': [description.elements.critical.create, node]},
        ];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, true);
    },
    'click': cpee.events.click,
    'dblclick': cpee.events.dblclick, 
    'mouseover': cpee.events.mouseover,
    'mouseout': cpee.events.mouseout,
   }//}}}
  };  /*}}}*/
  
  cpee.elements.end = cpee.elements.description = { /*{{{*/
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
                    '<circle cx="15" cy="15" r="11" class="stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">Ω</text>' +
                  '</svg>');
      }
    },//}}}
    'description' : {//{{{
      'permissible_children': function(node) {
        var func = null;
        if(node.get(0).tagName == 'description') { func = description.insert_last_into }
        else { func = description.insert_after }
        return [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': func, 
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': cpee.elements.call.illustrator.svg, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel.illustrator.svg, 
           'params': [description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': cpee.elements.choose.illustrator.svg, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': cpee.elements.loop.illustrator.svg, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': cpee.elements.critical.illustrator.svg, 
           'params': [description.elements.critical.create, node]}
        ];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, false);
    },
    'click': cpee.events.click,
    'dblclick': cpee.events.dblclick, 
    'mouseover': cpee.events.mouseover,
    'mouseout': cpee.events.mouseout,
   }//}}}
  }; /*}}}*/
  // }}}
   
  cpee.add_elements = function() { // {{{
    for(element in cpee.elements) {
      // Illsutrator
      illustrator.elements[element] = cpee.elements[element].illustrator;
      // Description
      description.elements[element] = cpee.elements[element].description;
      // Adaptor
      adaptor.elements[element] = cpee.elements[element].adaptor;
    }
  } // }}}

  cpee.add_elements();
}   
