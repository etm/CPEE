function sym_click_constraint(node,ind) { // {{{
  var out = '';
  $(node).children().each(function(i,e){
    if (e.nodeName == "group") {
      out += '<tr><td colspan="2">';
      out += ind + $(e).attr('connector')+'-group';
      out += '</td></tr>';
      out += sym_click_constraint(e,ind + '&#160;&#160;&#160;&#160;');
    } else {
      out += '<tr><td colspan="2">';
      out += ind + 'Constraint ⇒ ' + $(e).attr('xpath') + ' ' + $(e).attr('comparator') + ' ';
      if ($(e).attr('value')) {
        out += $(e).attr('value');
      } else {
         out += '@'+$(e).attr('variable');
      }
      out += '</td></tr>';
    }  
  });  
  return out;
} // }}}

function sym_click_para(node,ind) { // {{{
  var out = '';
  $(node).children().each(function(i,e){
    if ($(e).children().length == 0) {
      out += '<tr><td colspan="2">';
      out += ind + e.nodeName + ' ⇒ ' + $(e).text().replace(/^\s+|\s+$/g,"");
      out += '</td></tr>';
    } else {
      out += '<tr><td colspan="2">';
      out += ind + e.nodeName + ':';
      out += '</td></tr>';
      out += sym_click_para(e,ind + '&#160;&#160;&#160;&#160;');
    }  
  });  
  return out;
} // }}}

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
    table.append('<tr><td><strong>Element:</strong></td><td class="long">' + node.nodeName + '</td></tr>');
    switch(node.nodeName) {
      case 'call':
        table.append('<tr><td><strong>ID:</strong></td><td class="long">' + $(node).attr('id') + '</td></tr>');
        if ($(node).attr('lay'))
          table.append('<tr><td><strong>Lay:</strong></td><td class="long"><div contenteditable="true">' + $(node).attr('lay') + '</div></td></tr>');
        table.append('<tr><td><strong>Endpoint:</strong></td><td class="long"><div contenteditable="true">' + $(node).attr('endpoint') + '</div></td></tr>');
        if ($('manipulate',node).text())
          table.append('<tr><td><strong>Manipulate:</strong></td><td class="long"><div contenteditable="true">' + format_code($('manipulate',node).text(),true,false) + '</div></td></tr>');
        if ($('parameters',node).length > 0)
          table.append('<tr><td><strong>Parameters:</strong></td><td class="long"></td></tr>');
          table.append(sym_click_para($(node).children('parameters'),'&#160;&#160;&#160;&#160;'));
        break;
      case 'manipulate':
        table.append('<tr><td><strong>ID:</strong></td><td class="long">' + $(node).attr('id') + '</td></tr>');
        table.append('<tr><td><strong>Manipulate:</strong></td><td class="long"><div contenteditable="true">' + format_code($(node).text(),true,false) + '</div></td></tr>');
        break;
      case 'loop':
        if ($(node).attr('pre_test'))
          table.append('<tr><td><strong>Pre-Test:</strong></td><td class="long"><div contenteditable="true">' + $(node).attr('pre_test') + '</div></td></tr>');
        if ($(node).attr('post_test'))
          table.append('<tr><td><strong>Post-Test:</strong></td><td class="long"><div contenteditable="true">' + $(node).attr('post_test') + '</div></td></tr>');
        break;
      case 'alternative':
        table.append('<tr><td><strong>Condition:</strong></td><td class="long"><div contenteditable="true">' + $(node).attr('condition') + '</div></td></tr>');
        break;
      case 'parallel':
        var wait = $(node).attr('condition') || 'Wait for all branches';
        table.append('<tr><td><strong>Wait:</strong></td><td class="long"><div contenteditable="true">' + wait + '</div></td></tr>');
        break;
      case 'parallel_branch':
        if ($(node).attr('pass'))
          table.append('<tr><td><strong>Pass&#160;to&#160;branch:</strong></td><td class="long"><div contenteditable="true">' + $(node).attr('pass') + '</div></td></tr>');
        if ($(node).attr('local'))
          table.append('<tr><td><strong>Local&#160;scope:</strong></td><td class="long"><div contenteditable="true">' + $(node).attr('local') + '</div></td></tr>');
        break;
      case 'group':
          table.append('<tr><td><strong>Type:</strong></td><td class="long">' + $(node).attr('type') + '</td></tr>');
          table.append('<tr><td><strong>Source:</strong></td><td class="long">' + $(node).attr('source') + '</td></tr>');
          if(node.getAttribute('type') == 'injection') {
            if ($(node).attr('result')) { table.append('<tr><td><strong>Level:</strong></td><td class="long">Class-Level</td></tr>'); }
            else { table.append('<tr><td><strong>Level:</strong></td><td class="long">Instance-Level</td></tr>'); }
            table.append('<tr><td><strong>Operation :</strong></td><td class="long">' + $(node).attr('serviceoperation') + '</td></tr>');
            if ($(node).attr('result')) table.append('<tr><td><strong>Result:</strong></td><td class="long">' + $(node).attr('result') + '</td></tr>');
            table.append('<tr><td><strong>Properties:</strong></td><td class="long">' + $(node).attr('properties') + '</td></tr>');
            table.append(sym_click_constraint($(node).children('constraints'),'&#160;&#160;&#160;&#160;'));
          }
          if(node.getAttribute('type') == 'loop') {
            table.append('<tr><td><strong>Cycle:</strong></td><td class="long">' + $(node).attr('cycle') + '</td></tr>');
          }
        break;
    }
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
