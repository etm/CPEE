function create_cpee_elements(adaptor) {
  var illustrator = adaptor.illustrator;
  var description = adaptor.description;
  var elements = {};

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

  // Abstracts 
  elements.callmanipulate = { /*{{{*/
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
        return [];
      }
    },//}}}
    'adaptor' : {//{{{
      'right_click' : function(node, e) { 
        var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('id'));
        contextmenu({'Remove Element ...': [
           {'label': 'Actual Element', 
            'function_call': description.remove, 
            'params': [null, xml_node]},
           {'label': 'Manipulate Block', 
            'function_call': description.remove, 
            'params': ['> manipulate', xml_node]},
        ]}, e.pageX, e.pageY);
        return false;
      }, 
      'left_click' : function(node, e) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }//}}}
  }; /*}}}*/

  // Primitives 
  elements.call = { /*{{{*/
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
        if(node.children('manipulate').length == 0) 
          return [
           {'label': 'Manipulate Block', 
            'function_call': description.insert_last_into, 
            'params': [description.elements.callmanipulate.create(true), node]}
          ];
        return [];
      }
    },//}}}
    'adaptor' : {//{{{
      'right_click' : function(node, e) { 
        var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('id'));
        console.log('rightclick on call with id ' + xml_node.attr('svg-id'));
        var insert_into = elements.call.description.permissible_children(xml_node);
        var insert_after = elements[xml_node.parent().get(0).tagName].description.permissible_children(xml_node);
        var remove = [ {'label': 'Actual Element', 
                        'function_call': description.remove, 
                        'params': [null, xml_node]}];
        contextmenu({'Insert Into Element ...':insert_into, 'Insert After Element ...': insert_after, 'Remove Element ...': remove}, e.pageX, e.pageY);
        return false;
      }, 
      'left_click' : function(node, e) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }//}}}
  }; /*}}}*/

  elements.manipulate = { /*{{{*/
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
      'right_click' : function(node, e) { 
        var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('id'));
        console.log('rightclick on manipulate with id ' + xml_node.attr('svg-id'));
        var insert_after = elements[xml_node.parent().get(0).tagName].description.permissible_children(xml_node);
        var remove = [ {'label': 'Actual Element', 
                        'function_call': description.remove, 
                        'params': [null, xml_node]}];
        contextmenu({'Insert After Element ...': insert_after, 'Remove Element ...': remove}, e.pageX, e.pageY);
        return false;
      }, 
      'left_click' : function(node, e) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }//}}}
  }; /*}}}*/

