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
// 1) drawing functions
// 2) creation of svg-container (Bug: arrows on lines)
// 3) after-function to insert using namespace of description

// WfAdaptor:
// Handles interaction between Illustartor and Description
// e.g. Event fires to Adaptor to insert Element and Illustrator and Description do it
function WfAdaptor(theme_base,doit) { // Controller {{{

 // public variables {{{
    this.illustrator;
    this.description;
    this.elements = {};
    this.theme_base = theme_base;
    this.theme_dir = theme_base.replace(/theme.js/,'');
  // }}}

  // private variables {{{
    var illustrator;
    var description;
    var self = this;
  // }}}

  // helper funtions
  this.set_description = function(desc,auto_update) { // public {{{
    this.description.set_description(desc,auto_update);
  } // }}}

  this.get_description = function() { // public {{{
    return description.get_description();
  } // }}}
  this.notify = function() { // public {{{
  } // }}}
  this.draw_labels = function(max,labels){ // public {{{
  } // }}}
  this.set_svg_container = function (container) { // {{{
    illustrator.set_svg_container(container); // TODO: shadowing the container element
  } // }}}
  this.set_css_container = function(container) { // {{{
    illustrator.set_css_container(container);
  } // }}}

  // initialize
  this.illustrator = illustrator = new WfIllustrator(this);
  this.description = description = new WfDescription(this, this.illustrator);

  this.update = function(doit){ doit(self); };

  $.getScript(theme_base, function() {
    manifestation = new WFAdaptorManifestation(self);
    illustrator.compact = manifestation.compact == true ? true : false;
    description.source = manifestation.source;
    var deferreds = [];
    // copy parent stuff
    for(element in manifestation.elements) {
      if (manifestation.elements[element].parent) {
        if (!manifestation.elements[element].description) {
          manifestation.elements[element].description = manifestation.elements[manifestation.elements[element].parent].description;
        }
        if (!manifestation.elements[element].adaptor) {
          manifestation.elements[element].adaptor = manifestation.elements[manifestation.elements[element].parent].adaptor;
        }
        var ill = manifestation.elements[manifestation.elements[element].parent].illustrator;
        for (var key in ill) {
          if (manifestation.elements[element].illustrator[key] == undefined) {
            manifestation.elements[element].illustrator[key] = ill[key];
          }
        }
        if (manifestation.elements[element].type == undefined) {
          manifestation.elements[element].type = manifestation.elements[manifestation.elements[element].parent].type;
        }
      }
    }
    // doit
    for(element in manifestation.resources) {
      deferreds.push(
        $.ajax({
          type: "GET",
          dataType: "xml",
          url: manifestation.resources[element],
          context: element,
          success: function(res){
            manifestation.resources[this] = $(res.documentElement);
          }
        })
      );
    }
    for(element in manifestation.elements) {
      if (manifestation.elements[element].illustrator) {
        if (manifestation.elements[element].illustrator.svg) {
          deferreds.push(
            $.ajax({
              type: "GET",
              dataType: "xml",
              url: manifestation.elements[element].illustrator.svg,
              context: element,
              success: function(res){
                manifestation.elements[this].illustrator.svg = $(res.documentElement);
              }
            })
          );
        }
        illustrator.elements[element] = manifestation.elements[element].illustrator;
        illustrator.elements[element].type = manifestation.elements[element].type || 'abstract';
      }
      if (manifestation.elements[element].description) {
        if ( typeof manifestation.elements[element].description === 'string' ) {
          manifestation.elements[element].description = [ manifestation.elements[element].description ];
        }
        if ($.isArray(manifestation.elements[element].description)) {
          _.each(manifestation.elements[element].description,function(val,ind){
            deferreds.push(
              $.ajax({
                type: "GET",
                dataType: "xml",
                url: val,
                context: element,
                success: function(res){
                  manifestation.elements[this].description = $(res.documentElement);
                  description.elements[this] = manifestation.elements[this].description;
                }
              })
            );
          });
        }
      }
      if (manifestation.elements[element].adaptor) {
        self.elements[element] = manifestation.elements[element].adaptor;
      }
    }
    $.when.apply($, deferreds).then(function(x) {
      doit(self);
    });
  });
} // }}}

