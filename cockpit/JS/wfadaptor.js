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
  this.set_svg_container = function (container) { // {{{
    illustrator.set_container(container);
  } // }}}
  // }}}

  // Adaption funcions {{{
  // }}}

  // Helper Functions {{{ 
  // }}}

  // Initialze {{{
console.log(" -> initializing adaptor: start");
  this.illustrator = illustrator = new WfIllustrator(this);
  this.description = description = new WfDescription(this, this.illustrator);
console.log(" -> initializing adaptor: end");
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
    console.log('illustrator: set container');
    clear();
    svg.container = con;
    // TODO: Problem when creatign this element with a namespace. I think this must be the reason why the arrow is not displayed at all
    svg.container.append('<defs/>');
    svg.defs = $('defs:first', svg.container);
    svg_structure();
    // Adding arrow
    var symbol = document.createElementNS(svgNS, "marker");
    var attrs = {'id':'arrow','viewBox':'0 0 10 10', 'refX':'24', 'refY':'5', 'orient':'auto', 'markerUnits':'strokeWidth', 'markerWidth':'4.5', 'makerHeight':'4.5'};
    for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
    sub = document.createElementNS(svgNS, "path");
    attrs = {'d':'m 2 2 l 6 3 l -6 3 z'};
    for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
    symbol.appendChild(sub);
    svg.defs.append(symbol);
    // Adding symbol for un-known element
    symbol = document.createElementNS(svgNS, "symbol");
    attrs = {'id':'unknown','class':''};
    for(attr in attrs) symbol.setAttribute(attr, attrs[attr]);
    sub = document.createElementNS(svgNS, "circle");
    attrs = {'cx':15, 'cy':15,'r':14,'class':'unknown'};
    for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
    symbol.appendChild(sub);
    sub = document.createElementNS(svgNS, "text");
    attrs = {'transform':'translate(15,20)','class':'normal'};
    for(attr in attrs) sub.setAttribute(attr, attrs[attr]);
    sub.appendChild(document.createTextNode('?'));
    symbol.appendChild(sub);
    svg.defs.append(symbol);
  }  // }}}
  var clear = this.clear = function() { // {{{
    console.log('illustrator: clear');
    $('g > *', svg).each(function() {$(this).remove()});
  } // }}}
  this.set_expansion = function(expansion) { // {{{
    if(expansion.row < 0) expansion.row = 1;
    if(expansion.col < 0) expansion.col = 1;
    $(svg.container).attr({'height':(expansion.row+0.0)*height,'width':(expansion.col+0.55)*width});
  } // }}}
  // }}}
  // Helper Functions {{{
  var draw_symbol = this.draw.draw_symbol = function (sym_name, id, row, col) { // {{{
    var g = document.createElementNS(svgNS, "g");
        g.setAttribute('transform', 'translate(' + String((col*width)-((width*0.39))) + ',' + String(row*height-((height*0.74))) + ')');

    var use = document.createElementNS(svgNS, "use");
    use.setAttributeNS(xlinkNS, "href", "#"+sym_name);

    var attrs = {};
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

    for(var attr in attrs)
      use.setAttribute(attr, attrs[attr]);

    $(use).bind('mousedown', function(e) {
      if(e.button == 2) {  // rightclick
        if(adaptor.elements[sym_name] == undefined || adaptor.elements[sym_name].right_click == undefined) return;
        adaptor.elements[sym_name].right_click(this,e)
      }
    });
    $(use).bind('click', function(e){ 
        if(adaptor.elements[sym_name] == undefined || adaptor.elements[sym_name].left_click == undefined) return;
        adaptor.elements[sym_name].left_click(this,e)
    });
    $(use).bind('contextmenu', false);
    g.appendChild(use);
    svg.symbols.append(g);
    return g;
  } // }}}    
  var draw_border = this.draw.draw_border = function(p1, p2) { // {{{
     var block = document.createElementNS(svgNS, "rect");
      var attrs = {'x':(p1.col-0.50)*width,'y':(p1.row-0.80)*height,'width':((p2.col+1.00)-p1.col)*width,'height':((p2.row+1.00)-p1.row)*height, 'class':'block', 'rx':'15', 'ry':'15' } 
      if(typeof css_class == "string")
        attrs['class'] = css_class;
      if (attrs['class'] == "group")
        block.onclick = function(){ symclick(injected_node); };
      for(var attr in attrs)
        block.setAttribute(attr, attrs[attr]);
      svg.blocks.prepend(block);
  } // }}}
  var draw_connection = this.draw.draw_connection = function(start, end, max_line, num_lines) { // {{{
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
    svg.lines.append(line);

  } //  }}}
  var svg_structure = function() { // {{{
    console.log('Illsutrator: building svg structure');
    svg.container.append(document.createElementNS(svgNS, "g"));
    var canvas = $('g:first', svg.container);
    svg.blocks = canvas.append(document.createElementNS(svgNS, "g"));
    svg.blocks = $('g:last',canvas);
    svg.lines = canvas.append(document.createElementNS(svgNS, "g"));
    svg.lines = $('g:last',canvas);
    svg.symbols = canvas.append(document.createElementNS(svgNS, "g"));
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
    id_counter = {};
    illustrator.clear();
    console.log(' -> Description: Start parsing');
    var expansion = parse($('description:first', description)[0], {'row':0,'col':0});
    illustrator.set_expansion(expansion.max);
    console.log(' -> Description: End parsing');
  } // }}}
  this.get_description = function() { //  public {{{
    console.log('descr: get description');
    return description.serializeXML();
  } // }}}
  this.get_node_by_svg_id = function(svg_id) { // {{{
    return $('[svg-id = ' + svg_id + ']', description);
  } // }}}
  // }}}

  // Adaption functions {{{
  this.insert_after = function(new_node, node_id) { // {{{
    console.log("Description: Inster after node-id " + node_id);
    console.log(new_node);
  } // }}}
  this.append = function(new_node, node_id) { // {{{
    console.log("Description: Append node-id " + node_id);
    console.log(new_node);
  } // }}}
  this.remove = function(selctor, node_id) {
    console.log("Description: Remove from node-id " + node_id);
    console.log(selector);
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

    if(root_expansion == 'horizontal') pos.row++; 
    if(illustrator.elements[root.tagName].col_shift(root) == true && root_expansion != 'horizontal') pos.col++; 

    $(root).children().each(function() { 
      // Calculate next position {{{
      if(root_expansion == 'vertical')  pos.row++;
      if(root_expansion == 'horizontal')  pos.col++;
      if(illustrator.elements[this.tagName] != undefined && illustrator.elements[this.tagName].type == 'complex') {
        block = parse(this, jQuery.extend(true, {}, pos));
        if(illustrator.elements[this.tagName].endnodes == 'aggregate') endnodes = []; // resets endpoints e.g. potential preceding primitive 
      } else {
        block.max.row = pos.row;
        block.max.col = pos.col;
        block.endnodes = [pos];
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

    if(root.tagName == 'description') { // {{{
      pos.row++;
      max.row++;
      if(prev[0].row != 0 || prev[0].col != 0) // this if avoids the connection from description to the first element
        for(node in prev) illustrator.draw.draw_connection(prev[node], pos);
      illustrator.elements[root.tagName].draw(null, pos);
    } // }}}

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
