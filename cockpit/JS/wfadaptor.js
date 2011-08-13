/* WfAdaptor: 
Handles interaction between Illustartor and Description 
e.g. Event fires to Adaptor to insert Element and Illustrator and Description do it
*/

function WfAdaptor(cpee_description, svg_container, update_function) { // Controler {{{
  // Variable {{{
    // public
    this.illustrator;
    this.description;
    //private
    var illustrator;
    var description;
  // }}}
  // Generic Functions {{{
  this.set_description = function(desc) { // public {{{
    console.log("adaptor: set descirption");
    this.description.set_description(desc);
  } // }}}
  this.get_description = function() { // public {{{
    console.log('adaptor: get description');
    return description.get_description();
  } // }}}
  this.notify = function(element_id, operation) { // public {{{
    console.log("Adaptor Notification: " + element_id + " -> " + operation);
  } // }}}
  // }}}
  // Adaption funcions {{{
  var insert = function(element, parent_id, index) { // {{{
    /* Interface: {{{
     }}} */
    console.log('adaptor: insert -> ' + index);
  } // }}}
  var append = function(element, parent_id) { // {{{
    /* Interface: {{{
     }}} */
     var length; // count child of parent_id;
     return insert(element, parent_id, length);
  } // }}}
  var prepend = function(elment, parent_id) { // {{{
    /* Interface: {{{
     }}} */
    return insert(element, parent_id, 0);
  } // }}}
  var remove = function(id) { // {{{
    /* Interface: {{{
     }}} */
    console.log('adaptor: remove -> ' + id);
  } // }}}
  var update = function(id) { // {{{
    /* Interface: {{{
     }}} */
    console.log('adaptor: update -> ' + id);
  } // }}}
  // }}}
  // Helper Functions {{{
  // }}}

  // Initialze {{{
console.log(" -> initializing adaptor: start");
  if(update_function != null) this.notify = update_function;
  if(cpee_description != null) this.illustrator = illustrator = new WfIllustrator(svg_container, this);
  if(svg_container != null) this.description = description = new WfDescription(cpee_description, this, this.illustrator);
console.log(" -> initializing adaptor: end");
  // }}}
}  // }}}

/* WfIllustrator: 
Is in charge of displaying the Graph. It is further able insert and remove elements with given ID's from the illsutration.
*/