// WfIllustrator:
// Is in charge of displaying the Graph. It is further able insert and remove elements with given ID's from the illsutration.
function WfIllustrator(wf_adaptor) { // View  {{{
  // Variable {{{
    // public
    this.height = 40;
    this.width = 40;
    this.shift = this.height * 0.26;
    this.elements = {}; // the svgs
    this.svg = {};
    this.draw = {};
    this.compact = true;
    // private
    var self = this;
    var adaptor = null;
  // }}}
  // Generic Functions {{{
  this.set_css_container = function(con) { // {{{
    self.svg.css = con;
  } // }}}
  this.set_svg_container = function(con) { // {{{
    self.svg.container = con;
    self.svg.container.append($X('<defs xmlns="http://www.w3.org/2000/svg">' +
      '  <marker id="arrow" viewBox="0 0 10 10" refX="33" refY="5" orient="auto" markerUnits="strokeWidth" markerWidth="4.5" makerHeight="4.5">' +
      '    <path d="m 2 2 l 6 3 l -6 3 z"/>' +
      '  </marker>' +
      '</defs>'));
    self.svg.defs = {};
    self.svg.defs['unknown'] = $X('<g xmlns="http://www.w3.org/2000/svg" class="unknown">' +
        '<circle cx="15" cy="15" r="14" class="unkown"/>' +
        '<text transform="translate(15,20)" class="normal">?</text>' +
      '</g>');
    for(element in self.elements)
      if(self.elements[element].svg) {
        var sym = $X('<g xmlns="http://www.w3.org/2000/svg"/>').append(self.elements[element].svg.clone().children()); // append all children to symbol
        $.each(self.elements[element].svg.attr('class').split(/\s+/), function(index, item) { sym.addClass(item); }); // copy all classes from the root node
        self.svg.defs[element] = sym;
      }
  } // }}}
  var clear = this.clear = function() { // {{{
    $('> :not(defs)', self.svg.container).each(function() {$(this).remove()});
  } // }}}
  this.set_svg = function(graph) { // {{{
    if(graph.max.row < 1) graph.max.row = 1;
    if(graph.max.col < 1) graph.max.col = 1;
    self.svg.container.attr('height',   (graph.max.row) * self.height + self.shift);
    self.svg.container.attr('width',    (graph.max.col+0.55) * self.width );
    self.svg.container.append(graph.svg);
  } // }}}
  this.get_node_by_svg_id = function(svg_id) { // {{{
    return $('[element-id = \'' + svg_id + '\'] g.activities', self.svg.container);
  } // }}}
  this.get_elements = function() { // {{{
    return $('g.element', self.svg.container);
  } // }}}
  // }}}
  // Helper Functions {{{
  var draw_label = this.draw.draw_label = function (tname, id, label, row, col, group) { // {{{
    var g = $X('<text class="label" transform="translate(' + String((col*self.width)-((self.width*0.39))) + ',' + String(row*self.height+20-((self.height*0.74))) + ')" xmlns="http://www.w3.org/2000/svg"></text>');
    var spli = $(label.split(/\n/));
    spli.each(function(k,v) {
      var tspan = $X('<tspan x="0" dy="' + (spli.length > 1 ? '-7' : '0') + '" xmlns="http://www.w3.org/2000/svg"></tspan>');
      if (k == 0) {
        tspan.text((label != '' ? '◤ ' : '')  + v);
      } else {
        tspan.text(v);
        tspan.attr('dy','15');
        tspan.attr('dx','15');
      }
      g.append(tspan);
    });
    bind_event(g,tname);
    if(group) { group.find('g.element[element-id=' + id + ']').append(g); }
    else {self.svg.container.children('g:first').append(g);}
    return g;
  } // }}}
  var draw_symbol = this.draw.draw_symbol = function (sname, id, title, row, col, group, addition) { // {{{
    if(self.elements[sname] == undefined || self.elements[sname].svg == undefined) sname = 'unknown';
    if (addition) {
      var g = $X('<g class="element" element-type="' + sname + '" element-id="' + id  + '" xmlns="http://www.w3.org/2000/svg">' +
                    '<g transform="translate(' + String((col*self.width)-((self.width*0.39))) + ',' + String(row*self.height-((self.height*0.74))) + ')"></g>' +
                 '</g>');
    } else {
      var g = $X('<g class="element" element-type="' + sname + '" element-id="' + id  + '" xmlns="http://www.w3.org/2000/svg">' +
                    '<g transform="translate(' + String((col*self.width)-((self.width*0.39))) + ',' + String(row*self.height-((self.height*0.74))) + ')">' +
                      '<text class="super" transform="translate(30,8.4)">' +
                        '<tspan class="active">0</tspan>' +
                        '<tspan class="colon">,</tspan>' +
                        '<tspan class="vote">0</tspan>' +
                      '</text>' +
                    '</g>' +
                 '</g>');
    }
    var sym = self.svg.defs[sname].clone();
    var tit = $X('<title xmlns="http://www.w3.org/2000/svg"></title>');
        tit.text(title);
    sym.prepend(tit);
    sym.attr('class','activities');
    $(g[0].childNodes[0]).append(sym);

    // Binding events for symbol
    bind_event(sym,sname);

    if(group) {group.append(g);}
    else {self.svg.container.children('g:first').append(g);}
    return g;
  } // }}}
  var bind_event = this.draw.bind_event = function(sym,tname) { //{{{
    for(event_name in adaptor.elements[tname]) {
      sym.bind(event_name, {'function_call':adaptor.elements[tname][event_name]}, function(e) { e.data.function_call($(this).parents('.element:first').attr('element-id'),e)});
      if(event_name == 'mousedown') sym.bind('contextmenu', false);
    }
  } //}}}
  var draw_border = this.draw.draw_border = function(id, p1, p2, group) { // {{{
    group.prepend($X('<rect element-id="' + id + '" x="' + (p1.col-0.50)*self.width + '" ' +
        'y="' + (p1.row-0.80)*self.height + '" ' +
        'width="' + ((p2.col+1.00)-p1.col)*self.width + '" ' +
        'height="' + ((p2.row+1.00)-p1.row)*self.height +'" ' +
        'class="block" rx="15" ry="15" xmlns="http://www.w3.org/2000/svg"/>'));
  } // }}}
  var draw_tile = this.draw.draw_tile = function(id, p1, p2, group) { // {{{
    group.prepend($X('<rect element-id="' + id + '" x="' + (p1.col-0.50)*self.width + '" ' +
        'y="' + (p1.row-0.80)*self.height + '" ' +
        'width="' + ((p2.col+1.00)-p1.col)*self.width + '" ' +
        'height="' + ((p2.row+1.00)-p1.row)*self.height +'" ' +
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
      line.attr("d", "M " + String(start['col']*self.width) + "," + String(start['row']*self.height-15) +" "+
                                    String(end['col']*self.width) + "," + String(end['row']*self.height-15)
      );
    } else if (end['row']-start['row'] > 0) { // downwards
      if (end['col']-start['col'] > 0) {// left - right
        if (self.compact) {
          line.attr("d", "M " + String(start['col']*self.width) + "," + String(start['row']*self.height-15) +" "+
                                String(start['col']*self.width+14) + "," + String((end['row']-1)*self.height) +" "+ // first turn of hotizontal-line going away from node
                                String(end['col']*self.width) + "," + String((end['row']-1)*self.height) +" "+
                                String(end['col']*self.width) + "," + String(end['row']*self.height-15)
          );
        } else {
          line.attr("d", "M " + String(start['col']*self.width) + "," + String(start['row']*self.height-15) +" "+
                                String(end['col']*self.width) + "," + String(start['row']*self.height-15) +" "+
                                String(end['col']*self.width) + "," + String(end['row']*self.height-15)
          );
        }
      } else { // right - left
        line.attr("d", "M " + String(start['col']*self.width) + "," + String(start['row']*self.height-15) +" "+
                              String(start['col']*self.width) + "," + String(end['row']*self.height-35) +" "+
                              String(end['col']*self.width+14) + "," + String(end['row']*self.height-35) +" "+ // last turn of horizontal-line going into the node
                              String(end['col']*self.width) + "," + String(end['row']*self.height-15)
        );
      }
    } else if(end['row']-start['row'] < 0) { // upwards
      if(num_lines > 1) {// ??? no idea
        line.attr("d", "M " + String(start['col']*self.width) + "," + String(start['row']*self.height-15) +" "+
                              String(start['col']*self.width) + "," + String((max_line-1)*self.height+5) +" "+
                              String(end['col']*self.width+20) + "," + String((max_line-1)*self.height+5) +" "+
                              String(end['col']*self.width+20) + "," + String(end['row']*self.height+25)+" "+
                              String(end['col']*self.width) + "," + String(end['row']*self.height-15)
        );
      } else {
        line.attr("d", "M " + String(start['col']*self.width) + "," + String(start['row']*self.height-15) +" "+
                              String(end['col']*self.width+15) + "," + String(start['row']*self.height-15) +" "+
                              String(end['col']*self.width+15) + "," + String(end['row']*self.height+15)+" "+
                              String(end['col']*self.width) + "," + String(end['row']*self.height-15)
        );
      }
    }
    self.svg.container.append(line);
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
  this.elements = {}; // the rngs
  this.source = null;
  // private variables
  var self = this;
  var adaptor;
  var illustrator;
  var description;
  var id_counter = {};
  var update_illustrator = true;
  var labels = [];

  // Set Labels //{{{
  this.set_labels = function(graph) {
    if (illustrator.compact == false) {
      adaptor.draw_labels(graph.max,labels,illustrator.shift);
    }
    if (illustrator.compact == false) {
      if (labels.length > 0) {
        var csscol = 0;
        _.each(labels,function(a,key) {

          // illustrator.draw.draw_label(a.tname, a.element_id, a.label, a.row, graph.max.col + 1, graph.svg);
        });
        console.log(illustrator.svg.css);
      }
    }
  } //}}}

  // Generic Functions {{{
  this.set_description = function(desc, auto_update) { // public {{{
    if(auto_update != undefined) update_illustrator = auto_update;
    if(typeof desc == "string") {
      description = $($.parseXML(desc));
    } else if(desc instanceof jQuery) {
      description = desc;
    } else {
      alert("WfDescription: unknown description type:\nConstructor-Name: " + desc.constructor + " / TypeOf: " + (typeof desc));
      description = null;
    }
    id_counter = {};
    labels = [];
    illustrator.clear();
    var graph = parse(description.children('description').get(0), {'row':0,'col':0,final:false,wide:false});
    self.set_labels(graph);
    // set labels
    illustrator.set_svg(graph);
  } // }}}
  var gd = this.get_description = function() { //  public {{{
    var serxml = $(description.get(0).documentElement).clone(true);
    serxml.removeAttr('svg-id');
    serxml.removeAttr('svg-type');
    serxml.removeAttr('svg-subtype');
    serxml.removeAttr('svg-label');
    $('*[svg-id]',serxml).each(function(){
      $(this).removeAttr('svg-id');
    });
    $('*[svg-type]',serxml).each(function(){
      $(this).removeAttr('svg-type');
    });
    $('*[svg-subtype]',serxml).each(function(){
      $(this).removeAttr('svg-subtype');
    });
    $('*[svg-label]',serxml).each(function(){
      $(this).removeAttr('svg-label');
    });
    return serxml.serializeXML();
  } // }}}
  this.get_node_by_svg_id = function(svg_id) { // {{{
    return $('[svg-id = \'' + svg_id + '\']', description);
  } // }}}
  var context_eval = this.context_eval = function(what) { // {{{
    return eval(what);
  } // }}}
  var get_free_id = this.get_free_id = function(other) { // {{{
    var existing = new Array();
    if (other) {
      if ($(other).attr('id')) {
        existing.push($(other).attr('id'));
      }
      $(other).find("[id]").each(function(k,v){
        existing.push($(v).attr('id'));
      });
    }
    $('*[id]', description).each(function(){existing.push($(this).attr('id'))});
    var id = 1;
    while ($.inArray('a' + id,existing) != -1) {
      id += 1;
    }
    return 'a' + id;
  } // }}}
  var refresh = this.refresh = function(doit) {
    id_counter = {};
    labels = [];
    illustrator.clear();
    var graph = parse(description.children('description').get(0), {'row':0,'col':0});
    self.set_labels(graph);
    // set labels
    illustrator.set_svg(graph);
    doit(self);
  }
  var update = this.update = function(svgid) { // {{{
    id_counter = {};
    if(update_illustrator){
      labels = [];
      illustrator.clear();
      var graph = parse(description.children('description').get(0), {'row':0,'col':0});
      self.set_labels(graph);
      illustrator.set_svg(graph);
    }

    var newn = $('*[new=true]',description);
    newn.removeAttr('new');

    if (newn.attr('svg-id') != undefined)
      adaptor.notify(newn.attr('svg-id'));
    else if (svgid != undefined)
      adaptor.notify(svgid);
    else if (newn.parent('[svg-id]').length > 0)
      adaptor.notify(newn.parent('[svg-id]').attr('svg-id'));
    else
      console.info('Something went horribly wrong');
  } // }}}
  // }}}
  // Adaption functions {{{
  this.insert_after = function(new_node, target, source_opts) { // {{{
    if ($.isArray(new_node)) {
      $.each(new_node,function(k,v){
        var nn = self.source(v,source_opts);
        target.after(nn);
        nn.attr('new','true');
      });
    } else {
      var nn = self.source(new_node,source_opts);
      target.after(nn);
      nn.attr('new','true');
    }
    update();
  } // }}}
  this.insert_first_into = function(new_node, target, source_opts) { // {{{
    if ($.isArray(new_node)) {
      $.each(new_node,function(k,v){
        var nn = self.source(v,source_opts);
        target.prepend(nn);
        nn.attr('new','true');
      });
    } else {
      var nn = self.source(new_node,source_opts);
      target.prepend(nn);
      nn.attr('new','true');
    }
    update();
  } // }}}
  this.insert_last_into = function(new_node, target) { // {{{
    if ($.isArray(new_node)) {
      $.each(new_node,function(k,v){
        var nn = self.source(v);
        target.append(nn);
        nn.attr('new','true');
      });
    } else {
      var nn = self.source(new_node);
      target.append(nn);
      nn.attr('new','true');
    }
    update();
  } // }}}
  this.remove = function(selector, target) {//{{{
    var svgid;
    if(selector == undefined) {
      svgid = target.attr('svg-id');
      target.remove()
    } else {
      svgid = $(selector, target).attr('svg-id');
      if (!svgid) {
        svgid = target.attr('svg-id');
      }
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
    var sname = sym_name(root.tagName,root);
    var root_expansion = illustrator.elements[root.tagName].expansion(root);
    var block =  {'max':{}}; // e.g. {'max':{'row':0,'col':0}, 'endpoints':[]};

    var group = $X('<g class="group" xmlns="http://www.w3.org/2000/svg"/>');

    if(root_expansion == 'horizontal') pos.row++;
    if(illustrator.elements[root.tagName].col_shift(root) == true && root_expansion != 'horizontal') pos.col++;

    if(root.tagName == 'description') { // First parsing {{{
      pos.row++;
      $(root).attr('svg-id','description');
      group.attr('element-id','group-description');
      illustrator.draw.draw_symbol('start', 'description', 'START', pos.row, pos.col, group);
    } // }}}

    $(root).children().filter(function(){ return this.localName[0] != '_'; }).each(function() {
      var context = this;
      var tname = context.tagName;
      var sname = sym_name(tname,context);
      pos.final = illustrator.elements[sname].final ? true : false;
      pos.wide = illustrator.elements[sname].wide ? true : false;

      // Calculate next position {{{
      if(root_expansion == 'vertical')  pos.row++;
      if(root_expansion == 'horizontal')  {
        pos.col++;
        if (!illustrator.compact) {
          if (block.max.row) {
            pos.row = block.max.row + 1;
          }
        }
      }

      if(illustrator.elements[tname] != undefined && illustrator.elements[tname].type == 'complex') {
        if(illustrator.elements[tname] != undefined && !illustrator.elements[tname].svg) pos.row--;
        // TODO: Remaining problem is the order inside the svg. Thats why the connection is above the icon
        block = parse(context, jQuery.extend(true, {}, pos));
        group.append(block.svg);
        block.svg.attr('id', 'group-' + $(context).attr('svg-id'));
        if(illustrator.elements[sname].endnodes == 'aggregate') endnodes = []; // resets endpoints e.g. potential preceding primitive
      } else {
        if(illustrator.elements[tname] != undefined && illustrator.elements[tname].type == 'primitive'  && illustrator.elements[tname].svg) { // This enables "invisble" elements, by returning undefined in the SVG function (e.g. constraints)
          block.max.row = pos.row;
          block.max.col = pos.col;
          block.endnodes = [pos];
          block.svg = group;
        }
      }
      // }}}
      // Set SVG-ID and labels {{{
      if($(context).attr('id') == undefined) {
        if(id_counter[tname] == undefined) id_counter[tname] = -1;
        $(context).attr('svg-id', tname + '_' + (++id_counter[tname]));
      } else {
        $(context).attr('svg-id',  $(context).attr('id'));
      }
      if (illustrator.elements[sname].label) {
        var lab = illustrator.elements[sname].label(context);
        $(context).attr('svg-label', lab);
        labels.push({row: pos.row, element_id: $(context).attr('svg-id'), tname: tname, label: lab});
      } else {
        $(context).attr('svg-label', '');
      } // }}}

      var g;
      [g, endnodes] = draw_position(tname,pos,prev,block,group,endnodes,context);

      // Prepare next iteration {{{
      if(root_expansion == 'vertical') { prev = jQuery.extend(true, {}, endnodes); pos.row = block.max.row;} // covers e.g. input's for alternative, parallel_branch, ... everything with horizontal expansion
      if(root_expansion == 'horizontal') pos.col = block.max.col;
      if(max.row < block.max.row) max.row = block.max.row;
      if(max.col < block.max.col) max.col = block.max.col;
      // }}}

      if (illustrator.elements[sname].closing_symbol) {
        pos.row++;
        max.row++;
        block.max.row = pos.row;
        if (illustrator.elements[sname].endnodes == 'this') {
          pos.col++;
          if (pos.col > max.col) {
            max.col++;
            block.max.col = pos.col;
          }
          draw_position(illustrator.elements[sname].closing_symbol,pos,block.endnodes,block,group,[],context,g);
          pos.col--;
        } else {
          [undefined, endnodes] = draw_position(illustrator.elements[sname].closing_symbol,pos,prev,block,group,[],context,g);
        }
        prev = jQuery.extend(true, {}, endnodes);
      }
    });

    if($(root).children().filter(function(){ return this.attributes['svg-id'] != undefined; }).length == 0) { // empty complex found
      endnodes = [parent_pos];
      max.row = parent_pos.row;
      max.col = parent_pos.col;
    }

    if((illustrator.elements[root.tagName].endnodes == 'this' || illustrator.elements[sname].endnodes == 'this') && illustrator.elements[root.tagName].closeblock == false) {endnodes = prev;} // closeblock == false, allows loop to close himself

    if(root.tagName == 'description' && illustrator.elements[root.tagName].closing_symbol) {
      pos.row++;
      max.row = pos.row;
      draw_position(illustrator.elements['start'].closing_symbol,pos,prev,block,group,[],this,group);
    }

    return {'endnodes': endnodes, 'max':max, 'svg':group};
  } // }}}
  var sym_name = function(tname,context) { //{{{
    var sname;
    if(!illustrator.elements[tname])                                         {sname = 'unknown';}
    else if(typeof illustrator.elements[tname].resolve_symbol == 'function') {sname = illustrator.elements[tname].resolve_symbol(context,illustrator.elements[tname].col_shift ? illustrator.elements[tname].col_shift(context) : undefined);}
    else if(typeof illustrator.elements[tname].resolve_symbol == 'string')   {sname = illustrator.elements[tname].resolve_symbol;}
    else                                                                     {sname = tname;}
    return sname;
  } //}}}
  var draw_position = function(tname,pos,prev,block,group,endnodes,context,second) { // private {{{
    var sname = sym_name(tname,context);
    // Draw Symbol {{{
    if (second) {
      illustrator.draw.draw_symbol(sname, $(context).attr('svg-id'), $(context).attr('svg-label'), pos.row, pos.col, second, true).addClass(illustrator.elements[sname] ? illustrator.elements[sname].type : 'primitive unknown');
    } else {
      $(context).attr('svg-type',tname);
      $(context).attr('svg-subtype',sname);
      if((illustrator.elements[sname] && illustrator.elements[sname].svg) || sname == 'unknown') {
        var g = illustrator.draw.draw_symbol(sname, $(context).attr('svg-id'), $(context).attr('svg-label'), pos.row, pos.col, block.svg).addClass(illustrator.elements[sname] ? illustrator.elements[sname].type : 'primitive unknown');
        if (illustrator.elements[sname].info) {
          var info = illustrator.elements[sname].info(context);
          _.each(info,function(val,key) {
            g.attr(key, val);
          });
        }
      } else { console.log("no icon "+ sname);}
      if(illustrator.elements[sname] && illustrator.elements[sname].border) {
        var wide = (illustrator.elements[sname].wide == true && block.max.col == pos.col) ? pos.col + 1 : block.max.col;
        if (illustrator.elements[sname].closing_symbol) {
          illustrator.draw.draw_border($(context).attr('svg-id'), pos, { col: wide, row: (illustrator.elements[sname].closing_symbol ? block.max.row+1 : block.max.row) }, block.svg);
        } else {
          illustrator.draw.draw_border($(context).attr('svg-id'), pos, { col: wide, row: (illustrator.elements[sname].closing_symbol ? block.max.row+1 : block.max.row) }, block.svg);
        }
      }
      if(illustrator.elements[sname] && illustrator.elements[sname].type == 'complex') {
        var wide = (illustrator.elements[sname].wide == true && block.max.col == pos.col) ? pos.col + 1 : block.max.col;
        if (illustrator.elements[sname].closing_symbol) {
          illustrator.draw.draw_tile($(context).attr('svg-id'), pos, { col: wide, row: block.max.row + 1 }, block.svg);
        } else {
          illustrator.draw.draw_tile($(context).attr('svg-id'), pos, { col: wide, row: block.max.row }, block.svg);
        }
      }
    }
    // }}}
    // Calculate Connection {{{
    if(illustrator.elements[sname] != undefined && illustrator.elements[sname].closeblock) { // Close Block if element e.g. loop
      for(node in block.endnodes) {
        if (!block.endnodes[node].final) {
          illustrator.draw.draw_connection(group, block.endnodes[node], pos, block.max.row+1, block.endnodes.length, true);
        }
      }
    }
    if(illustrator.elements[sname] != undefined && illustrator.elements[sname].endnodes != 'this') {
      for(i in block.endnodes) { endnodes.push(block.endnodes[i]); } // collects all endpoints from different childs e.g. alternatives from choose
    } else { endnodes = [jQuery.extend(true, {}, pos)]; } // sets this element as only endpoint (aggregate)
    if(prev[0].row == 0 || prev[0].col == 0) { // this enforces the connection from description to the first element
      illustrator.draw.draw_connection(group, { row: 1, col: 1 }, pos, null, null, true);
    } else {
      if (illustrator.elements[sname].noarrow == undefined || illustrator.elements[sname].noarrow == false) {
        for (node in prev) {
          if (!prev[node].final) {
            if (prev[node].wide) {
              var pn = jQuery.extend(true, {}, prev[node]);
              if (pos.col > prev[node].col) {
                pn.col = pos.col;
              }
              illustrator.draw.draw_connection(group, pn, pos, null, null, true);
            } else {
              illustrator.draw.draw_connection(group, prev[node], pos, null, null, true);
            }
          }
        }
      } else {
        for(node in prev) {
          if (!prev[node].final)
            illustrator.draw.draw_connection(group, prev[node], pos, null, null, false);
        }
      }
    }
    // }}}
    return [g, endnodes];
  } // }}}
  //  }}}

  //  Initialze {{{
  adaptor = wf_adaptor;
  illustrator = wf_illustrator;
  // }}}
} // }}}
