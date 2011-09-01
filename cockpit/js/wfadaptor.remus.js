cpee.elements = {};
  // Primitives {{{
  cpee.elements.call = { 
    'illsutrator': {
      'type' : 'primitive', 
      'endnodes' : 'this',
      'draw' : function(node, pos, block) { 
        if($(node).children('parameters').children('service').length > 0) {  // $('> parameters > service', $(this)) is deprecated (see jQuery Selectors)
          return this.call_injcet.draw(node, pos, block);
        } else if($(node).children('manipulate').length > 0) {
          return this.call_manipulate.draw(node, pos, block);
        } else {
          return draw_symbol('call', $(node).attr('svg-id'), pos.row, pos.col);
        }
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'call','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,21)','class':'normal');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('c'));
        symbols.appendChild(sub);
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
  }; 

  cpee.elements.manipulate = { 
    'illsutrator': {
      'type' : 'primitive',
      'endnodes' : 'this',
      'draw' : function(node, pos, block) { 
        return draw_symbol('manipulate', $(node).attr('svg-id'), pos.row, pos.col);
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'manipulate','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,21)','class':'normal');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('m'));
        symbols.appendChild(sub);
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
  }; 



// Complex {{{
  cpee.elements.choose = { 
    'illsutrator': {
      'type' : 'complex',
      'endnodes' : 'aggregate',
      'closeblock': false,
      'draw' : function(node, pos, block) { 
        return draw_symbol('choose', $(node).attr('svg-id'), pos.row, pos.col);
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
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,21)','class':'normal');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('σ'));
        symbols.appendChild(sub);
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
  };  

  cpee.elements.otherwise = { 
    'illsutrator': {
      'type' : 'complex',
      'endnodes' : 'passthrough',
      'closeblock': false,
      'draw' : function(node, pos, block) { 
        return draw_symbol('otherwise', $(node).attr('svg-id'), pos.row, pos.col);
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
        attrs = {'cx':15, 'cy':15,'r':14,'class':'standwithout');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,20)','class':'normal');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('{*}'));
        symbols.appendChild(sub);
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
  }; 
  
  cpee.elements.alternative = { 
    'illsutrator': {
      'type' : 'complex',
      'endnodes' : 'passthrough',
      'closeblock':false,
      'draw' : function(node, pos, block) { 
        return draw_symbol('alternative', $(node).attr('svg-id'), pos.row, pos.col);
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
        attrs = {'cx':15, 'cy':15,'r':14,'class':'standwithout');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,20)','class':'normal');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('{..}'));
        symbols.appendChild(sub);
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
  };  
  
  cpee.elements.loop = { 
    'illsutrator': {
      'type' : 'complex',
      'endnodes' : 'this',
      'closeblock' : true,
      'draw' : function(node, pos, block) {
        return draw_symbol('loop', $(node).attr('svg-id'), pos.row, pos.col);
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
        var attrs = {'id':'otherwise','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,23)','class':'normallarge');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('↺'));
        symbols.appendChild(sub);
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
  };  
  
  cpee.elements.parallel = { 
    'illsutrator': {
      'type' : 'complex',
      'endnodes' : 'this',
      'closeblock' : false,
      'draw' : function(node, pos, block) {
        draw_border(pos,block.max);
        return draw_symbol('parallel', $(node).attr('svg-id'), pos.row, pos.col);
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
        var attrs = {'id':'otherwise','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,23)','class':'normal');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('||'));
        symbols.appendChild(sub);
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
  };  
  
  cpee.elements.parallel_branch = { 
    'illsutrator': {
      'type' : 'complex',
      'endnodes' : 'this',
      'closeblock' : false,
      'draw' : function(node, pos, block) {
        return draw_symbol('parallel_branch', $(node).attr('svg-id'), pos.row, pos.col);
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
        var attrs = {'id':'otherwise','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,23)','class':'normal');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('|'));
        symbols.appendChild(sub);
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
  };  
  
  cpee.elements.critical = { 
    'illsutrator': {
      'type' : 'complex',
      'endnodes' : 'aggregate',
      'closeblock' : false,
      'draw' : function(node, pos, block) {
        draw_border(pos,block.max);
        return draw_symbol('critical', $(node).attr('svg-id'), pos.row, pos.col);
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
        var attrs = {'id':'otherwise','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(16.5,21.5)','class':'normal');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('⚠'));
        symbols.appendChild(sub);
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
  };  
  
  cpee.elements.description = { 
    'illsutrator': {
      'type' : 'description',
      'endnodes' : 'passthrough',
      'closeblock' : false,
      'draw' : function(node, pos, block) {
        return draw_symbol('end', $(node).attr('svg-id'), pos.row, pos.col);
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
        var attrs = {'id':'otherwise','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':11,'class':'stand');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,21)','class':'normal');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('Ω'));
        symbols.appendChild(sub);
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
  }; 
   
  
  // Abstracts {{{
  cpee.elements.call_inject = { 
    'illsutrator': {
    'type' : 'abstract', 
    'draw' : function(node, pos, block) { 
      return draw_symbol('callinject', $(node).attr('svg-id'), pos.row, pos.col);
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'otherwise','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,21)','class':'normal');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('c'));
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':28, 'cy':27, 'r':9,'class':'stand');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(28,32)','class':'small');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('c'));
        symbols.appendChild(sub);
        return symbol;
      }
  }; 
  
  cpee.elements.call_manipulate = { 
    'illsutrator': {
    'type' : 'abstract', 
    'draw' : function(node, pos, block) { 
      return draw_symbol('callinject', $(node).attr('svg-id'), pos.row, pos.col);
      },
      'svg_def': function() {
        var svgNS = "http://www.w3.org/2000/svg";
        var symbol = document.createElementNS(svgNS, "symbol");
        var attrs = {'id':'otherwise','class':'clickable'};
        for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':15, 'cy':15,'r':14,'class':'stand');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(15,21)','class':'normal');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('c'));
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "circle");
        attrs = {'cx':28, 'cy':27, 'r':9,'class':'stand');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        symbols.appendChild(sub);
        var sub = document.createElementNS(svgNS, "text");
        attrs = {'transform':'translate(28,32)','class':'small');
        for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
        sub.appendChild(document.createTextNode('m'));
        symbols.appendChild(sub);
        return symbol;
      }
  }; 
   





