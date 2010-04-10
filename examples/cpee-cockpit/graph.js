function WFGraph (xml, container) {
  var row_height = 40;
  var column_width = 40;
  var svgNS = "http://www.w3.org/2000/svg";
  var xlinkNS = "http://www.w3.org/1999/xlink";
  
  var xml = xml;
  var lines = document.getElementById("lines");
  var symbols = document.getElementById("symbols"); 
  var blocks = document.getElementById("blocks"); 

  this.generateGraph = function(format) {
    // {{{
    removeChilds(lines);
    removeChilds(symbols);
    removeChilds(blocks);
    //var start = xml.evaluate("//description", xml.documentElement, ns, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    var start = xml.documentElement;

    var block = analyze(start, null, 1);
    var width = (block['max_pos']['col']+1)*column_width;
    var height = (block['max_pos']['line'])*row_height;
    container.parentNode.setAttribute("height", height);
    container.parentNode.setAttribute("width", width);
    // }}} 
  }
  var analyze = function(parent_element, parent_position, column_shift) {
    // {{{
    var ap = (parent_position == null) ? {'line':0,'col':0} : copyPos(parent_position); ap['col']+=column_shift; ap['line']++;// AP = actual position
    var max_col = ap['col'];
    var max_line = ap['line'];
    var block = null;
    var end_nodes = [];
    if(parent_position != null && parent_element.nodeName != "parallel" &&  parent_element.nodeName != "choose") end_nodes.push(parent_position);

    var xpath = "child::*[name() != 'parameter']";
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
        case 'cycle':
        case 'parallel':
          drawSymbol(ap, child, false);
          block = analyze(child, ap, 1);
          if(child.nodeName == "parallel") drawBlock(ap, block['max_pos']);
          block['end_nodes'] = [copyPos(ap)]; // cycle-node is successor
          break;
        // Last childs of the elements connect to the sequence
        case 'critical':
        case 'choose':
          drawSymbol(ap, child, false);
          block = analyze(child, ap, 1);
          if(child.nodeName == "critical") drawBlock(ap, block['max_pos']);
          break;
        case 'alternative':
        case 'otherwise':
        case 'parallel_branch':
          drawSymbol(ap, child, false);
          if (pure_branch || pure_choose) {
            block = analyze(child, ap, 0);
          } else {
            block = analyze(child, ap, 1);
            if(child.nodeName == "parallel") drawBlock(ap, block['max_pos']);
            block['end_nodes'] = [copyPos(ap)]; // cycle-node is successor
          }  
          break;
      }
      if(max_line < block['max_pos']['line']) max_line = block['max_pos']['line'];
      if(max_col < block['max_pos']['col']) max_col = block['max_pos']['col'];
      if(pure_branch || pure_choose) {
        drawConnection(parent_position, ap);
        ap['col'] = block['max_pos']['col']+1;
        for(var j = 0; j < block['end_nodes'].length; j++)
          end_nodes.push(block['end_nodes'][j]);
      } else {   
        if(parent_element.nodeName == 'parallel' && i == 0) {
          drawConnection(parent_position, ap);
        }  
        if(parent_element.nodeName == 'cycle') {
          if (i == childs.snapshotLength - 1) {
            for(var j = 0; j < block['end_nodes'].length; j++)
              drawConnection(block['end_nodes'][j], parent_position);
          }
        }  
        for(var j = 0; j < end_nodes.length; j++)
          drawConnection(end_nodes[j], ap);
        ap['line'] = block['max_pos']['line'];
        end_nodes = block['end_nodes'];
      }
    }
    if(parent_element.nodeName == "description") {
      var end = document.createElementNS(svgNS, "use");
      end.setAttributeNS(xlinkNS, "href", "#end");
      end.setAttribute("y", (max_line)*row_height-30);
      end.setAttribute("x", (column_shift)*column_width-15);
      symbols.insertBefore(end, symbols.lastChild);
      for(var j = 0; j < end_nodes.length; j++)
        drawConnection(end_nodes[j], ap);
    }
    return {'end_nodes':end_nodes, 'max_pos':{'line': max_line, 'col':max_col}};
    // }}}
  }
  var drawConnection = function(start, end) {
    // {{{
    var attrs = { 'x1': start['col']*column_width, 'y1': start['line']*row_height-15,
                  'x2': end['col']*column_width, 'y2': end['line']*row_height-15,
                  'class': 'ourline', 'marker-end': 'url(#arrow)' };
    var line = document.createElementNS(svgNS, "line");
    for(var attr in attrs)
      line.setAttribute(attr, attrs[attr]);
    lines.appendChild(line);
    //  }}}
  }
  var drawSymbol = function (xy, node, id) {
   // {{{
    var sym_name = node.nodeName;
    var attrs;
    if (id)
      attrs = {'id': 'graph_' + node.getAttribute("id"), 'class': 'activities', 'x': xy['col']*column_width-15, 'y':  xy['line']*row_height-30};
    else  
      attrs = {'x': xy['col']*column_width-15, 'y':  xy['line']*row_height-30};
    var use = document.createElementNS(svgNS, "use");
    for(var attr in attrs)
      use.setAttribute(attr, attrs[attr]);
    if((sym_name == "call") && (xml.evaluate("count(child::*[name() = 'manipulate'])", node, ns, XPathResult.ANY_TYPE, null).numberValue > 0)) 
      sym_name = "callmanipulate";
    use.setAttributeNS(xlinkNS, "href", "#"+sym_name);
    symbols.appendChild(use);
  // }}} 
  }
// {{{ 
  var copyPos = function(pos) {
    return {'line': pos['line'], 'col':pos['col']};
  }
  var ns = function() {
    return 'http://cpee.org/ns/description/1.0'
  }
  var removeChilds = function(node) {
    while(node.childNodes[0])
      node.removeChild(node.childNodes[0]);
  }
  var drawBlock = function(p1, p2) {
      var block = document.createElementNS(svgNS, "rect");
      var attrs = {'x':(p1['col'])*column_width-20, 'y':(p1['line'])*row_height-35, 'width':(p2['col']-p1['col']+1)*column_width, 'height':(p2['line']-p1['line'])*row_height, 'class':'block', 'rx':'20', 'ry':'20' }; 
      for(var attr in attrs)
        block.setAttribute(attr, attrs[attr]);
      blocks.appendChild(block);
  }
// }}}
}
