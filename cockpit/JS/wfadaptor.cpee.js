function create_cpee_elements(adaptor) {
  var illustrator = adaptor.illustrator;
  var description = adaptor.description;
  var cpee = {};

  cpee.events = {}; // {{{
  cpee.events.mousedown = function(node, e, child, sibling) {
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
                        'params': [null, xml_node]}];
      if($('> manipulate', xml_node).length > 0 && xml_node.get(0).tagName == 'call') {
        menu['Remove Element'].push({'label': 'Remove Manipulate Block', 
                        'function_call': description.remove, 
                        'params': ['> manipulate', xml_node]});
      }
      contextmenu(menu, e.pageX, e.pageY);
    }
    return false;
  } 
  cpee.events.click = function(node, e) {
    console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
    return false;
  } // }}}

  cpee.elements = {}; // {{{

/* {{{
    {'label': 'Service Call with Manipulate Block', 
     'function_call': func, 
     'params': [description.elements.callmanipulate.create(false), node]},
    {'label': 'Service Call', 
     'function_call': func, 
     'params': [description.elements.call.create(), node]},
    {'label': 'Manipulate Block', 
     'function_call': func, 
     'params': [description.elements.callmanipulate.create(true), node]},
    {'label': 'Manipulate', 
     'function_call': func, 
     'params': [description.elements.manipulate.create(), node]},
    {'label': 'Parallel', 
     'function_call': func, 
     'params': [description.elements.parallel.create(), node]},
    {'label': 'Parallel Branch', 
     'function_call': func, 
     'params': [description.elements.parallel_branch.create(), node]},
    {'label': 'Choose', 
     'function_call': func, 
     'params': [description.elements.choose.create(), node]},
    {'label': 'Alternative', 
     'function_call': func, 
     'params': [description.elements.alternative.create(), node]},
    {'label': 'Otherwise', 
     'function_call': func, 
     'params': [description.elements.otherwise.create(), node]},
    {'label': 'Loop', 
     'function_call': func, 
     'params': [description.elements.loop.create(), node]},
    {'label': 'Critical', 
     'function_call': func, 
     'params': [description.elements.critical.create(), node]},
}}} */

// Primitives 
  cpee.elements.callmanipulate = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'abstract', 
      'draw' : function(node, pos, block) { 
        return illustrator.draw.draw_symbol('callmanipulate', $(node).attr('svg-id'), pos.row, pos.col);
        },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'callmanipulate','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,21)','class':'normal'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('c'));
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':28, 'cy':27, 'r':9,'class':'stand'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(28,31)','class':'small'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('m'));
        symbol.appendChild(sub);
        return symbol;
      }
    },//}}}
  'description' : {//{{{
    'create':  function(only_manipulate) {
      var node = null;
      if(only_manipulate) {
        node = $('<manipulate/>');
      } else {
        node = $('<call><manipulate/></call>');
      }
        return node;
    },
    'permissible_children': function(node) {
      if(node.children('manipulate').lenght < 1)
        return [
         {'label': 'Manipulate Block', 
          'function_call': description.insert_last_into, 
          'params': [description.elements.callmanipulate.create(true), node]}
        ];
      return [];
    }
  },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, true);
    },
    'click': cpee.events.click
   }//}}}
 }; /*}}}*/

  cpee.elements.call = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'primitive', 
      'endnodes' : 'this',
      'draw' : function(node, pos, block) { 
        if($(node).children('manipulate').length > 0) {
          return illustrator.elements.callmanipulate.draw(node, pos, block);
        } else {
          return illustrator.draw.draw_symbol('call', $(node).attr('svg-id'), pos.row, pos.col);
        }
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'call','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,21)','class':'normal'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('c'));
        symbol.appendChild(sub);
        return symbol;
      }
    },//}}}
    'description' : {//{{{
      'create':  function() {
        var node = $X('<call xmlns="http://cpee.org/ns/description/1.0"/>');
        node.append($X('<parameters><bla/></parameters>'));
        node.attr({'id':'suoer','endpoint':'besser'});
        return node;
      },
      'permissible_children': function(node) {
        if(node.children('manipulate').length < 1) 
          return [
           {'label': 'Manipulate Block', 
            'function_call': description.insert_last_into, 
            'params': [description.elements.callmanipulate.create(true), node]}
          ];
        return [];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, true);
    },
    'click': cpee.events.click
   }//}}}
  }; /*}}}*/

  cpee.elements.manipulate = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'primitive',
      'endnodes' : 'this',
      'draw' : function(node, pos, block) { 
        return illustrator.draw.draw_symbol('manipulate', $(node).attr('svg-id'), pos.row, pos.col);
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'manipulate','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,21)','class':'normal'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('m'));
        symbol.appendChild(sub);
        return symbol;
      }
    },//}}}
    'description' : {//{{{
      'create':  function() {
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
    'click': cpee.events.click
   }//}}}
  }; /*}}}*/

