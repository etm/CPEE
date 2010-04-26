function WFGraph (xml, container) {
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
    //var start = xml.evaluate("//description", xml.documentElement, ns, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    var start = xml.documentElement;

    var block = analyze(start, null, 1);
    var width = (block['max_pos']['col']+1)*column_width;
    var height = (block['max_pos']['line'])*row_height;
    container.parentNode.setAttribute("height", height);
    container.parentNode.setAttribute("width", width);
    container.parentNode.parentNode.setAttribute("style", "width: " + width + "px");
  } // }}} 

  var analyze = function(parent_element, parent_position, column_shift) { // {{{
    var ap = (parent_position == null) ? {'line':0,'col':0} : copyPos(parent_position); ap['col']+=column_shift; 
    if(parent_element.nodeName != "injected") ap['line']++;// AP = actual position
    var max_col = ap['col'];
    var max_line = ap['line'];
    var block = null;
    var end_nodes = [];
    var cf_elements = ['call', 'manipulate', 'parallel', 'parallel_branch', 'choose', 'alternative', 'otherwise', 'critical', 'loop', 'injected'];
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
          if(child.nodeName == "critical" || child.nodeName == "injected") drawBlock(ap, block['max_pos']);
          break;
        case 'injected':
          drawSymbol(ap, child, false);
          block = analyze(child, ap, 0);
          drawBlock(ap, block['max_pos'], 'injected');
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
            block['end_nodes'] = [copyPos(ap)]; // loop-node is successor
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
        if(parent_element.nodeName == 'loop') {
          if (i == childs.snapshotLength - 1) {
            for(var j = 0; j < block['end_nodes'].length; j++)
              drawConnection(block['end_nodes'][j], parent_position);
          }
        }
        for(var j = 0; j < end_nodes.length; j++)
          if(end_nodes[j]['line'] !=  ap['line'])
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
  } // }}} 

  var drawConnection = function(start, end) { // {{{
    var attrs = { 'x1': start['col']*column_width, 'y1': start['line']*row_height-15,
                  'x2': end['col']*column_width, 'y2': end['line']*row_height-15,
                  'class': 'ourline', 'marker-end': 'url(#arrow)' };
    var line = document.createElementNS(svgNS, "line");
    for(var attr in attrs)
      line.setAttribute(attr, attrs[attr]);
    lines.appendChild(line);
  } //  }}}

  var drawSymbol = function (xy, node, id) { // {{{
    var sym_name = node.nodeName;
    if((sym_name == "call") && (xml.evaluate("count(child::*[name() = 'manipulate'])", node, ns, XPathResult.ANY_TYPE, null).numberValue > 0)) 
      sym_name = "callmanipulate";

    var g = document.createElementNS(svgNS, "g");
        g.setAttribute('transform', 'translate(' + String(xy['col']*column_width-15) + ',' + String(xy['line']*row_height-30) + ')');
        g.setAttribute('id', 'node-' + node.getAttribute("id"));

    var use = document.createElementNS(svgNS, "use");
    use.setAttributeNS(xlinkNS, "href", "#"+sym_name);

    var attrs = {};
    if (id) {
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
      var super = document.createElementNS(svgNS, "text");
          super.setAttribute('class', 'super');
          super.setAttribute('transform', 'translate(28.4,8.4)');
          super.appendChild(ts1);
          super.appendChild(ts2);
          super.appendChild(ts3);
       
      g.appendChild(super);
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
  var drawBlock = function(p1, p2, css_class) {// {{{
      var block = document.createElementNS(svgNS, "rect");
      var attrs = {'x':(p1['col'])*column_width-20, 'y':(p1['line'])*row_height-35, 'width':(p2['col']-p1['col']+1)*column_width, 'height':(p2['line']-p1['line'])*row_height, 'class':'block', 'rx':'20', 'ry':'20' }; 
      if(typeof css_class == "string")
        attrs['class'] = css_class;
      for(var attr in attrs)
        block.setAttribute(attr, attrs[attr]);
      blocks.appendChild(block);
  }// }}}
}
