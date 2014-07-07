/*
  This file is part of CPEE.

  CPEE is free software: you can redistribute it and/or modify it under the terms
  of the GNU General Public License as published by the Free Software Foundation,
  either version 3 of the License, or (at your option) any later version.

  CPEE is distributed in the hope that it will be useful, but WITHOUT ANY
  WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
  PARTICULAR PURPOSE.  See the GNU General Public License for more details.

  You should have received a copy of the GNU General Public License along with
  CPEE (file COPYING in the main directory).  If not, see
  <http://www.gnu.org/licenses/>.
*/

// TODO: changes in svg-script:
// 1) drawing frunctions
// 2) creation of svg-container (Bug: arrows on lines)
// 3) after-function to insert using namespace of description

// WfAdaptor: 
// Handles interaction between Illustartor and Description 
// e.g. Event fires to Adaptor to insert Element and Illustrator and Description do it
function WfAdaptor(manifesto) { // Controller {{{
 
 // public variables {{{
    this.illustrator;
    this.description;
    this.elements = {};
  // }}}

  // public variables {{{
    var illustrator;
    var description;
  // }}}
  
  // helper funtions
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

  // initialze
  this.illustrator = illustrator = new WfIllustrator(this);
  this.description = description = new WfDescription(this, this.illustrator);

  manifestation = new manifesto(this);
  this.illustrator.noarrow = manifestation.noarrow;
  for(element in manifestation.elements) {
    this.illustrator.elements[element] = manifestation.elements[element].illustrator;
    this.description.elements[element] = manifestation.elements[element].description;
    this.elements[element] = manifestation.elements[element].adaptor;
  }
}  // }}}