function WfIllustrator(svg_container, wf_adaptor) { // View  {{{
  // Variable {{{
    // public
    var height = this.height = 40;
    var width = this.width = 40;
    // private
    var svgNS = "http://www.w3.org/2000/svg";
    var xlinkNS = "http://www.w3.org/1999/xlink";
    var svg = null;
  // }}}
  // Generic Functions {{{
  var set_container = function(con) { // {{{
    console.log('illustrator: set container');
    svg = $(con);
  }  // }}}
  var clear = this.clear = function() { // {{{
    console.log('illustrator: clear');
    $('g > *', svg).each(function() {$(this).remove()});
    matrix = [];
  } // }}}
  this.set_expansion = function(expansion) { // {{{
    svg.parent().attr({'height':(expansion.row+0.0)*height,'width':(expansion.col+0.55)*width});
  } // }}}
  // }}}
  // Adaption functions {{{
  var insert = this.insert = function(element, pid, index) { // {{{
    /* Interface: {{{
     }}} */
    console.log('illustrator: insert -> ' + index +', pid: ' + pid);
  } // }}}
  var append = this.append = function(element, pid) { // {{{
    /* Interface: {{{
     }}} */
     var length; // count child of parent_id;
     return insert(element, pid, length);
  } // }}}
  var prepend = this.prepend = function(element, pid) { // {{{
    /* Interface: {{{
     }}} */
    return insert(element, pid, 0);
  } // }}}
  var remove = this.remove = function(id) { // {{{
    /* Interface: {{{
     }}} */
  } // }}}
  // }}} 
  // Visualization Functions {{{
  this.call = { //{{{ 
    'type' : 'primitive', 
    'endnodes' : 'this',
    'draw' : function(node, pos, block) { // {{{
    if($(node).children('parameters').children('service').length > 0) {  // $('> parameters > service', $(this)) is deprecated (see jQuery Selectors)
        return draw_symbol('callinject', $(node).attr('svg-id'), pos.row, pos.col);
      } else if($(node).children('manipulate').length > 0) {
        return draw_symbol('callmanipulate', $(node).attr('svg-id'), pos.row, pos.col);
      } else {
        return draw_symbol('call', $(node).attr('svg-id'), pos.row, pos.col);
      }
    } // }}}
  };  // }}}
  this.manipulate = { // {{{
    'type' : 'primitive',
    'endnodes' : 'this',
    'draw' : function(node, pos, block) { // {{{
      return draw_symbol('manipulate', $(node).attr('svg-id'), pos.row, pos.col);
    } // }}}
  };  // }}}
  this.choose = { // {{{
    'type' : 'complex',
    'endnodes' : 'aggregate',
    'closeblock': false,
    'draw' : function(node, pos, block) { // {{{
      return draw_symbol('choose', $(node).attr('svg-id'), pos.row, pos.col);
    }, // }}}
    'expansion' : function(node) { // {{{
      return 'horizontal';
    }, // }}}
    'col_shift' : function(node) { // {{{
      return false; 
    }, // }}}
  };  // }}}
  this.otherwise = { // {{{
    'type' : 'complex',
    'endnodes' : 'passthrough',
    'closeblock': false,
    'draw' : function(node, pos, block) { // {{{
      return draw_symbol('otherwise', $(node).attr('svg-id'), pos.row, pos.col);
    }, // }}}
    'expansion' : function(node) { // {{{
      return 'vertical';
    }, // }}}
    'col_shift' : function(node) { // {{{
      return false; 
    }, // }}}
  }; // }}}
  this.alternative = { // {{{
    'type' : 'complex',
    'endnodes' : 'passthrough',
    'closeblock':false,
    'draw' : function(node, pos, block) { // {{{
      return draw_symbol('alternative', $(node).attr('svg-id'), pos.row, pos.col);
    }, // }}}
    'expansion' : function(node) { // {{{ 
      return 'vertical';
    }, // }}}
    'col_shift' : function(node) { // {{{
      return false;
    } // }}}
  };  // }}}
  this.loop = { // {{{
    'type' : 'complex',
    'endnodes' : 'this',
    'closeblock' : true,
    'draw' : function(node, pos, block) {/*{{{*/
      return draw_symbol('loop', $(node).attr('svg-id'), pos.row, pos.col);
    },/*}}}*/
    'expansion' : function(node) {/*{{{*/
      return 'vertical';
    },/*}}}*/
    'col_shift' : function(node) {/*{{{*/
      return true;
    }/*}}}*/
  };  // }}}
  this.parallel = { // {{{
    'type' : 'complex',
    'endnodes' : 'this',
    'closeblock' : false,
    'draw' : function(node, pos, block) {/*{{{*/
      draw_border(pos,block.max);
      return draw_symbol('parallel', $(node).attr('svg-id'), pos.row, pos.col);
    },/*}}}*/
    'expansion' : function(node) { /*{{{*/
      // check if any sibling other than 'parallel_branch' is present 
      if($(node).children(':not(parallel_branch)').length > 0) return 'vertical';
      return 'horizontal';
    },/*}}}*/
    'col_shift' : function(node) {/*{{{*/
      return true;
    }/*}}}*/
  };  // }}}  
  this.parallel_branch = { // {{{
    'type' : 'complex',
    'endnodes' : 'this',
    'closeblock' : false,
    'draw' : function(node, pos, block) {/*{{{*/
      return draw_symbol('parallel_branch', $(node).attr('svg-id'), pos.row, pos.col);
    },/*}}}*/
    'expansion' : function(node) { /*{{{*/
      return 'vertical';
    },/*}}}*/
    'col_shift' : function(node) {/*{{{*/
      if($(node).parents('parallel').first().children(':not(parallel_branch)').length > 0) return true;
      return false; 
    }/*}}}*/
  };  // }}}
  this.critical = { // {{{
    'type' : 'complex',
    'endnodes' : 'aggregate',
    'closeblock' : false,
    'draw' : function(node, pos, block) {/*{{{*/
      draw_border(pos,block.max);
      return draw_symbol('critical', $(node).attr('svg-id'), pos.row, pos.col);
    },/*}}}*/
    'expansion' : function(node) {/*{{{*/
      return 'vertical';
    },/*}}}*/
    'col_shift' : function(node) {/*{{{*/
      return true;
    }/*}}}*/
  };  // }}}
  this.description = { //{{{ 
    'type' : 'description',
    'endnodes' : 'passthrough',
    'closeblock' : false,
    'draw' : function(node, pos, block) {/*{{{*/
      return draw_symbol('end', $(node).attr('svg-id'), pos.row, pos.col);
    },/*}}}*/
    'expansion' : function(node) {/*{{{*/
      return 'vertical';
    },/*}}}*/
    'col_shift' : function(node) {/*{{{*/
      return true;
    }/*}}}*/
  }; // }}} 
  // }}}
  // Helper Functions {{{
  var draw_symbol = function (sym_name, id, row, col) { // {{{
    var g = document.createElementNS(svgNS, "g");
        g.setAttribute('transform', 'translate(' + String((col*width)-((width*0.39))) + ',' + String(row*height-((height*0.74))) + ')');

    var use = document.createElementNS(svgNS, "use");
    use.setAttributeNS(xlinkNS, "href", "#"+sym_name);

    var attrs = {};
    if (id) {
      g.setAttribute('id', id);

      attrs = {'id': 'graph-' + id, 'class': 'activities'};
      var title = document.createElementNS(svgNS, "title");
      title.appendChild(document.createTextNode(id));
      use.appendChild(title);

      var ts1 = document.createElementNS(svgNS, "tspan");
          ts1.setAttribute('class', 'active');
          ts1.appendChild(document.createTextNode('0'));
      var ts2 = document.createElementNS(svgNS, "tspan");
          ts2.setAttribute('class', 'colon');
          ts2.appendChild(document.createTextNode(','));
      var ts3 = document.createElementNS(svgNS, "tspan");
          ts3.setAttribute('class', 'vote');
          ts3.appendChild(document.createTextNode('0'));
      var supi = document.createElementNS(svgNS, "text");
          supi.setAttribute('class', 'super');
          supi.setAttribute('transform', 'translate(28.4,8.4)');
          supi.appendChild(ts1);
          supi.appendChild(ts2);
          supi.appendChild(ts3);
       
      g.appendChild(supi);
    }
    switch(sym_name) {
      case 'loop':
      case 'alternative':
        var title = document.createElementNS(svgNS, "title");
//        title.appendChild(document.createTextNode(node.getAttribute('condition')));
        use.appendChild(title);
        break;
      case 'parallel':  
        break;
    }
    for(var attr in attrs)
      use.setAttribute(attr, attrs[attr]);

    //use.onclick = function(){ symclick(node); };
    g.appendChild(use);
    $('#symbols_new').append(g);
    return g;
  } // }}}    
  var draw_border = this.draw_border = function(p1, p2) { // {{{
     var block = document.createElementNS(svgNS, "rect");
      var attrs = {'x':(p1.col-0.50)*width,'y':(p1.row-0.80)*height,'width':((p2.col+1.00)-p1.col)*width,'height':((p2.row+1.00)-p1.row)*height, 'class':'block', 'rx':'15', 'ry':'15' } 
      if(typeof css_class == "string")
        attrs['class'] = css_class;
      if (attrs['class'] == "group")
        block.onclick = function(){ symclick(injected_node); };
      for(var attr in attrs)
        block.setAttribute(attr, attrs[attr]);
      var blocks = document.getElementById('blocks_new');
      blocks.insertBefore(block, blocks.firstChild);
  } // }}}
  var draw_connection = this.draw_connection = function(start, end, max_line, num_lines) { // {{{
 //   console.log('connection  from ' +start.row+"/"+start.col+" -> "+end.row+"/"+end.col);

    if(((end['row']-start['row']) == 0) && ((end['col']-start['col']) == 0)) return;
    var attrs = {'class': 'ourline', 'marker-end': 'url(#arrow)' };
    var line = document.createElementNS(svgNS, "path");
    for(var attr in attrs)
      line.setAttribute(attr, attrs[attr]);
    if (end['row']-start['row'] == 0 || end['col']-start['col'] == 0) { // straight line
      line.setAttribute("d", "M " + String(start['col']*width) + "," + String(start['row']*height-15) +" "+
                                    String(end['col']*width) + "," + String(end['row']*height-15)
      );
    } else if (end['row']-start['row'] > 0) { // downwards
      if (end['col']-start['col'] > 0) {// left - right
        line.setAttribute("d", "M " + String(start['col']*width) + "," + String(start['row']*height-15) +" "+
                                      String(start['col']*width+14) + "," + String((end['row']-1)*height) +" "+ // first turn of hotizontal-line going away from node
                                      String(end['col']*width) + "," + String((end['row']-1)*height) +" "+
                                      String(end['col']*width) + "," + String(end['row']*height-15)
        );
      } else { // right - left
        line.setAttribute("d", "M " + String(start['col']*width) + "," + String(start['row']*height-15) +" "+
                                      String(start['col']*width) + "," + String(end['row']*height-35) +" "+
                                      String(end['col']*width+14) + "," + String(end['row']*height-35) +" "+ // last turn of horizontal-line going into the node
                                      String(end['col']*width) + "," + String(end['row']*height-15)
        );
      }
    } else if(end['row']-start['row'] < 0) { // upwards
      if(num_lines > 1) {// ??? no idea
        line.setAttribute("d", "M " + String(start['col']*width) + "," + String(start['row']*height-15) +" "+
                                      String(start['col']*width) + "," + String((max_line-1)*height+5) +" "+
                                      String(end['col']*width+20) + "," + String((max_line-1)*height+5) +" "+
                                      String(end['col']*width+20) + "," + String(end['row']*height+25)+" "+
                                      String(end['col']*width) + "," + String(end['row']*height-15)
        );
      } else {
        line.setAttribute("d", "M " + String(start['col']*width) + "," + String(start['row']*height-15) +" "+
                                      String(end['col']*width+20) + "," + String(start['row']*height-15) +" "+
                                      String(end['col']*width+20) + "," + String(end['row']*height+25)+" "+
                                      String(end['col']*width) + "," + String(end['row']*height-15)
        );
      }
    }
    document.getElementById('lines_new').appendChild(line);

  } //  }}}
  // }}}
  // Initialze {{{
    set_container(svg_container);
    clear();
  // }}}
} // }}}

