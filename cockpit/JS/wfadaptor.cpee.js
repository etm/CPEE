function create_cpee_elements(illustrator) {
  var elements = {};

  // Abstracts 
  elements.call_manipulate = { /*{{{*/
    'illustrator': {
      'type' : 'abstract', 
      'draw' : function(node, pos, block) { 
        return illustrator.draw.draw_symbol('cpee:callmanipulate', $(node).attr('svg-id'), pos.row, pos.col);
        },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'cpee:callmanipulate','class':'clickable'};
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
    },
    'description' : {
      'create':  function() {
        var node = $('');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
    },
    'adaptor' : {
      'right_click' : function(node) { 
        console.log('rightclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      }, 
      'left_click' : function(node) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }
  }; /*}}}*/

  // Primitives 
  elements.call = { /*{{{*/
    'illustrator': {
      'type' : 'primitive', 
      'endnodes' : 'this',
      'draw' : function(node, pos, block) { 
        if($(node).children('manipulate').length > 0) {
          return illustrator.elements.call_manipulate.draw(node, pos, block);
        } else {
          return illustrator.draw.draw_symbol('cpee:call', $(node).attr('svg-id'), pos.row, pos.col);
        }
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'cpee:call','class':'clickable'};
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
    },
    'description' : {
      'create':  function() {
        var node = $('');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
    },
    'adaptor' : {
      'right_click' : function(node) { 
        console.log('rightclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      }, 
      'left_click' : function(node) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }
  }; /*}}}*/

  elements.manipulate = { /*{{{*/
    'illustrator': {
      'type' : 'primitive',
      'endnodes' : 'this',
      'draw' : function(node, pos, block) { 
        return illustrator.draw.draw_symbol('cpee:manipulate', $(node).attr('svg-id'), pos.row, pos.col);
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'cpee:manipulate','class':'clickable'};
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
    },
    'description' : {
      'create':  function() {
        var node = $('');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
    },
    'adaptor' : {
      'right_click' : function(node) { 
        console.log('rightclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      }, 
      'left_click' : function(node) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }
  }; /*}}}*/

// Complex 
  elements.choose = { /*{{{*/
    'illustrator': {
      'type' : 'complex',
      'endnodes' : 'aggregate',
      'closeblock': false,
      'draw' : function(node, pos, block) { 
        return illustrator.draw.draw_symbol('cpee:choose', $(node).attr('svg-id'), pos.row, pos.col);
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
        var attrs = {'id':'cpee:choose','class':'clickable'};
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
    },
    'description' : {
      'create':  function() {
        var node = $('');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
    },
    'adaptor' : {
      'right_click' : function(node) { 
        console.log('rightclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      }, 
      'left_click' : function(node) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }
  };  /*}}}*/

  elements.otherwise = { /*{{{*/
    'illustrator': {
      'type' : 'complex',
      'endnodes' : 'passthrough',
      'closeblock': false,
      'draw' : function(node, pos, block) { 
        return illustrator.draw.draw_symbol('cpee:otherwise', $(node).attr('svg-id'), pos.row, pos.col);
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
        var attrs = {'id':'cpee:otherwise','class':'clickable'};
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
    },
    'description' : {
      'create':  function() {
        var node = $('');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
    },
    'adaptor' : {
      'right_click' : function(node) { 
        console.log('rightclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      }, 
      'left_click' : function(node) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }
  }; /*}}}*/
  
  elements.alternative = { /*{{{*/
    'illustrator': {
      'type' : 'complex',
      'endnodes' : 'passthrough',
      'closeblock':false,
      'draw' : function(node, pos, block) { 
        return illustrator.draw.draw_symbol('cpee:alternative', $(node).attr('svg-id'), pos.row, pos.col);
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
        var attrs = {'id':'cpee:alternative','class':'clickable'};
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
    },
    'description' : {
      'create':  function() {
        var node = $('');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
    },
    'adaptor' : {
      'right_click' : function(node) { 
        console.log('rightclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      }, 
      'left_click' : function(node) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }
  };  /*}}}*/
  
  elements.loop = { /*{{{*/
    'illustrator': {
      'type' : 'complex',
      'endnodes' : 'this',
      'closeblock' : true,
      'draw' : function(node, pos, block) {
        return illustrator.draw.draw_symbol('cpee:loop', $(node).attr('svg-id'), pos.row, pos.col);
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
        var attrs = {'id':'cpee:loop','class':'clickable'};
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
    },
    'description' : {
      'create':  function() {
        var node = $('');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
    },
    'adaptor' : {
      'right_click' : function(node) { 
        console.log('rightclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      }, 
      'left_click' : function(node) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }
  };  /*}}}*/
  
  elements.parallel = { /*{{{*/
    'illustrator': {
      'type' : 'complex',
      'endnodes' : 'this',
      'closeblock' : false,
      'draw' : function(node, pos, block) {
        illustrator.draw.draw_border(pos,block.max);
        return illustrator.draw.draw_symbol('cpee:parallel', $(node).attr('svg-id'), pos.row, pos.col);
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
        var attrs = {'id':'cpee:parallel','class':'clickable'};
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
    },
    'description' : {
      'create':  function() {
        var node = $('');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
    },
    'adaptor' : {
      'right_click' : function(node) { 
        console.log('rightclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      }, 
      'left_click' : function(node) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }
  };  /*}}}*/
  
  elements.parallel_branch = { /*{{{*/
    'illustrator': {
      'type' : 'complex',
      'endnodes' : 'this',
      'closeblock' : false,
      'draw' : function(node, pos, block) {
        return illustrator.draw.draw_symbol('cpee:parallel_branch', $(node).attr('svg-id'), pos.row, pos.col);
      },
      'expansion' : function(node) { 
        return 'vertical';
      },
      'col_shift' : function(node) {
        if($(node).parents('parallel').first().children(':not(parallel_branch)').length > 0) return true;
        return false; 
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'cpee:parallel_branch','class':'clickable'};
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
    },
    'description' : {
      'create':  function() {
        var node = $('');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
    },
    'adaptor' : {
      'right_click' : function(node) { 
        console.log('rightclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      }, 
      'left_click' : function(node) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }
  };  /*}}}*/
  
  elements.critical = { /*{{{*/
    'illustrator': {
      'type' : 'complex',
      'endnodes' : 'aggregate',
      'closeblock' : false,
      'draw' : function(node, pos, block) {
        illustrator.draw.draw_border(pos,block.max);
        return illustrator.draw.draw_symbol('cpee:critical', $(node).attr('svg-id'), pos.row, pos.col);
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
        var attrs = {'id':'cpee:critical','class':'clickable'};
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
    },
    'description' : {
      'create':  function() {
        var node = $('');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
    },
    'adaptor' : {
      'right_click' : function(node) { 
        console.log('rightclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      }, 
      'left_click' : function(node) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }
  };  /*}}}*/
  
  elements.description = { /*{{{*/
    'illustrator': {
      'type' : 'description',
      'endnodes' : 'passthrough',
      'closeblock' : false,
      'draw' : function(node, pos, block) {
        return illustrator.draw.draw_symbol('cpee:end', $(node).attr('svg-id'), pos.row, pos.col);
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
        var attrs = {'id':'cpee:end','class':'clickable'};
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
    },
    'description' : {
      'create':  function() {
        var node = $('');
        return node;
      },
      'insertable' : function(parent_node, index) {
        return true;
        return false;
      },
    },
    'adaptor' : {
      'right_click' : function(node) { 
        console.log('rightclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      }, 
      'left_click' : function(node) { 
        console.log('PANG -> DEAD! leftclick on call with id ' + $(node).parents(':first').attr('id'));
        return false;
      } 
    }
  }; /*}}}*/
   
  return elements;
}   