// WfIllustrator: 
// Is in charge of displaying the Graph. It is further able insert and remove elements with given ID's from the illsutration.
function WfIllustrator(wf_adaptor) { // View  {{{
  // Variable {{{
    // public
    var height = this.height = 40;
    var width = this.width = 40;
    var noarrow = this.noarrow = [];
    var elements = this.elements = {};
    var svg = this.svg = {};
    this.draw = {};
    // private
    var adaptor = null;
  // }}} 
  // Generic Functions {{{
  this.set_container = function(con) { // {{{
    svg.container = con;
    svg.container.append($X('<defs xmlns="http://www.w3.org/2000/svg">' +
        '<marker id="arrow" viewBox="0 0 10 10" refX="33" refY="5" orient="auto" markerUnits="strokeWidth" markerWidth="4.5" makerHeight="4.5">' +
          '<path d="m 2 2 l 6 3 l -6 3 z"/>' +
        '</marker>' +
      '</defs>'));
    svg.defs = {};
    svg.defs['unknown'] = $X('<g xmlns="http://www.w3.org/2000/svg" class="unknown">' +
        '<circle cx="15" cy="15" r="14" class="unkown"/>' +
        '<text transform="translate(15,20)" class="normal">?</text>' +
      '</g>');
    for(element in elements) 
      if(elements[element].svg() != false) {
        var sym = $X('<g xmlns="http://www.w3.org/2000/svg"/>').append(elements[element].svg().children()); // append all children to symbol
        $.each(elements[element].svg().attr('class').split(/\s+/), function(index, item) { sym.addClass(item); }); // copy all classes from the root node
        svg.defs[element] = sym;
      }
  }  // }}}
  var clear = this.clear = function() { // {{{
    $('> :not(defs)', svg.container).each(function() {$(this).remove()});
  } // }}}
  this.set_svg = function(graph) { // {{{
    if(graph.max.row < 1) graph.max.row = 1;
    if(graph.max.col < 1) graph.max.col = 1;
    svg.container.attr({'height': (graph.max.row+0.3)*height, 'width':(graph.max.col+0.65)*width});
    svg.container.append(graph.svg);
  } // }}}
  // }}}
  // Helper Functions {{{
  var draw_symbol = this.draw.draw_symbol = function (sym_name, id, title, row, col, group) { // {{{
    if(elements[sym_name] == undefined || elements[sym_name].svg == undefined) sym_name = 'unknown';
    var g = $X('<g class="element" element-id="' + id  + '" transform="translate(' + String((col*width)-((width*0.39))) + ',' + String(row*height-((height*0.74))) + ')" xmlns="http://www.w3.org/2000/svg">' + 
                  '<text class="super" transform="translate(30,8.4)">' +
                    '<tspan class="active">0</tspan>' +
                    '<tspan class="colon">,</tspan>' +
                    '<tspan class="vote">0</tspan>' +
                  '</text>' +
               '</g>'); 
    var sym = svg.defs[sym_name].clone();
    sym.prepend($X('<title xmlns="http://www.w3.org/2000/svg">' + title  + '</title>'));
    sym.attr('class','activities');
    g.append(sym);

    // Binding events for symbol
    for(event_name in adaptor.elements[sym_name]) {
      sym.bind(event_name, {'function_call':adaptor.elements[sym_name][event_name]}, function(e) { e.data.function_call($(this).parents(':first').attr('element-id'),e)});
      if(event_name == 'mousedown') sym.bind('contextmenu', false);
    }
    if(group) {group.append(g);}
    else {svg.container.children('g:first').append(g);} 
    return g;
  } // }}}    
  var draw_border = this.draw.draw_border = function(id, p1, p2, group) { // {{{
    group.prepend($X('<rect element-id="' + id + '" x="' + (p1.col-0.50)*width + '" ' +
        'y="' + (p1.row-0.80)*height + '" ' +
        'width="' + ((p2.col+1.00)-p1.col)*width + '" ' +
        'height="' + ((p2.row+1.00)-p1.row)*height +'" ' +
        'class="block" rx="15" ry="15" xmlns="http://www.w3.org/2000/svg"/>'));
  } // }}} 
  var draw_tile = this.draw.draw_tile = function(id, p1, p2, group) { // {{{
    group.prepend($X('<rect element-id="' + id + '" x="' + (p1.col-0.50)*width + '" ' +
        'y="' + (p1.row-0.80)*height + '" ' +
        'width="' + ((p2.col+1.00)-p1.col)*width + '" ' +
        'height="' + ((p2.row+1.00)-p1.row)*height +'" ' +
        'class="tile" rx="15" ry="15" xmlns="http://www.w3.org/2000/svg"/>'));
  } // }}}
  var draw_connection = this.draw.draw_connection = function(group, start, end, max_line, num_lines, arrow) { // {{{
    if(((end['row']-start['row']) == 0) && ((end['col']-start['col']) == 0)) return;
    var line;
    if (arrow)
      line = $X('<path xmlns="http://www.w3.org/2000/svg" class="ourline" marker-end="url(#arrow)"/>');
    else  
      line = $X('<path xmlns="http://www.w3.org/2000/svg" class="ourline"/>');
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
    // Seems to solve injection groups-line problem, but I guess it will caus problem when collapsing elements
    //if(group) {group.prepend(line);}
    //else 
    {svg.container.append(line);}
  } //  }}}
  // }}}
  // Initialize {{{
    adaptor = wf_adaptor;
  // }}}
} // }}}