// Complex 
  cpee.elements.choose = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'aggregate',
      'closeblock': false,
      'draw' : function(node, pos, block) { 
        return illustrator.draw.draw_symbol('choose', $(node).attr('svg-id'), pos.row, pos.col);
      }, 
      'expansion' : function(node) { 
        return 'horizontal';
      }, 
      'col_shift' : function(node) { 
        return false; 
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'choose','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,21)','class':'normal'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('σ'));
        symbol.appendChild(sub);
        return symbol;
      }
    },//}}}
    'description' : {//{{{
      'create':  function() {
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
           'params': [description.elements.parallel_branch.create(), node]}];
        }
        var childs = [{'label': 'Alternative', 
         'function_call': func, 
         'params': [description.elements.alternative.create(), node]}];
        if((node.children('otherwise').length == 0) && node.parents('parallel').length == node.parents('parallel_branch').length) 
          childs.push({'label': 'Otherwise', 
           'function_call': func, 
           'params': [description.elements.otherwise.create(), node]});
        if(node.parents('parallel').length > node.parents('parallel_branch').length) 
          childs.push({'label': 'Parallel Branch', 
           'function_call': func, 
           'params': [description.elements.parallel_branch.create(), node]});
        return childs; 
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, true);
    },
    'click': cpee.events.click
   }//}}}
  };  /*}}}*/

  cpee.elements.otherwise = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'passthrough',
      'closeblock': false,
      'draw' : function(node, pos, block) { 
        return illustrator.draw.draw_symbol('otherwise', $(node).attr('svg-id'), pos.row, pos.col);
      }, 
      'expansion' : function(node) { 
        return 'vertical';
      }, 
      'col_shift' : function(node) { 
        return false; 
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'otherwise','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'standwithout'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,20)','class':'normal'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('{⁎}'));
        symbol.appendChild(sub);
        return symbol;
      }
    },//}}}
    'description' : {//{{{
      'create':  function() {
        var node = $('<otherwise/>');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
      'permissible_children': function(node) {
        return [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.callmanipulate.create(false), node]},
          {'label': 'Service Call', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.call.create(), node]},
          {'label': 'Manipulate', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.manipulate.create(), node]},
          {'label': 'Parallel', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.parallel.create(), node]},
          {'label': 'Choose', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.choose.create(), node]},
          {'label': 'Loop', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.loop.create(), node]},
          {'label': 'Critical', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.critical.create(), node]}
        ];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, false);
    },
    'click': cpee.events.click
   }//}}}
  }; /*}}}*/
  
  cpee.elements.alternative = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'passthrough',
      'closeblock':false,
      'draw' : function(node, pos, block) { 
        return illustrator.draw.draw_symbol('alternative', $(node).attr('svg-id'), pos.row, pos.col);
      }, 
      'expansion' : function(node) { 
        return 'vertical';
      }, 
      'col_shift' : function(node) { 
        return false;
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'alternative','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'standwithout'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,20)','class':'normal'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('{..}'));
        symbol.appendChild(sub);
        return symbol;
      }
    },//}}}
    'description' : {//{{{
      'create':  function() {
        var node = $('<alternative/>');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
      'permissible_children': function(node) {
        return [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.callmanipulate.create(false), node]},
          {'label': 'Service Call', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.call.create(), node]},
          {'label': 'Manipulate', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.manipulate.create(), node]},
          {'label': 'Parallel', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.parallel.create(), node]},
          {'label': 'Choose', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.choose.create(), node]},
          {'label': 'Loop', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.loop.create(), node]},
          {'label': 'Critical', 
           'function_call': description.insert_first_into, 
           'params': [description.elements.critical.create(), node]}
        ];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, false);
    },
    'click': cpee.events.click
   }//}}}
  };  /*}}}*/
  
  cpee.elements.loop = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'this',
      'closeblock' : true,
      'draw' : function(node, pos, block) {
        return illustrator.draw.draw_symbol('loop', $(node).attr('svg-id'), pos.row, pos.col);
      },
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'loop','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,23)','class':'normallarge'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('↺'));
        symbol.appendChild(sub);
        return symbol;
      }
    },// }}}
    'description' : {//{{{
      'create':  function() {
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
           'params': [description.elements.callmanipulate.create(false), node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'params': [description.elements.call.create(), node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'params': [description.elements.manipulate.create(), node]},
          {'label': 'Choose', 
           'function_call': func, 
           'params': [description.elements.choose.create(), node]},
          {'label': 'Loop', 
           'function_call': func, 
           'params': [description.elements.loop.create(), node]},
          {'label': 'Critical', 
           'function_call': func, 
           'params': [description.elements.critical.create(), node]}
        ];
        if(node.parent('parallel').length > node.parent('parallel_branch').length) {
          childs.push({'label': 'Parallel Branch',
                       'function_call': func, 
                       'params': [description.elements.parallel_branch.create(), node]}
                      );
        } else {
          childs.push({'label': 'Parallel',
                       'function_call': func, 
                       'params': [description.elements.parallel.create(), node]}
                      );
        }
        return childs;
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, true);
    },
    'click': cpee.events.click
   }//}}}
  };  /*}}}*/
  
  cpee.elements.parallel = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'this',
      'closeblock' : false,
      'draw' : function(node, pos, block) {
        illustrator.draw.draw_border(pos,block.max);
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
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'parallel','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,21)','class':'normal'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('||'));
        symbol.appendChild(sub);
        return symbol;
      }
    },//}}}
    'description' : {//{{{
      'create':  function() {
        var node = $('<parallel/>');
        return node;
      },
      'permissible_children': function(node) {
        var childs =  [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': description.insert_last_into, 
           'params': [description.elements.callmanipulate.create(false), node]},
          {'label': 'Service Call', 
           'function_call': description.insert_last_into, 
           'params': [description.elements.call.create(), node]},
          {'label': 'Manipulate', 
           'function_call': description.insert_last_into, 
           'params': [description.elements.manipulate.create(), node]},
          {'label': 'Choose', 
           'function_call': description.insert_last_into, 
           'params': [description.elements.choose.create(), node]},
          {'label': 'Loop', 
           'function_call': description.insert_last_into, 
           'params': [description.elements.loop.create(), node]},
          {'label': 'Critical', 
           'function_call': description.insert_last_into, 
           'params': [description.elements.critical.create(), node]},
          {'label': 'Parallel Branch',
           'function_call': description.insert_last_into, 
           'params': [description.elements.parallel_branch.create(), node]}
        ];
        if(node.get(0).tagName != 'parallel')
          childs.push({'label': 'Parallel', 
             'function_call': description.insert_last_into, 
             'params': [description.elements.parallel.create(), node]});
        return childs;
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, true);
    },
    'click': cpee.events.click
   }//}}}
  };  /*}}}*/
  
  cpee.elements.parallel_branch = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'this',
      'closeblock' : false,
      'draw' : function(node, pos, block) {
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
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'parallel_branch','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,20)','class':'normal'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('|'));
        symbol.appendChild(sub);
        return symbol;
      }
    },//}}}
    'description' : {//{{{
      'create':  function() {
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
           'params': [description.elements.callmanipulate.create(false), node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'params': [description.elements.call.create(), node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'params': [description.elements.manipulate.create(), node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'params': [description.elements.parallel.create(), node]},
          {'label': 'Choose', 
           'function_call': func, 
           'params': [description.elements.choose.create(), node]},
          {'label': 'Loop', 
           'function_call': func, 
           'params': [description.elements.loop.create(), node]},
          {'label': 'Critical', 
           'function_call': func, 
           'params': [description.elements.critical.create(), node]},
        ];
        if(node.parents('choose').length > node.parents('alternative').length && node.get(0).tagName == 'parallel_branch') {
          return [{'label': 'Alternative', 
           'function_call': func, 
           'params': [description.elements.alternative.create(), node]}];
          childs.push({'label': 'Alternative', 
           'function_call': func, 
           'params': [description.elements.alternative.create(), node]});
        }
        return childs;
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, false);
    },
    'click': cpee.events.click
   }//}}}
  };  /*}}}*/
  
  cpee.elements.critical = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'aggregate',
      'closeblock' : false,
      'draw' : function(node, pos, block) {
        illustrator.draw.draw_border(pos,block.max);
        return illustrator.draw.draw_symbol('critical', $(node).attr('svg-id'), pos.row, pos.col);
      },
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'critical','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(16.5,21.5)','class':'normal'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('⚠'));
        symbol.appendChild(sub);
        return symbol;
      }
    },//}}}
    'description' : {//{{{
      'create':  function() {
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
           'params': [description.elements.callmanipulate.create(false), node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'params': [description.elements.call.create(), node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'params': [description.elements.manipulate.create(), node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'params': [description.elements.parallel.create(), node]},
          {'label': 'Choose', 
           'function_call': func, 
           'params': [description.elements.choose.create(), node]},
          {'label': 'Loop', 
           'function_call': func, 
           'params': [description.elements.loop.create(), node]},
          {'label': 'Critical', 
           'function_call': func, 
           'params': [description.elements.critical.create(), node]},
        ];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, true);
    },
    'click': cpee.events.click
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
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'end','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':11,'class':'stand'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbol.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,21)','class':'normal'};
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('Ω'));
        symbol.appendChild(sub);
        return symbol;
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
           'params': [description.elements.callmanipulate.create(false), node]},
          {'label': 'Service Call', 
           'function_call': func, 
           'params': [description.elements.call.create(), node]},
          {'label': 'Manipulate', 
           'function_call': func, 
           'params': [description.elements.manipulate.create(), node]},
          {'label': 'Parallel', 
           'function_call': func, 
           'params': [description.elements.parallel.create(), node]},
          {'label': 'Choose', 
           'function_call': func, 
           'params': [description.elements.choose.create(), node]},
          {'label': 'Loop', 
           'function_call': func, 
           'params': [description.elements.loop.create(), node]},
          {'label': 'Critical', 
           'function_call': func, 
           'params': [description.elements.critical.create(), node]}
        ];
      }
    },//}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) {
      cpee.events.mousedown(node,e,true, false);
    },
    'click': cpee.events.click
   }//}}}
  }; /*}}}*/
  // }}}
   
  cpee.add_elements = function() { // {{{
    console.log('Adaptor: adding cpee elements');
    for(element in cpee.elements) {
      // Illsutrator
      illustrator.elements[element] = cpee.elements[element].illustrator;
      illustrator.svg.defs.append(cpee.elements[element].illustrator.svg_def);
      // Description
      description.elements[element] = cpee.elements[element].description;
      // Adaptor
      adaptor.elements[element] = cpee.elements[element].adaptor;
    }
  } // }}}

  cpee.add_elements();
}   
