function create_cpee_elements(adaptor) {
  var illustrator = adaptor.illustrator;
  var description = adaptor.description;
  var cpee = {};

  cpee.events = {}; // {{{
  cpee.events.mousedown = function(node, e, child, sibling) { // {{{
    if(e.button == 0) {  // left-click
    } else if(e.button == 1) { // middle-click
    } else if(e.button == 2) { // right-click
      var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('id'));
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
                          var icon =  cpee.elements[xml_node.get(0).tagName].illustrator.svg_def();
                          icon.children('circle').css({'fill':'red','fill-opacity':'0.5'});
                          return icon;
                        },
                        'params': [null, xml_node]}];
      if($('> manipulate', xml_node).length > 0 && xml_node.get(0).tagName == 'call') {
        menu['Remove Element'].push({'label': 'Remove Manipulate Block', 
                        'function_call': description.remove, 
                        'menu_icon': function() {
                          var icon =  cpee.elements.callmanipulate.illustrator.svg_def();
                          icon.children('circle:last').css({'fill':'red','fill-opacity':'0.5'});
                          return icon;
                        },
                        'params': ['> manipulate', xml_node]});
      }
      contextmenu(menu, e.pageX, e.pageY);
    }
    return false;
  } // }}} 
  cpee.events.click = function(node, e) { // {{{ 
    console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
    return false;
  } // }}}
  cpee.events.dblclick = function(node, e) { // {{{
    $('#tile-' + $(node).parents(':first').attr('id')).css('display','none');
    var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('id'));
    if(xml_node.attr('collapsed') == undefined || xml_node.attr('collapsed') == 'false') {xml_node.attr('collapsed','true');}
    else {xml_node.attr('collapsed','false');}
    description.update();
    return false;
  } // }}}
  cpee.events.mouseover = function(node, e) { // {{{
    $('#tile-' + $(node.parentNode).attr('id')).css('display','block');
    return false;
  } // }}}
  cpee.events.mouseout = function(node, e) { // {{{
    $('#tile-' + $(node.parentNode).attr('id')).css('display','none');
    return false;
  } // }}}
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
      'draw' : function(node, pos, block) { 
        illustrator.draw.draw_tile($(node).attr('svg-id'), pos,block.max);
        return illustrator.draw.draw_symbol('callmanipulate', $(node).attr('svg-id'), pos.row, pos.col);
        },
      'svg_def': function() {
        return $X('<symbol id="callmanipulate" class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">c</text>' +
                    '<circle cx="28" cy="27" r="9" class="stand"/>' + 
                    '<text transform="translate(28,31)" class="small">m</text>' +
                  '</symbol>');
      }
    },//}}}
  'description' : {//{{{
    'create':  function(target) {
      var node = null;
      node = $('<call><manipulate/></call>');
      return node;
    },
    'permissible_children': function(node) {
      if(node.children('manipulate').lenght < 1)
        return [
         {'label': 'Manipulate Block', 
          'function_call': description.insert_last_into, 
          'menu_icon': cpee.elements.callmanipulate.illustrator.svg_def, 
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
      'draw' : function(node, pos, block) { 
        illustrator.draw.draw_tile($(node).attr('svg-id'), pos,block.max);
        if($(node).children('manipulate').length > 0) {
          return illustrator.elements.callmanipulate.draw(node, pos, block);
        } else {
          return illustrator.draw.draw_symbol('call', $(node).attr('svg-id'), pos.row, pos.col);
        }
      },
      'svg_def': function() {
        return $X('<symbol id="call" class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">c</text>' +
                  '</symbol>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $X('<call xmlns="http://cpee.org/ns/description/1.0"/>');
        node.append($X('<parameters><bla/></parameters>'));
        node.attr({'id-di':'super','endpoint':'besser'});
        return node;
      },
      'permissible_children': function(node) {
        if(node.children('manipulate').length < 1) 
          return [
           {'label': 'Manipulate Block', 
            'function_call': description.insert_last_into, 
            'menu_icon': cpee.elements.callmanipulate.illustrator.svg_def, 
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

  cpee.elements.manipulate = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'primitive',
      'endnodes' : 'this',
      'draw' : function(node, pos, block) { 
        illustrator.draw.draw_tile($(node).attr('svg-id'), pos,block.max);
        return illustrator.draw.draw_symbol('manipulate', $(node).attr('svg-id'), pos.row, pos.col);
      },
      'svg_def': function() {
        return $X('<symbol id="manipulate" class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">m</text>' +
                  '</symbol>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        // if(target.get(0).tagName == 'call') ... means a manipukate block is requested
        var node = $('<manipulate/>');
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
      'draw' : function(node, pos, block) { 
        illustrator.draw.draw_tile($(node).attr('svg-id'), pos,block.max);
        return illustrator.draw.draw_symbol('choose', $(node).attr('svg-id'), pos.row, pos.col);
      }, 
      'expansion' : function(node) { 
        return 'horizontal';
      }, 
      'col_shift' : function(node) { 
        return false; 
      },
      'svg_def': function() {
        return $X('<symbol id="choose" class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">σ</text>' +
                  '</symbol>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $('<choose><otherwise/></choose>');
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
           'menu_icon': cpee.elements.parallel_branch.illustrator.svg_def, 
           'params': [description.elements.parallel_branch.create, node]}];
        }
        var childs = [{'label': 'Alternative', 
         'function_call': func, 
         'menu_icon': cpee.elements.alternative.illustrator.svg_def, 
         'params': [description.elements.alternative.create, node]}];
        if((node.children('otherwise').length == 0) && node.parents('parallel').length == node.parents('parallel_branch').length) 
          childs.push({'label': 'Otherwise', 
           'function_call': func, 
           'menu_icon': cpee.elements.otherwise.illustrator.svg_def, 
           'params': [description.elements.otherwise.create, node]});
        if(node.parents('parallel').length > node.parents('parallel_branch').length) 
          childs.push({'label': 'Parallel Branch', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel_branch.illustrator.svg_def, 
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
      'draw' : function(node, pos, block) { 
        illustrator.draw.draw_tile($(node).attr('svg-id'), pos,block.max);
        return illustrator.draw.draw_symbol('otherwise', $(node).attr('svg-id'), pos.row, pos.col);
      }, 
      'expansion' : function(node) { 
        return 'vertical';
      }, 
      'col_shift' : function(node) { 
        return false; 
      },
      'svg_def': function() {
        return $X('<symbol id="otherwise" class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="standwithout"/>' + 
                    '<text transform="translate(15,20)" class="normal">{⁎}</text>' +
                  '</symbol>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $('<otherwise/>');
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
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg_def, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': cpee.elements.call.illustrator.svg_def, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg_def, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel.illustrator.svg_def, 
           'params': [description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': cpee.elements.choose.illustrator.svg_def, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': cpee.elements.loop.illustrator.svg_def, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': cpee.elements.critical.illustrator.svg_def, 
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
      'draw' : function(node, pos, block) { 
        illustrator.draw.draw_tile($(node).attr('svg-id'), pos,block.max);
        return illustrator.draw.draw_symbol('alternative', $(node).attr('svg-id'), pos.row, pos.col);
      }, 
      'expansion' : function(node) { 
        return 'vertical';
      }, 
      'col_shift' : function(node) { 
        return false;
      },
      'svg_def': function() {
        return $X('<symbol id="alternative" class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="standwithout"/>' + 
                    '<text transform="translate(15,20)" class="normal">{..}</text>' +
                  '</symbol>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $('<alternative/>');
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
           'menu_icon': cpee.elements.parallel_branch.illustrator.svg_def, 
           'params': [description.elements.parallel_branch.create, node]}];
        return [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': func, 
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg_def, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': cpee.elements.call.illustrator.svg_def, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg_def, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel.illustrator.svg_def, 
           'params': [description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': cpee.elements.choose.illustrator.svg_def, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': cpee.elements.loop.illustrator.svg_def, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': cpee.elements.critical.illustrator.svg_def, 
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
      'draw' : function(node, pos, block) {
        illustrator.draw.draw_tile($(node).attr('svg-id'), pos,block.max);
        return illustrator.draw.draw_symbol('loop', $(node).attr('svg-id'), pos.row, pos.col);
      },
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg_def': function() {
        return $X('<symbol id="loop" class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,23)" class="normallarge">↺</text>' +
                  '</symbol>');
      }
    },// }}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $('<loop/>');
        return node;
      },
      'permissible_children': function(node) {
        var func = null;
        if(node.get(0).tagName == 'loop') { func = description.insert_first_into }
        else { func = description.insert_after }
        var childs = [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': func, 
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg_def, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': cpee.elements.call.illustrator.svg_def, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg_def, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': cpee.elements.choose.illustrator.svg_def, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': cpee.elements.loop.illustrator.svg_def, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': cpee.elements.critical.illustrator.svg_def, 
           'params': [description.elements.critical.create, node]}
        ];
        if(node.parent('parallel').length > node.parent('parallel_branch').length) {
          childs.push({'label': 'Parallel Branch',
                       'function_call': func, 
                       'menu_icon': cpee.elements.parallel_branch.illustrator.svg_def, 
                       'params': [description.elements.parallel_branch.create, node]}
                      );
        } else {
          childs.push({'label': 'Parallel',
                       'function_call': func, 
                       'menu_icon': cpee.elements.parallel.illustrator.svg_def, 
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
      'draw' : function(node, pos, block) {
        illustrator.draw.draw_tile($(node).attr('svg-id'), pos,block.max);
        illustrator.draw.draw_border($(node).attr('svg-id'), pos,block.max);
        return illustrator.draw.draw_symbol('parallel', $(node).attr('svg-id'), pos.row, pos.col);
      },
      'expansion' : function(node) { 
        // check if any sibling other than 'parallel_branch' is present 
        if($(node).children(':not(parallel_branch)').length > 0) return 'vertical';
        return 'horizontal';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg_def': function() {
        return $X('<symbol id="parallel" class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">||</text>' +
                  '</symbol>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $('<parallel/>');
        return node;
      },
      'permissible_children': function(node) {
        var childs =  [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg_def, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.call.illustrator.svg_def, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg_def, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Choose', 
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.choose.illustrator.svg_def, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.loop.illustrator.svg_def, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.critical.illustrator.svg_def, 
           'params': [description.elements.critical.create, node]},
          {'label': 'Parallel Branch',
           'function_call': description.insert_last_into, 
           'menu_icon': cpee.elements.parallel_branch.illustrator.svg_def, 
           'params': [description.elements.parallel_branch.create, node]}
        ];
        if(node.get(0).tagName != 'parallel')
          childs.push({'label': 'Parallel', 
             'function_call': description.insert_last_into, 
             'menu_icon': cpee.elements.parallel.illustrator.svg_def, 
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
      'draw' : function(node, pos, block) {
        illustrator.draw.draw_tile($(node).attr('svg-id'), pos,block.max);
        return illustrator.draw.draw_symbol('parallel_branch', $(node).attr('svg-id'), pos.row, pos.col);
      },
      'expansion' : function(node) { 
        return 'vertical';
      },
      'col_shift' : function(node) {
        if(node.parentNode.tagName == 'choose') return false;
        if($(node).parents('parallel').first().children(':not(parallel_branch)').length > 0) return true;
        return false; 
      },
      'svg_def': function() {
        return $X('<symbol id="parallel_branch" class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(15,20)" class="normal">|</text>' +
                  '</symbol>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $('<parallel_branch/>');
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
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg_def, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': cpee.elements.call.illustrator.svg_def, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg_def, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel.illustrator.svg_def, 
           'params': [description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': cpee.elements.choose.illustrator.svg_def, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': cpee.elements.loop.illustrator.svg_def, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': cpee.elements.critical.illustrator.svg_def, 
           'params': [description.elements.critical.create, node]},
        ];
        if(node.parents('choose').length > node.parents('alternative, otherwise').length && node.get(0).tagName == 'parallel_branch') {
          return [{'label': 'Alternative', 
           'function_call': func, 
           'menu_icon': cpee.elements.alternative.illustrator.svg_def, 
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
      'draw' : function(node, pos, block) {
        illustrator.draw.draw_tile($(node).attr('svg-id'), pos,block.max);
        illustrator.draw.draw_border($(node).attr('svg-id'), pos,block.max);
        return illustrator.draw.draw_symbol('critical', $(node).attr('svg-id'), pos.row, pos.col);
      },
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg_def': function() {
        return $X('<symbol id="critical" class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<text transform="translate(16.5,21.5)" class="normal">⚠</text>' +
                  '</symbol>');
      }
    },//}}}
    'description' : {//{{{
      'create':  function(target) {
        var node = $('<critical/>');
        return node;
      },
      'permissible_children': function(node) {
        var func = null;
        if(node.get(0).tagName == 'critical') { func = description.insert_first_into }
        else { func = description.insert_after }
        return [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': func, 
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg_def, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': cpee.elements.call.illustrator.svg_def, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg_def, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel.illustrator.svg_def, 
           'params': [description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': cpee.elements.choose.illustrator.svg_def, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': cpee.elements.loop.illustrator.svg_def, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': cpee.elements.critical.illustrator.svg_def, 
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
      'draw' : function(node, pos, block) {
        return illustrator.draw.draw_symbol('end', 'description', pos.row, pos.col);
      },
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg_def': function() {
        return $X('<symbol id="end" class="clickable" xmlns="http://www.w3.org/2000/svg">' + 
                    '<circle cx="15" cy="15" r="14" class="stand"/>' + 
                    '<circle cx="15" cy="15" r="11" class="stand"/>' + 
                    '<text transform="translate(15,21)" class="normal">Ω</text>' +
                  '</symbol>');
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
           'menu_icon': cpee.elements.callmanipulate.illustrator.svg_def, 
           'params': [description.elements.callmanipulate.create, node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'menu_icon': cpee.elements.call.illustrator.svg_def, 
           'params': [description.elements.call.create, node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'menu_icon': cpee.elements.manipulate.illustrator.svg_def, 
           'params': [description.elements.manipulate.create, node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'menu_icon': cpee.elements.parallel.illustrator.svg_def, 
           'params': [description.elements.parallel.create, node]},
          {'label': 'Choose', 
           'function_call': func, 
           'menu_icon': cpee.elements.choose.illustrator.svg_def, 
           'params': [description.elements.choose.create, node]},
          {'label': 'Loop', 
           'function_call': func, 
           'menu_icon': cpee.elements.loop.illustrator.svg_def, 
           'params': [description.elements.loop.create, node]},
          {'label': 'Critical', 
           'function_call': func, 
           'menu_icon': cpee.elements.critical.illustrator.svg_def, 
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
    console.log('Adaptor: adding cpee elements');
    for(element in cpee.elements) {
      // Illsutrator
      illustrator.elements[element] = cpee.elements[element].illustrator;
      illustrator.svg.defs.append(cpee.elements[element].illustrator.svg_def());
      // Description
      description.elements[element] = cpee.elements[element].description;
      // Adaptor
      adaptor.elements[element] = cpee.elements[element].adaptor;
    }
    console.log('all added');
  } // }}}

  cpee.add_elements();
}   
