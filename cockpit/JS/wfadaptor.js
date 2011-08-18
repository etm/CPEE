/* TODO: changes in svg-script:
  1) drawing frunctions
  2) creation of svg-container (Bug: arrows on lines)
  3) after-function to insert using namespace of description
*/

/* WfAdaptor: 
Handles interaction between Illustartor and Description 
e.g. Event fires to Adaptor to insert Element and Illustrator and Description do it
*/

function WfAdaptor() { // Controler {{{
  // Variable {{{
    // public
    this.illustrator;
    this.description;
    this.elements = {};
    //private
    var illustrator;
    var description;
  // }}}
  // Generic Functions {{{
  this.set_description = function(desc) { // public {{{
    this.description.set_description(desc);
  } // }}}
  this.get_description = function() { // public {{{
    return description.get_description();
  } // }}}
  this.notify = function() { // public {{{
  } // }}}
  this.set_svg_container = function (container) { // {{{
    illustrator.set_container(container); // TODO: shadowing the container element
  } // }}}
  // }}}

  // Adaption funcions {{{
  // }}}

  // Helper Functions {{{ 
  // }}}

  // Initialze {{{
  this.illustrator = illustrator = new WfIllustrator(this);
  this.description = description = new WfDescription(this, this.illustrator);
  // }}}
}  // }}}

/* WfIllustrator: 
Is in charge of displaying the Graph. It is further able insert and remove elements with given ID's from the illsutration.
*/