/* WfDescription: 
Manages the description. Is is further able to add/remove elements from the controlflow description.
*/

function WfDescription(cpee_description, wf_adaptor, wf_illustrator) { // Model {{{
  // Variable {{{ 
    // public
    // private
    var adaptor;
    var illustrator;
    var description;
    var id_counter = {};
  // }}} 
  // Generic Functions {{{
  this.set_description = function(desc) { // public {{{
    console.log('descr: set description');
    if(typeof desc == "string") {
      description = $($.parseXML(desc));
    } else if(desc instanceof jQuery) {
      description = desc;
    } else {
      alert("WfDescription: unknown description type:\nConstructor-Name: " + desc.constructor + " / TypeOf: " + (typeof desc));
      description = null;
    }
    console.log(' -> Description: Start parsing');
    id_counter = {};
    illustrator.clear();
    var expansion = parse($('description:first', description)[0], {'row':0,'col':0});
    console.log('expansion of graph: ' + expansion.max.row + '/' + expansion.max.col);
    illustrator.set_expansion(expansion.max);
    console.log(' -> Description: End parsing');
  } // }}}
  this.get_description = function() { //  public {{{
    console.log('descr: get description');
    return description.serializeXML();
  } // }}}
  // }}}
  // Adaption functions {{{
  var insert = function(element, parent_id, index) { // {{{
    /* Interface: {{{
     }}} */
    console.log('descr: insert -> ' + index);
  } // }}}
  var append = function(element, parent_id) { // {{{
    /* Interface: {{{
     }}} */
     var length; // count child of parent_id;
     return insert(element, parent_id, length);
  } // }}}
  var prepend = function(element, parent_id) { // {{{
    /* Interface: {{{
     }}} */
    return insert(element, parent_id, 0);
  } // }}}
  var remove = function(svg_id) { // {{{
    /* Interface: {{{
     }}} */
    console.log('descr: remove -> ' + index);
  } // }}}
  // }}}
  // Helper Functions {{{
  var parse = function(root, parent_pos)  { // private {{{
    var pos = jQuery.extend(true, {}, parent_pos);
    var max = {'row': 0,'col': 0};
    var prev = [parent_pos]; // connects parent with child(s), depending on the expansion
    var endnodes = []; 
    var root_expansion = illustrator[root.tagName].expansion(root);
    var block =  {'max':{}}; // e.g. {'max':{'row':0,'col':0}, 'endpoints':[]};

    if(root_expansion == 'horizontal') pos.row++; 
    if(illustrator[root.tagName].col_shift(root) == true && root_expansion != 'horizontal') pos.col++; 

    $(root).children().each(function() { 
      // Calculate next position {{{
      if(root_expansion == 'vertical')  pos.row++;
      if(root_expansion == 'horizontal')  pos.col++;
      switch(illustrator[this.tagName].type) {
        case 'complex': 
          block = parse(this, jQuery.extend(true, {}, pos));
          if(illustrator[this.tagName].endnodes == 'aggregate') endnodes = []; // resets endpoints e.g. potential preceding primitive 
          break;
        case 'primitive':
          block.max.row = pos.row;
          block.max.col = pos.col;
          block.endnodes = [pos];
          break;
      }
      // }}}
      // Draw symbol {{{
      // Set SVG-ID {{{
      if($(this).attr('id') == undefined) {
        if(id_counter[this.tagName] == undefined) id_counter[this.tagName] = -1;
         $(this).attr('svg-id',this.tagName + '_' + (++id_counter[this.tagName]));
      } else { $(this).attr('svg-id',  $(this).attr('id'));}  // }}}
      (illustrator[this.tagName].draw)(this, pos, block);
      // }}}
      // Calculate Connection {{{
      if(illustrator[this.tagName].closeblock) { // Close Block if element e.g. loop 
        for(node in block.endnodes) illustrator.draw_connection(block.endnodes[node], pos, block.max.row+1, block.endnodes.length);
      }
      if(illustrator[this.tagName].endnodes != 'this')  { 
        for(i in block.endnodes) endnodes.push(block.endnodes[i]); // collects all endpoints from different childs e.g. alternatives from choose 
      } else { endnodes = [jQuery.extend(true, {}, pos)]; } // sets this element as only endpoint
      if(prev[0].row != 0 || prev[0].col != 0) // this if avoids the connection from description to the first element
        for(node in prev) illustrator.draw_connection(prev[node], pos);
      // }}}
      // Prepare next iteration {{{
      if(root_expansion == 'vertical') { prev = jQuery.extend(true, {}, endnodes); pos.row = block.max.row;} // covers e.g. input's for alternative, parallel_branch, ... everything with horizontal expansion
      if(root_expansion == 'horizontal') pos.col = block.max.col;
      if(max.row < block.max.row) max.row = block.max.row;
      if(max.col < block.max.col) max.col = block.max.col;
      // }}}
    });

    if(root.tagName == 'description') { // {{{
      pos.row++;
      max.row++;
      for(node in prev) illustrator.draw_connection(prev[node], pos);
      illustrator[root.tagName].draw(null, pos);
    } // }}}

    if(illustrator[root.tagName].endnodes == 'this' && illustrator[root.tagName].closeblock == false) {endnodes = [prev];} // closeblock == false, allows loop to close himselfe
    return {'endnodes': endnodes, 'max':max};
  } // }}}
  // }}}
  //  Initialze {{{
  adaptor = wf_adaptor;
  illustrator = wf_illustrator;
  this.set_description(cpee_description);
  // }}}
} // }}} 


// serializeXML extension for jQuery by Mark Gibson{{{
$.fn.serializeXML = function () {
    var out = '';
    if (typeof XMLSerializer == 'function') {
        var xs = new XMLSerializer();
        this.each(function() {
            out += xs.serializeToString(this);
        });
    } else if (this[0] && this[0].xml != 'undefined') {
        this.each(function() {
            out += this.xml;
        });
    }
    return out;
};
// }}}
