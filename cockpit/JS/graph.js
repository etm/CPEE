/* WfAdaptor: 
Handles interaction between Illustartor and Description 
e.g. Event fires to Adaptor to insert Element and Illustrator and Description do it
*/

function WfAdaptor(cpee_description, svg_container, svg_iconset) { // Controler {{{
  // Variable {{{
    // public
    this.illustrator;
    //private
    var illustrator;
    var description;
  // }}}
  // General Functions {{{
  var set_description = this.set_description = function(desc) { // {{{
    console.log("adaptor: set descirption");
  } // }}}
  var get_description = this.get_description = function(parser) { // {{{
    console.log('adaptor: get description');
  } // }}}
  // }}}
  // Adaption funcions {{{
  var insert = function(def_id, parent_id, index) { // {{{
    /* Interface: {{{
      def_id ..... id of the SVG symbol in the icon set
      parent ..... the SVG id of the parent node
      index ... the index where the new element should be inserted using index origin zero.
                If index represents a number greater then the number of elements, thex will be appended.
      return value = the ID genreated for the element inside the svg
     }}} */
    console.log('adaptor: insert -> ' + index);
  } // }}}
  var append = function(def_id, parent_id) { // {{{
    /* Interface: {{{
      def_id ..... id of the SVG symbol in the icon set
      parent ..... the SVG id of the parent node
      return value = the ID genreated for the element inside the svg
     }}} */
     var length; // count child of parent_id;
     return insert(def_id, parent_id, length);
  } // }}}
  var prepend = function(def_id, parent_id) { // {{{
    /* Interface: {{{
      def_id ..... id of the SVG symbol in the icon set
      parent ..... the SVG id of the parent node
      return value = the ID genreated for the element inside the svg
     }}} */
    return insert(def_id, parent_id, 0);
  } // }}}
  var remove = function(id) { // {{{
    /* Interface: {{{
      svg_id ..... the SVG id of the to be removed element
     }}} */
    console.log('adaptor: remove -> ' + id);
  } // }}}
  var update = function(id) { // {{{
    /* Interface: {{{
      svg_id ..... the SVG id of the to be removed element
     }}} */
    console.log('adaptor: update -> ' + id);
  } // }}}
  // }}}
  // Helper Functions {{{
  // }}}

  // Initialze {{{
console.log(" -> initializing adaptor: start");
  this.illustrator = illustrator = new WfIllustrator(svg_container, svg_iconset, this);
  this.description = description = new WfDescription(cpee_description, this);
console.log(" -> initializing adaptor: end");
  // }}}
} // }}}

/* WfIllustrator: 
Is in charge of displaying the Graph. It iis further able insert and remove elements with given ID's from the illsutration.
*/

function WfIllustrator(svg_container, svg_iconset, wf_adaptor) { // View  {{{
  // Variable {{{
    // public
    // private
  // }}}
  // General Functions {{{
  var set_container = function(con) { // {{{
    console.log('illustrator: set container');
  } // }}}
  var set_iconset = function(is) { // {{{
    console.log('illsutrator: set iconset');
  } // }}}
  var clear = this.clear = function() { // {{{
    console.log('illustrator: clear');
  } // }}}
  // }}}
  // Adaption functions {{{
  var insert = function(def_id, parent_id, index) { // {{{
    /* Interface: {{{
      def_id ..... id of the SVG symbol in the icon set
      parent ..... the SVG id of the parent node
      index ... the index where the new element should be inserted using index origin zero.
                If index represents a number greater then the number of elements, thex will be appended.
      return value = the ID genreated for the element inside the svg
     }}} */
    console.log('illustrator: insert -> ' + index);
  } // }}}
  var append = function(def_id, parent_id) { // {{{
    /* Interface: {{{
      def_id ..... id of the SVG symbol in the icon set
      parent ..... the SVG id of the parent node
      return value = the ID genreated for the element inside the svg
     }}} */
     var length; // count child of parent_id;
     return insert(def_id, parent_id, length);
  } // }}}
  var prepend = function(def_id, parent_id) { // {{{
    /* Interface: {{{
      def_id ..... id of the SVG symbol in the icon set
      parent ..... the SVG id of the parent node
      return value = the ID genreated for the element inside the svg
     }}} */
    return insert(def_id, parent_id, 0);
  } // }}}
  var remove = function(svg_id) { // {{{
    /* Interface: {{{
      svg_id ..... the SVG id of the to be removed element
     }}} */
  } // }}}
  // }}}
  // Visualization Functions {{{
    var draw_connection = function(start_id, end_id) { // {{{
    } // }}}
  // }}}
  // Helper Functions {{{
  // }}}
  // Initialze {{{
    set_container(svg_container);
    set_iconset(svg_iconset);
  // }}}
} // }}}