function WfIllustrator(wf_adaptor) { // View  {{{
  // Variable {{{
    // public
    var height = this.height = 40;
    var width = this.width = 40;
    var elements = this.elements = {};
    this.draw = {};
    // private
    var svgNS = "http://www.w3.org/2000/svg";
    var xlinkNS = "http://www.w3.org/1999/xlink";
    var svg = this.svg = {};
    var adaptor = null;
  // }}} 
  // Generic Functions {{{
  this.set_container = function(con) { // {{{
    var svgNS = "http://www.w3.org/2000/svg";
    clear();
    svg.container = con;
    // TODO: Problem when creatign this element with a namespace. I think this must be the reason why the arrow is not displayed at all
    svg.defs = $X('<defs xmlns="http://www.w3.org/2000/svg">' +
        '<marker id="arrow" viewBox="0 0 10 10" refX="33" refY="5" orient="auto" markerUnits="strokeWidth" markerWidth="4.5" makerHeight="4.5">' +
          '<path d="m 2 2 l 6 3 l -6 3 z"/>' +
        '</marker>' +
        '<symbol id="unknown" class="unknown">' +
          '<circle cx="15" cy="15" r="14" class="unkown"/>' +
          '<text transform="translate(15,20)" class="normal">?</text>' +
        '</symbol>' +
      '</defs>');
    svg.container.append(svg.defs);
    svg_structure();
  }  // }}}
  var clear = this.clear = function() { // {{{
    $('> path', svg.lines).each(function() {$(this).remove()});
    $('> rect', svg.blocks).each(function() {$(this).remove()});
    $('> g', svg.symbols).each(function() {$(this).remove()});
  } // }}}
  this.set_expansion = function(expansion) { // {{{
    if(expansion.row < 0) expansion.row = 1;
    if(expansion.col < 0) expansion.col = 1;
    $(svg.container).attr({'height':(expansion.row+0.0)*height,'width':(expansion.col+0.55)*width});
  } // }}}
  // }}}
  // Helper Functions {{{
  var draw_symbol = this.draw.draw_symbol = function (sym_name, id, row, col) { // {{{
    if(elements[sym_name] == undefined || elements[sym_name].svg_def == undefined) sym_name = 'unknown';
    var g = $X('<g id="' + id  + '" transform="translate(' + String((col*width)-((width*0.39))) + ',' + String(row*height-((height*0.74))) + ')" xmlns="http://www.w3.org/2000/svg" xmlns:x="http://www.w3.org/1999/xlink">' + 
                  '<text class="super" transform="translate(28.4,8.4)">' +
                    '<tspan class="active">0</tspan>' +
                    '<tspan class="colon">,</tspan>' +
                    '<tspan class="vote">0</tspan>' +
                  '</text>' +
                  '<use id="graph-' + id  + '" class="activities" x:href="#' + sym_name  + '">' +
                    '<title>' + id  + '</title>' +
                  '</use>' +
               '</g>'); 

    // Binding events for symbol
    for(event_name in adaptor.elements[sym_name]) {
      g.children('use:first').bind(event_name, {'function_call':adaptor.elements[sym_name][event_name]}, function(e) { e.data.function_call(this,e)});
      if(event_name == 'mousedown') g.children('use:first').bind('contextmenu', false);
    }
    svg.symbols.append(g);
    return g;
  } // }}}    
  var draw_border = this.draw.draw_border = function(id, p1, p2) { // {{{
    svg.blocks.prepend($X('<rect id="block-' + id + '" x="' + (p1.col-0.50)*width + '" ' +
        'y="' + (p1.row-0.80)*height + '" ' +
        'width="' + ((p2.col+1.00)-p1.col)*width + '" ' +
        'height="' + ((p2.row+1.00)-p1.row)*height +'" ' +
        'class="block" rx="15" ry="15" xmlns="http://www.w3.org/2000/svg"/>'));
  } // }}} 
  var draw_tile = this.draw.draw_tile = function(id, p1, p2) { // {{{
    svg.tiles.prepend($X('<rect id="tile-' + id + '" x="' + (p1.col-0.50)*width + '" ' +
        'y="' + (p1.row-0.80)*height + '" ' +
        'width="' + ((p2.col+1.00)-p1.col)*width + '" ' +
        'height="' + ((p2.row+1.00)-p1.row)*height +'" ' +
        'class="tile" rx="15" ry="15" xmlns="http://www.w3.org/2000/svg"/>'));
  } // }}}
  var draw_connection = this.draw.draw_connection = function(start, end, max_line, num_lines) { // {{{
    if(((end['row']-start['row']) == 0) && ((end['col']-start['col']) == 0)) return;
    var line = $X('<path xmlns="http://www.w3.org/2000/svg" class="ourline" marker-end="url(#arrow)"/>');
    if (end['row']-start['row'] == 0 || end['col']-start['col'] == 0) { // straight line
      line.attr("d", "M " + String(start['col']*width) + "," + String(start['row']*height-15) +" "+
                                    String(end['col']*width) + "," + String(end['row']*height-15)
      );
    } else if (end['row']-start['row'] > 0) { // downwards
      if (end['col']-start['col'] > 0) {// left - right
        line.attr("d", "M " + String(start['col']*width) + "," + String(start['row']*height-15) +" "+
                                      String(start['col']*width+14) + "," + String((end['row']-1)*height) +" "+ // first turn of hotizontal-line going away from node
                                      String(end['col']*width) + "," + String((end['row']-1)*height) +" "+
                                      String(end['col']*width) + "," + String(end['row']*height-15)
        );
      } else { // right - left
        line.attr("d", "M " + String(start['col']*width) + "," + String(start['row']*height-15) +" "+
                                      String(start['col']*width) + "," + String(end['row']*height-35) +" "+
                                      String(end['col']*width+14) + "," + String(end['row']*height-35) +" "+ // last turn of horizontal-line going into the node
                                      String(end['col']*width) + "," + String(end['row']*height-15)
        );
      }
    } else if(end['row']-start['row'] < 0) { // upwards
      if(num_lines > 1) {// ??? no idea
        line.attr("d", "M " + String(start['col']*width) + "," + String(start['row']*height-15) +" "+
                                      String(start['col']*width) + "," + String((max_line-1)*height+5) +" "+
                                      String(end['col']*width+20) + "," + String((max_line-1)*height+5) +" "+
                                      String(end['col']*width+20) + "," + String(end['row']*height+25)+" "+
                                      String(end['col']*width) + "," + String(end['row']*height-15)
        );
      } else {
        line.attr("d", "M " + String(start['col']*width) + "," + String(start['row']*height-15) +" "+
                                      String(end['col']*width+20) + "," + String(start['row']*height-15) +" "+
                                      String(end['col']*width+20) + "," + String(end['row']*height+25)+" "+
                                      String(end['col']*width) + "," + String(end['row']*height-15)
        );
      }
    }
    svg.lines.append(line);
  } //  }}}
  var svg_structure = function() { // {{{
    svg.container.append($X('<g xmlns="http://www.w3.org/2000/svg"/>'));
    var canvas = $('g:first', svg.container);
    svg.tiles = canvas.append($X('<g xmlns="http://www.w3.org/2000/svg"/>'));
    svg.tiles = $('g:last',canvas);
    svg.blocks = canvas.append($X('<g xmlns="http://www.w3.org/2000/svg"/>'));
    svg.blocks = $('g:last',canvas);
    svg.lines = canvas.append($X('<g xmlns="http://www.w3.org/2000/svg"/>'));
    svg.lines = $('g:last',canvas);
    svg.symbols = canvas.append($X('<g xmlns="http://www.w3.org/2000/svg"/>'));
    svg.symbols = $('g:last',canvas);
  } // }}}
  // }}}
  // Initialze {{{
    adaptor = wf_adaptor;
  // }}}
} // }}}