// WfDescription: 
// Manages the description. Is is further able to add/remove elements from the controlflow description.
function WfDescription(wf_adaptor, wf_illustrator) { // Model {{{
  // public variables
  var elements = this.elements = {};
  // private variables
  var adaptor;
  var illustrator;
  var description;
  var id_counter = {};
  var update_illustrator = true; 

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
    var graph = parse(description.children('description').get(0), {'row':0,'col':0});
    illustrator.set_svg(graph);
  } // }}}
  var gd = this.get_description = function() { //  public {{{
    var serxml = $(description.get(0).documentElement).clone(true);
    serxml.removeAttr('svg-id');
    $('*[svg-id]',serxml).each(function(){
      $(this).removeAttr('svg-id');
    });
    return serxml.serializeXML();
  } // }}}
  this.get_node_by_svg_id = function(svg_id) { // {{{
    return $('[svg-id = \'' + svg_id + '\']', description);
  } // }}}
  this.get_free_id = function() { // {{{
    var existing = new Array();
    $('*[id]', description).each(function(){existing.push($(this).attr('id'))});
    var id = 1;
    while ($.inArray('a' + id,existing) != -1) {
      id += 1; 
    }
    return 'a' + id;
  } // }}}
  var update = this.update = function(svgid) { // {{{
    id_counter = {};
    if(update_illustrator){
      illustrator.clear();
      var graph = parse(description.children('description').get(0), {'row':0,'col':0});
      illustrator.set_svg(graph);
    }
    var newn = $('*[new=true]',description);
    newn.removeAttr('new');

    if (newn.attr('svg-id') != undefined)
      adaptor.notify(newn.attr('svg-id'));
    else if (svgid != undefined)
      adaptor.notify(svgid);
    else
      console.info('Something went horribly wrong');
  } // }}}
  // }}}
  // Adaption functions {{{
  this.insert_after = function(new_node, target) { // {{{
    var nn;
    if(typeof(new_node) == 'function') {nn = new_node(target);}
    else {nn = new_node;}
    target.after(nn);
    nn.attr('new','true');
    update();
  } // }}}
  this.insert_first_into = function(new_node, target, selector) { // {{{
    var nn;
    if(typeof(new_node) == 'function') {nn = new_node(target);}
    else {nn = new_node;}
    target.prepend(nn);
    nn.attr('new','true');
    update();
  } // }}}
  this.insert_last_into = function(new_node, target, selector) { // {{{
    var nn;
    if(typeof(new_node) == 'function') {nn = new_node(target);}
    else {nn = new_node;}
    target.append(nn);
    nn.attr('new','true');
    update();
  } // }}}
  this.remove = function(selector, target) {//{{{
    var svgid;
    if(selector == undefined) {
      svgid = target.attr('svg-id');
      target.remove()
    } else { 
      svgid = $(selector, target).attr('svg-id');
      $(selector, target).remove();
    }
    update(svgid);
  }
  // }}}
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

    var group = $X('<g class="group" xmlns="http://www.w3.org/2000/svg"/>');

    if(root_expansion == 'horizontal') pos.row++; 
    if(illustrator.elements[root.tagName].col_shift(root) == true && root_expansion != 'horizontal') pos.col++; 

    if(root.tagName == 'description') { // First parsing {{{
      pos.row++;
      max.row++;
      $(root).attr('svg-id','description');
      group.attr('element-id','group-description');
      illustrator.draw.draw_symbol('start', 'description', 'START', pos.row, pos.col, group);
    } // }}}

    $(root).children().each(function() { 
      var tname = this.tagName;

      // Set SVG-ID {{{
      if($(this).attr('id') == undefined) {
        if(id_counter[tname] == undefined) id_counter[tname] = -1;
        $(this).attr('svg-id', tname + '_' + (++id_counter[tname]));
        $(this).attr('svg-label', '');
      } else { 
        $(this).attr('svg-id',  $(this).attr('id'));
        if ($(this).children('parameters').length > 0) {
          $(this).attr('svg-label', $('label',$(this).children('parameters')).text());
        } else {  
          $(this).attr('svg-label', '');
        }  
      }  // }}}
      // Calculate next position {{{
      if($(this).attr('collapsed') == undefined || $(this).attr('collapsed') == 'false') { collapsed = false; }
      else { collapsed = true; }
      if(root_expansion == 'vertical')  pos.row++;
      if(root_expansion == 'horizontal')  pos.col++;
      if(illustrator.elements[tname] != undefined && illustrator.elements[tname].type == 'complex' && !collapsed) {
        if(illustrator.elements[tname] != undefined && !illustrator.elements[tname].svg()) pos.row--;
// TODO: Remaining problem is the order inside the svg. Thats why the connection is above the icon
        block = parse(this, jQuery.extend(true, {}, pos));
        group.append(block.svg);
        block.svg.attr('id', 'group-' + $(this).attr('svg-id')); 
        if(illustrator.elements[tname].endnodes == 'aggregate') endnodes = []; // resets endpoints e.g. potential preceding primitive 
      } else {
        if(illustrator.elements[tname] != undefined && illustrator.elements[tname].type == 'primitive'  && illustrator.elements[tname].svg()) { // This enables "invisble" elements, by returning false in the SVG function (e.g. constraints)
          block.max.row = pos.row;
          block.max.col = pos.col;
          block.endnodes = (!collapsed ? [pos] : [jQuery.extend(true, {}, pos)]);
          block.svg = group;
        }
      }
      // }}}
      // Draw symbol {{{
      var sym_name = '';
      if(!illustrator.elements[tname])                                         {sym_name = 'unknown';}
      else if(typeof illustrator.elements[tname].resolve_symbol == 'function') {sym_name = illustrator.elements[tname].resolve_symbol(this);}
      else if(typeof illustrator.elements[tname].resolve_symbol == 'string')   {sym_name = illustrator.elements[tname].resolve_symbol;}
      else                                                                            {sym_name = tname;}
      if((illustrator.elements[tname] && illustrator.elements[tname].svg()) || sym_name == 'unknown') { 
        illustrator.draw.draw_symbol(sym_name, $(this).attr('svg-id'), $(this).attr('svg-label'), pos.row, pos.col, block.svg).addClass(illustrator.elements[tname] ? illustrator.elements[tname].type : 'primitive unknown');
      } else { console.log("no icon "+ tname);}
      if(illustrator.elements[tname] && illustrator.elements[tname].border) illustrator.draw.draw_border($(this).attr('svg-id'), pos, block.max, block.svg);
      if(illustrator.elements[tname] && illustrator.elements[tname].type == 'complex') illustrator.draw.draw_tile($(this).attr('svg-id'), pos, block.max, block.svg);
      // }}}
      // Calculate Connection {{{
      if(illustrator.elements[tname] != undefined && illustrator.elements[tname].closeblock) { // Close Block if element e.g. loop 
        for(node in block.endnodes) illustrator.draw.draw_connection(group, block.endnodes[node], pos, block.max.row+1, block.endnodes.length, true);
      }
      if(illustrator.elements[tname] != undefined && illustrator.elements[tname].endnodes != 'this')  { 
        for(i in block.endnodes) endnodes.push(block.endnodes[i]); // collects all endpoints from different childs e.g. alternatives from choose 
      } else { endnodes = [jQuery.extend(true, {}, pos)]; } // sets this element as only endpoint (aggreagte)
      if(prev[0].row == 0 || prev[0].col == 0) { // this enforces the connection from description to the first element
        illustrator.draw.draw_connection(group, { row: 1, col: 1 }, pos, null, null, true);
      } else {
        if ($.inArray(tname,noarrow) == -1)
          for(node in prev) illustrator.draw.draw_connection(group, prev[node], pos, null, null, true);
        else  
          for(node in prev) illustrator.draw.draw_connection(group, prev[node], pos, null, null, false);
      }  
      // }}}
      // Prepare next iteration {{{
      if(root_expansion == 'vertical') { prev = jQuery.extend(true, {}, endnodes); pos.row = block.max.row;} // covers e.g. input's for alternative, parallel_branch, ... everything with horizontal expansion
      if(root_expansion == 'horizontal') pos.col = block.max.col;
      if(max.row < block.max.row) max.row = block.max.row;
      if(max.col < block.max.col) max.col = block.max.col;
      // }}}
    });

    if($(root).children().length == 0) { // empty complex found
      endnodes = [parent_pos];
      max.row = parent_pos.row;
      max.col = parent_pos.col;
    }
    if(illustrator.elements[root.tagName].endnodes == 'this' && illustrator.elements[root.tagName].closeblock == false) {endnodes = [prev];} // closeblock == false, allows loop to close himselfe
    return {'endnodes': endnodes, 'max':max, 'svg':group};
  } // }}}
  // }}}

  //  Initialze {{{
  adaptor = wf_adaptor;
  illustrator = wf_illustrator;
  // }}}
} // }}} 