/* WfDescription: 
Manages the description. Is is further able to add/remove elements from the controlflow description.
*/

function WfDescription(cpee_description, wf_adaptor) { // Model {{{
  // Variable {{{
    // public
    // private
    var adaptor;
    var description;
  // }}}
  // General Functions {{{
  var set_description = function(desc) { // {{{
    console.log('descr: set description');
    description = desc;
    adaptor.illustrator.clear();
  } // }}}
  var get_description = function(parser) { // {{{
    console.log('descr: get description');
  } // }}}
  // }}}
  // Adaption functions {{{
  var insert = function(def_id, parent_id, index) { // {{{
    /* Interface: {{{
      def_id ..... id of the SVG symbol in the icon set
      parent ..... the SVG id of the parent node
      index ... the index where the new element should be inserted using index origin zero.
                If index represents a number greater then the number of elements, thex will be appended.
      return value = the ID genreated for the element inside the svg
     }}} */
    console.log('descr: insert -> ' + index);
  } // }}}
  var append = function(def_id, parent_id) { // {{{
    /* Interface: {{{
      def_id ..... id of the SVG symbol in the icon set
      parent ..... the SVG id of the parent node
      return value = the ID genreated for the element inside the svg
     }}} */
     var length; // count child of parent_id;
     return insert(def_id, parent_id, length);
  } // }}}
  var prepend = function(def_id, parent_id) { // {{{
    /* Interface: {{{
      def_id ..... id of the SVG symbol in the icon set
      parent ..... the SVG id of the parent node
      return value = the ID genreated for the element inside the svg
     }}} */
    return insert(def_id, parent_id, 0);
  } // }}}
  var remove = function(svg_id) { // {{{
    /* Interface: {{{
      svg_id ..... the SVG id of the to be removed element
     }}} */
    console.log('descr: remove -> ' + index);
  } // }}}
  // }}}
  // Helper Functions {{{
  // }}}
  //  Initialze {{{
  adaptor = wf_adaptor;
  set_description(cpee_description);
  // }}}
} // }}} 