/* WfDescription: 
Manages the description. Is is further able to add/remove elements from the controlflow description.
*/

function WfDescription(wf_adaptor, wf_illustrator) { // Model {{{
  // Variable {{{ 
    // public
    var elements = this.elements = {};
    // private
    var adaptor;
    var illustrator;
    var description;
    var id_counter = {};
    var update_illustrator = true;
  // }}} 
  // Generic Functions {{{
  this.set_description = function(desc, auto_update) { // public {{{
    if(auto_update != undefined)  update_illustrator = auto_update;
    if(typeof desc == "string") {
      description = $($.parseXML(desc));
    } else if(desc instanceof jQuery) {
      description = desc;
    } else {
      alert("WfDescription: unknown description type:\nConstructor-Name: " + desc.constructor + " / TypeOf: " + (typeof desc));
      description = null;
    }
    id_counter = {};
    illustrator.clear();
    var expansion = parse($('description:first', description)[0], {'row':0,'col':0});
    illustrator.set_expansion(expansion.max);
  } // }}}
  var gd = this.get_description = function() { //  public {{{
    return description.serializeXML();
  } // }}}
  this.get_node_by_svg_id = function(svg_id) { // {{{
    return $('[svg-id = ' + svg_id + ']', description);
  } // }}}
  // }}}
  var update = this.update = function() { // {{{
    if(update_illustrator ){
      illustrator.clear();
      var expansion = parse($('description:first', description)[0], {'row':0,'col':0});
      illustrator.set_expansion(expansion.max);
    }
    adaptor.notify();
  } // }}}
  // Adaption functions {{{
  this.insert_after = function(new_node, target) { // {{{
    if(typeof(new_node) == 'function') {target.after(new_node(target));}
    else {target.after(new_node);}
    update();
  } // }}}
  this.insert_first_into = function(new_node, target, selector) { // {{{
    if(typeof(new_node) == 'function') {target.prepend(new_node(target));}
    else {target.prepend(new_node);}
    update();
  } // }}}
  this.insert_last_into = function(new_node, target, selector) { // {{{
    if(typeof(new_node) == 'function') {target.append(new_node(target));}
    else {target.append(new_node);}
    update();
  } // }}}
  this.remove = function(selector, target) {//{{{
    if(selector == undefined) {target.remove()}
    else { $(selector, target).remove();}
    update();
  }
  // }}}

  // Helper Functions {{{
  var parse = function(root, parent_pos)  { // private {{{
    var pos = jQuery.extend(true, {}, parent_pos);
    var max = {'row': 0,'col': 0};
    var prev = [parent_pos]; // connects parent with child(s), depending on the expansion
    var endnodes = []; 
    var root_expansion = illustrator.elements[root.tagName].expansion(root);
    var block =  {'max':{}}; // e.g. {'max':{'row':0,'col':0}, 'endpoints':[]};
    var collapsed = false;

    if(root_expansion == 'horizontal') pos.row++; 
    if(illustrator.elements[root.tagName].col_shift(root) == true && root_expansion != 'horizontal') pos.col++; 

    $(root).children().each(function() { 
      // Calculate next position {{{
      if($(this).attr('collapsed') == undefined || $(this).attr('collapsed') == 'false') { collapsed = false; }
      else { collapsed = true; }
      if(root_expansion == 'vertical')  pos.row++;
      if(root_expansion == 'horizontal')  pos.col++;
      if(illustrator.elements[this.tagName] != undefined && illustrator.elements[this.tagName].type == 'complex' && !collapsed) {
        block = parse(this, jQuery.extend(true, {}, pos));
        if(illustrator.elements[this.tagName].endnodes == 'aggregate') endnodes = []; // resets endpoints e.g. potential preceding primitive 
      } else {
        block.max.row = pos.row;
        block.max.col = pos.col;
        block.endnodes = (!collapsed ? [pos] : [jQuery.extend(true, {}, pos)]);
      }
      // }}}
      // Draw symbol {{{
      // Set SVG-ID {{{
      if($(this).attr('id') == undefined) {
        if(id_counter[this.tagName] == undefined) id_counter[this.tagName] = -1;
         $(this).attr('svg-id',this.tagName + '_' + (++id_counter[this.tagName]));
      } else { $(this).attr('svg-id',  $(this).attr('id'));}  // }}}
      if(illustrator.elements[this.tagName] == undefined) {
        illustrator.draw.draw_symbol('unknown', $(this).attr('svg-id'), pos.row, pos.col);
      } else {
        (illustrator.elements[this.tagName].draw)(this, pos, block);
      }
      // }}}
      // Calculate Connection {{{
      if(illustrator.elements[this.tagName] != undefined && illustrator.elements[this.tagName].closeblock) { // Close Block if element e.g. loop 
        for(node in block.endnodes) illustrator.draw.draw_connection(block.endnodes[node], pos, block.max.row+1, block.endnodes.length);
      }
      if(illustrator.elements[this.tagName] != undefined && illustrator.elements[this.tagName].endnodes != 'this')  { 
        for(i in block.endnodes) endnodes.push(block.endnodes[i]); // collects all endpoints from different childs e.g. alternatives from choose 
      } else { endnodes = [jQuery.extend(true, {}, pos)]; } // sets this element as only endpoint
      if(prev[0].row != 0 || prev[0].col != 0) // this if avoids the connection from description to the first element
        for(node in prev) illustrator.draw.draw_connection(prev[node], pos);
      // }}}
      // Prepare next iteration {{{
      if(root_expansion == 'vertical') { prev = jQuery.extend(true, {}, endnodes); pos.row = block.max.row;} // covers e.g. input's for alternative, parallel_branch, ... everything with horizontal expansion
      if(root_expansion == 'horizontal') pos.col = block.max.col;
      if(max.row < block.max.row) max.row = block.max.row;
      if(max.col < block.max.col) max.col = block.max.col;
      // }}}
    });

    if(root.tagName == 'description') { // Finsished parsing {{{
      pos.row++;
      max.row++;
      $(root).attr('svg-id','description');
      if(prev[0].row != 0 || prev[0].col != 0) // this if avoids the connection from description to the first element
        for(node in prev) illustrator.draw.draw_connection(prev[node], pos);
      illustrator.elements[root.tagName].draw(null, pos);
    } // }}}
    if($(root).children().length == 0) { // empty complex found
      endnodes = [parent_pos];
      max.row = parent_pos.row;
      max.col = parent_pos.col;
    }
    if(illustrator.elements[root.tagName].endnodes == 'this' && illustrator.elements[root.tagName].closeblock == false) {endnodes = [prev];} // closeblock == false, allows loop to close himselfe
    return {'endnodes': endnodes, 'max':max};
  } // }}}
  // }}}

  //  Initialze {{{
  adaptor = wf_adaptor;
  illustrator = wf_illustrator;
  // }}}
} // }}} 

// serializeXML extension for jQuery by Mark Gibson {{{
$.fn.serializeXML = function () {
    var out = '';
    if (typeof XMLSerializer == 'function') {
        var xs = new XMLSerializer();
        this.each(function() {
            out += XML(xs.serializeToString(this)).toXMLString();;
        });
    } else if (this[0] && this[0].xml != 'undefined') {
        this.each(function() {
            out += this.xml;
        });
    }
    return out;
};
// }}}