// Complex 
  elements.choose = { /*{{{*/
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
      'right_click' : function(node, e) { 
        var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('id'));
        console.log('rightclick on call with id ' + xml_node.attr('svg-id'));
        var insert_into = elements.choose.description.permissible_children(xml_node);
        var insert_after = elements[xml_node.parent().get(0).tagName].description.permissible_children(xml_node);
        var remove = [ {'label': 'Actual Element', 
                        'function_call': description.remove, 
                        'params': [null, xml_node]}];
        contextmenu({'Insert Into Element ...':insert_into, 'Insert After Element ...': insert_after, 'Remove Element ...': remove}, e.pageX, e.pageY);
        return false;
      }, 
      'left_click' : function(node, e) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }//}}}
  };  /*}}}*/

  elements.otherwise = { /*{{{*/
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
      'right_click' : function(node, e) { 
        var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('id'));
        console.log('rightclick on call with id ' + xml_node.attr('svg-id'));
        var insert_into = elements.otherwise.description.permissible_children(xml_node);
        var remove = [ {'label': 'Actual Element', 
                        'function_call': description.remove, 
                        'params': [null, xml_node]}];
        contextmenu({'Insert Into Element ...':insert_into, 'Remove Element ...': remove}, e.pageX, e.pageY);
        return false;
      }, 
      'left_click' : function(node, e) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }//}}}
  }; /*}}}*/
  
  elements.alternative = { /*{{{*/
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
      'right_click' : function(node, e) { 
        var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('id'));
        console.log('rightclick on call with id ' + xml_node.attr('svg-id'));
        var insert_into = elements.alternative.description.permissible_children(xml_node);
        var remove = [ {'label': 'Actual Element', 
                        'function_call': description.remove, 
                        'params': [null, xml_node]}];
        contextmenu({'Insert Into Element ...':insert_into, 'Remove Element ...': remove}, e.pageX, e.pageY);
        return false;
      }, 
      'left_click' : function(node, e) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }//}}}
  };  /*}}}*/
  
  elements.loop = { /*{{{*/
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
      'right_click' : function(node, e) { 
        var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('id'));
        console.log('rightclick on call with id ' + xml_node.attr('svg-id'));
        var insert_into = elements.loop.description.permissible_children(xml_node);
        var insert_after = elements[xml_node.parent().get(0).tagName].description.permissible_children(xml_node);
        var remove = [ {'label': 'Actual Element', 
                        'function_call': description.remove, 
                        'params': [null, xml_node]}];
        contextmenu({'Insert Into Element ...':insert_into, 'Insert After Element ...': insert_after, 'Remove Element ...': remove}, e.pageX, e.pageY);
        return false;
      }, 
      'left_click' : function(node, e) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }//}}}
  };  /*}}}*/
  
  elements.parallel = { /*{{{*/
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
        return [
          {'label': 'Service Call with Manipulate Block', 
           'function_call': description.insert_last_into, 
           'params': [description.elements.callmanipulate.create(false), node]},
          {'label': 'Service Call', 
           'function_call': description.insert_last_into, 
           'params': [description.elements.call.create(), node]},
          {'label': 'Manipulate', 
           'function_call': description.insert_last_into, 
           'params': [description.elements.manipulate.create(), node]},
          {'label': 'Parallel', 
           'function_call': description.insert_last_into, 
           'params': [description.elements.parallel.create(), node]},
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
      }
    },//}}}
    'adaptor' : {//{{{
      'right_click' : function(node, e) { 
        var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('id'));
        console.log('rightclick on call with id ' + xml_node.attr('svg-id'));
        var insert_into = elements.parallel.description.permissible_children(xml_node);
        var insert_after = elements[xml_node.parent().get(0).tagName].description.permissible_children(xml_node);
        var remove = [ {'label': 'Actual Element', 
                        'function_call': description.remove, 
                        'params': [null, xml_node]}];
        contextmenu({'Insert Into Element ...':insert_into, 'Insert After Element ...': insert_after, 'Remove Element ...': remove}, e.pageX, e.pageY);
        return false;
      }, 
      'left_click' : function(node, e) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }//}}}
  };  /*}}}*/
  
  elements.parallel_branch = { /*{{{*/
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
        if(node.parents('choose').length > node.parents('alternative').length) {
          childs.push({'label': 'Alternative', 
           'function_call': func, 
           'params': [description.elements.alternative.create(), node]});
        }
        return childs;
      }
    },//}}}
    'adaptor' : {//{{{
      'right_click' : function(node, e) { 
       var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('id'));
        console.log('rightclick on call with id ' + xml_node.attr('svg-id'));
        var insert_into = elements.parallel_branch.description.permissible_children(xml_node);
        var insert_after = elements[xml_node.parent().get(0).tagName].description.permissible_children(xml_node);
        var remove = [ {'label': 'Actual Element', 
                        'function_call': description.remove, 
                        'params': [null, xml_node]}];
        if(insert_into.length > 0) {
          contextmenu({'Insert Into Element ...':insert_into, 'Insert After Element ...': insert_after, 'Remove Element ...': remove}, e.pageX, e.pageY); 
        } else {
          contextmenu({'Insert After Element ...': insert_after, 'Remove Element ...': remove}, e.pageX, e.pageY); 
        }
        return false;
      }, 
      'left_click' : function(node, e) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }//}}}
  };  /*}}}*/
  
  elements.critical = { /*{{{*/
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
      'right_click' : function(node, e) { 
        var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('id'));
        console.log('rightclick on call with id ' + xml_node.attr('svg-id'));
        var insert_into = elements.critical.description.permissible_children(xml_node);
        var insert_after = elements[xml_node.parent().get(0).tagName].description.permissible_children(xml_node);
        var remove = [ {'label': 'Actual Element', 
                        'function_call': description.remove, 
                        'params': [null, xml_node]}];
        contextmenu({'Insert Into Element ...':insert_into, 'Insert After Element ...': insert_after, 'Remove Element ...': remove}, e.pageX, e.pageY);
        return false;
      }, 
      'left_click' : function(node, e) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
     }//}}}
  };  /*}}}*/
  
  elements.end = elements.description = { /*{{{*/
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
      'right_click' : function(node, e) { 
        var xml_node = description.get_node_by_svg_id($(node).parents(':first').attr('id'));
        var insert_into = elements.description.description.permissible_children(xml_node);
        contextmenu({'Insert at the End ...': insert_into}, e.pageX, e.pageY);
        return false;
      }, 
      'left_click' : function(node, e) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }//}}}
  }; /*}}}*/
   
   console.log('Adaptor: adding cpee elements');
    for(element in elements) {
      // Illsutrator
      illustrator.elements[element] = elements[element].illustrator;
      illustrator.svg.defs.append(elements[element].illustrator.svg_def);
      // Description
      description.elements[element] = elements[element].description;
      // Adaptor
      adaptor.elements[element] = elements[element].adaptor;
    }

  return elements;
}   