//==== Original Version ==== {{{
var WFGraph = function(xml, start, container) {
  var row_height = 40;
  var column_width = 40;
  var svgNS = "http://www.w3.org/2000/svg";
  var xlinkNS = "http://www.w3.org/1999/xlink";
  
  var xml = xml;
  var lines = document.getElementById("lines");
  var symbols = document.getElementById("symbols"); 
  var blocks = document.getElementById("blocks"); 
  var symclick= function(node) { };

  this.generateGraph = function(s) { // {{{
    if (typeof s == "undefined")
      s = {};
    if (s.symclick)
      symclick = s.symclick;

    removeChilds(lines);
    removeChilds(symbols);
    removeChilds(blocks);

    var block = analyze(start, null, 1);
    var width = (block['max_pos']['col']+1)*column_width;
    var height = (block['max_pos']['line'])*row_height;
    container.parentNode.setAttribute("height", height);
    container.parentNode.setAttribute("width", width);
    return width;
  } // }}} 

  var analyze = function(parent_element, parent_position, column_shift) { // {{{
    if (parent_element == null) { return {'max_pos':{'col':0,'line':0}}; } // happens when the cockpit is loaded but no description is set
    var ap = (parent_position == null) ? {'line':0,'col':0} : copyPos(parent_position); ap['col']+=column_shift; 
    if(parent_element.nodeName != "group") ap['line']++;// AP = actual position
    var max_col = ap['col'];
    var max_line = ap['line'];
    var block = null;
    var end_nodes = [];
    var cf_elements = ['call', 'manipulate', 'parallel', 'parallel_branch', 'choose', 'alternative', 'otherwise', 'critical', 'loop', 'group'];
    if(parent_position != null && parent_element.nodeName != "parallel" &&  parent_element.nodeName != "choose") end_nodes.push(parent_position);

    var xpath = "child::*[";
    for(var i = 0; i < cf_elements.length; i++) {
      xpath = xpath + "(name() = '"+cf_elements[i]+"')";
      if (i != cf_elements.length-1) xpath = xpath + " or "; 
    }
    xpath = xpath + "]";
    var childs = xml.evaluate(xpath, parent_element, ns, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var pure_branch = true;
    var pure_choose = true;
    for(var i=0; i < childs.snapshotLength; i++) {
      var child = childs.snapshotItem(i);
      if (child.nodeName != 'parallel_branch') pure_branch = false;
      if (child.nodeName != 'alternative' && child.nodeName != 'otherwise') pure_choose = false;
    }
    for(var i=0; i < childs.snapshotLength; i++) {
      var child = childs.snapshotItem(i);
      switch(child.nodeName) {
        case 'call':
        case 'manipulate': // call and manipulate are atomic operations
          drawSymbol(ap, child, true);
          block = {'max_pos':{'line': ap['line']+1, 'col': ap['col']}, 'end_nodes': [copyPos(ap)]};
          break;
        // Elements are only with root-node connected to the sequence
        case 'loop':
        case 'parallel':
          drawSymbol(ap, child, false);
          block = analyze(child, ap, 1);
          if(child.nodeName == "parallel") drawBlock(ap, block['max_pos']);
          block['end_nodes'] = [copyPos(ap)]; // loop-node is successor
          break;
        // Last childs of the elements connect to the sequence
        case 'critical':
        case 'choose':
          drawSymbol(ap, child, false);
          block = analyze(child, ap, 1);
          if(child.nodeName == "critical") drawBlock(ap, block['max_pos']);
          break;
        case 'group':
          drawSymbol(ap, child, false);
          if (child.getAttribute('type') == 'injection') {
            block = analyze(child, {'line': ap['line']-1, 'col': ap['col']}, 1);
            drawBlock( {'line': ap['line']-1, 'col': ap['col']+1}, block['max_pos'], 'group', child);
            end_nodes = [];
          }
          if (child.getAttribute('type') == 'loop') {
            block = analyze(child, {'line': ap['line'], 'col': ap['col']}, 0);
            drawBlock( {'line': ap['line'], 'col': ap['col']}, block['max_pos'], 'group', child);
          }
          break;
        case 'alternative':
        case 'otherwise':
        case 'parallel_branch':
          drawSymbol(ap, child, false);
          if ((pure_branch  && parent_element.nodeName != 'choose') || pure_choose) {
            block = analyze(child, ap, 0);
          } else {
            block = analyze(child, ap, 1);
            block['end_nodes'] = [copyPos(ap)]; // loop-node is successor
          }  
          break;
      }
      if(max_line < block['max_pos']['line']) max_line = block['max_pos']['line'];
      if(max_col < block['max_pos']['col']) max_col = block['max_pos']['col'];
      if(pure_branch || pure_choose) {
        drawConnection(parent_position, ap, block['max_pos']['line']);
        ap['col'] = block['max_pos']['col']+1;
        for(var j = 0; j < block['end_nodes'].length; j++)
          end_nodes.push(block['end_nodes'][j]);
      } else {   
        if(parent_element.nodeName == 'parallel' && i == 0) {
          drawConnection(parent_position, ap, block['max_pos']['line']);
        }
        if(parent_element.nodeName == 'loop') {
          if (i == childs.snapshotLength - 1) {
            for(var j = 0; j < block['end_nodes'].length; j++)
              drawConnection(block['end_nodes'][j], parent_position, block['max_pos']['line'], block['end_nodes'].length);
          }
        }
        for(var j = 0; j < end_nodes.length; j++) {
          drawConnection(end_nodes[j], ap, block['max_pos']['line']);
        }
        ap['line'] = block['max_pos']['line'];
        end_nodes = block['end_nodes'];
      }
    }
    if(parent_element.nodeName == "description") {
      var end = document.createElementNS(svgNS, "use");
      end.setAttributeNS(xlinkNS, "href", "#end");
      end.setAttribute("y", (max_line)*row_height-30);
      end.setAttribute("x", (column_shift)*column_width-15);
      end.setAttribute("style", "fill: #ffffff; fill-opacity: 1");
      symbols.insertBefore(end, symbols.lastChild);
      for(var j = 0; j < end_nodes.length; j++)
        drawConnection(end_nodes[j], ap, block['max_pos']['line']);
    }
    return {'end_nodes':end_nodes, 'max_pos':{'line': max_line, 'col':max_col}};
  } // }}} 

  var drawConnection = function(start, end, max_line, num_lines) { // {{{
    if(((end['line']-start['line']) == 0) && ((end['col']-start['col']) == 0)) return; 
    var attrs = {'class': 'ourline', 'marker-end': 'url(#arrow)' };
    var line = document.createElementNS(svgNS, "path");
    for(var attr in attrs)
      line.setAttribute(attr, attrs[attr]);
    if (end['line']-start['line'] == 0 || end['col']-start['col'] == 0) {
      line.setAttribute("d", "M " + String(start['col']*column_width) + "," + String(start['line']*row_height-15) +" "+
                                    String(end['col']*column_width) + "," + String(end['line']*row_height-15)
      );
    } else if (end['line']-start['line'] > 0) {
      if (end['col']-start['col'] > 0) {
        line.setAttribute("d", "M " + String(start['col']*column_width) + "," + String(start['line']*row_height-15) +" "+
                                      String(start['col']*column_width+14) + "," + String((end['line']-1)*row_height) +" "+ // first turn of hotizontal-line going away from node
                                      String(end['col']*column_width) + "," + String((end['line']-1)*row_height) +" "+
                                      String(end['col']*column_width) + "," + String(end['line']*row_height-15)
        );
      } else {  
        line.setAttribute("d", "M " + String(start['col']*column_width) + "," + String(start['line']*row_height-15) +" "+
                                      String(start['col']*column_width) + "," + String(end['line']*row_height-35) +" "+
                                      String(end['col']*column_width+14) + "," + String(end['line']*row_height-35) +" "+ // last turn of horizontal-line going into the node
                                      String(end['col']*column_width) + "," + String(end['line']*row_height-15)
        );
      }     
    } else if(end['line']-start['line'] < 0) {
      if (num_lines > 1) {
        line.setAttribute("d", "M " + String(start['col']*column_width) + "," + String(start['line']*row_height-15) +" "+
                                      String(start['col']*column_width) + "," + String((max_line-1)*row_height+5) +" "+
                                      String(end['col']*column_width+20) + "," + String((max_line-1)*row_height+5) +" "+
                                      String(end['col']*column_width+20) + "," + String(end['line']*row_height+25)+" "+
                                      String(end['col']*column_width) + "," + String(end['line']*row_height-15)
        );
      } else {
        line.setAttribute("d", "M " + String(start['col']*column_width) + "," + String(start['line']*row_height-15) +" "+
                                      String(end['col']*column_width+20) + "," + String(start['line']*row_height-15) +" "+
                                      String(end['col']*column_width+20) + "," + String(end['line']*row_height+25)+" "+
                                      String(end['col']*column_width) + "," + String(end['line']*row_height-15)
        );
      }  
    }
    lines.appendChild(line);
  } //  }}}

  var drawSymbol = function (xy, node, id) { // {{{
    var sym_name = node.nodeName;
    var eps = xml.evaluate("d:parameters/d:service", node, ns, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var em  = xml.evaluate("d:manipulate", node, ns, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var eo  = xml.evaluate("d:outputs", node, ns, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if((sym_name == "call") && ((em.snapshotLength > 0) || (eo.snapshotLength > 0)))
      sym_name = "callmanipulate";
    if((sym_name == "call") && eps.snapshotLength == 1)
      sym_name = "callinject";

    var g = document.createElementNS(svgNS, "g");
        g.setAttribute('transform', 'translate(' + String(xy['col']*column_width-15) + ',' + String(xy['line']*row_height-30) + ')');

    if (node.getAttribute("generated")) {
      sym_name = sym_name+"_gen";
    }
    var use = document.createElementNS(svgNS, "use");
    use.setAttributeNS(xlinkNS, "href", "#"+sym_name);

    var attrs = {};
    if (id) {
      g.setAttribute('id', 'node-' + node.getAttribute("id"));

      attrs = {'id': 'graph-' + node.getAttribute("id"), 'class': 'activities'};
      var title = document.createElementNS(svgNS, "title");
      title.appendChild(document.createTextNode(node.getAttribute('id')));
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
    switch(node.nodeName) {
      case 'loop':
      case 'alternative':
        var title = document.createElementNS(svgNS, "title");
        title.appendChild(document.createTextNode(node.getAttribute('condition')));
        use.appendChild(title);
        break;
      case 'parallel':  
        break;
    }
    for(var attr in attrs)
      use.setAttribute(attr, attrs[attr]);

    use.onclick = function(){ symclick(node); };
    g.appendChild(use);
    symbols.appendChild(g);
  } // }}}

  var copyPos = function(pos) {// {{{ 
    return {'line': pos['line'], 'col':pos['col']};
  }// }}}
  var ns = function() {// {{{
    return 'http://cpee.org/ns/description/1.0'
  }// }}}
  var removeChilds = function(node) {// {{{
    while(node.childNodes[0])
      node.removeChild(node.childNodes[0]);
  }// }}}
  var drawBlock = function(p1, p2, css_class, injected_node) {// {{{
      var block = document.createElementNS(svgNS, "rect");
      var attrs = {'x':(p1['col'])*column_width-20, 'y':(p1['line'])*row_height-35, 'width':(p2['col']-p1['col']+1)*column_width, 'height':(p2['line']-p1['line'])*row_height, 'class':'block', 'rx':'20', 'ry':'20' }; 
      if(typeof css_class == "string")
        attrs['class'] = css_class;
      if (attrs['class'] == "group")
        block.onclick = function(){ symclick(injected_node); };
      for(var attr in attrs)
        block.setAttribute(attr, attrs[attr]);
      blocks.insertBefore(block, blocks.firstChild);
  }// }}}
};
//==== Original Version ==== }}}
