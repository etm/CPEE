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

var high;

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
  this.draw_labels = function(max,labels,dimensions,striped){ // public {{{
  } // }}}
  this.set_svg_container = function (container) { // {{{
    illustrator.set_svg_container(container); // TODO: shadowing the container element
  } // }}}
  this.set_label_container = function(container) { // {{{
    illustrator.set_label_container(container);
  } // }}}

  // initialize
  this.illustrator = illustrator = new WfIllustrator(this);
  this.description = description = new WfDescription(this, this.illustrator);

  this.update = function(doit){ doit(self); };

  $.getScript(theme_base, function() { //{{{
    manifestation = new WFAdaptorManifestation(self);
    illustrator.compact = manifestation.compact == true ? true : false;
    illustrator.rotated_labels = manifestation.rotated_labels == true ? true : false;
    illustrator.striped = manifestation.striped == true ? true : false;
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
        if (manifestation.elements[element].illustrator.svg && (typeof manifestation.elements[element].illustrator.svg === 'string' || manifestation.elements[element].illustrator.svg instanceof String)) {
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
        } else if (manifestation.elements[element].illustrator.svg && (typeof manifestation.elements[element].illustrator.svg === 'object' || manifestation.elements[element].illustrator.svg instanceof Object)) {
          if (manifestation.elements[element].illustrator.svg.start) {
            deferreds.push(
              $.ajax({
                type: "GET",
                dataType: "xml",
                url: manifestation.elements[element].illustrator.svg.start,
                context: element,
                success: function(res){
                  manifestation.elements[this].illustrator.svg.start = $(res.documentElement);
                }
              })
            );
          }
          if (manifestation.elements[element].illustrator.svg.middle) {
            deferreds.push(
              $.ajax({
                type: "GET",
                dataType: "xml",
                url: manifestation.elements[element].illustrator.svg.middle,
                context: element,
                success: function(res){
                  manifestation.elements[this].illustrator.svg.middle = $(res.documentElement);
                }
              })
            );
          }
          if (manifestation.elements[element].illustrator.svg.end) {
            deferreds.push(
              $.ajax({
                type: "GET",
                dataType: "xml",
                url: manifestation.elements[element].illustrator.svg.end,
                context: element,
                success: function(res){
                  manifestation.elements[this].illustrator.svg.end = $(res.documentElement);
                }
              })
            );
          }
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
  }); //}}}
} // }}}

// WfIllustrator:
// Is in charge of displaying the Graph. It is further able insert and remove elements with given ID's from the illustration.
function WfIllustrator(wf_adaptor) { // View  {{{
  // Variable {{{
    // public
    this.endclipshift = 17;
    this.height = 40;
    this.width = 40;
    this.default_width = 40;
    this.default_height = 40;
    this.height_shift = this.height * 0.26;
    this.width_shift = this.width * 0.39;
    this.width_shift_label = 7;
    this.elements = {}; // the svgs
    this.svg = {};
    this.draw = {};
    this.compact = true;
    this.rotated_labels = true;
    this.striped = true;
    // private
    var self = this;
    var adaptor = null;
  // }}}
  // Generic Functions {{{
  this.set_label_container = function(con) { // {{{
    self.svg.label_container = con;
  } // }}}
  this.set_svg_container = function(con) { // {{{
    self.svg.container = con;
    self.svg.container.append($X('<defs xmlns="http://www.w3.org/2000/svg">' +
      '  <marker id="arrow" viewBox="0 0 10 10" refX="33" refY="5" orient="auto" markerUnits="strokeWidth" markerWidth="4.5" makerHeight="4.5">' +
      '    <path d="m 2 2 l 6 3 l -6 3 z"/>' +
      '  </marker>' +
      '  <clipPath id="startclip">' +
      '    <rect x="-1" y="-1" width="29" height="32"/>' +
      '  </clipPath>' +
      '  <clipPath id="endclip">' +
      '    <rect x="20" y="-1" width="' + self.endclipshift + '" height="35"/>' +
      '  </clipPath>' +
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
    $('> defs > [belongs-to=element]', self.svg.container).each(function() {$(this).remove()});
  } // }}}
  this.set_svg_direct = function(svg) { // {{{
    self.svg.container.append(svg);
    let bb = svg[0].getBBox();
    self.svg.container.attr('height', bb.y + bb.height + self.height_shift); // small border on the bottom
    self.svg.container.attr('width',  bb.x + bb.width + self.width_shift);  // small border on the right
  } // }}}
  this.set_svg = function(graph) { // {{{
    self.svg.container.append(graph.svg);
    let bb = graph.svg[0].getBBox();
    self.svg.container.attr('height', bb.y + bb.height + self.height_shift); // small border on the bottom
    self.svg.container.attr('width',  bb.x + bb.width + self.width_shift);  // small border on the right
  } // }}}
  this.get_node_by_svg_id = function(svg_id) { // {{{
    return $('[element-id = \'' + svg_id + '\'] g.activities', self.svg.container);
  } // }}}
  this.get_label_by_svg_id = function(svg_id) { // {{{
    return $('[element-id = \'' + svg_id + '\']', self.svg.label_container);
  } // }}}
  this.get_elements = function() { // {{{
    return $('g.element', self.svg.container);
  } // }}}
  this.get_labels = function() { // {{{
    return $('[element-id]', self.svg.label_container);
  } // }}}
  // }}}
  // Helper Functions {{{
  var set_x = this.draw.set_x = function(dim,row,col,tdim) {
    if (!dim[row]) { dim[row] = []; }
    dim[row][col] = tdim;
  }
  var get_x = function(a,col,dim,boundary=0) { //{{{
    if (a<0) { a = 0 };

    let starta = [];
    for (let i=a; i <= dim.length; i++) {
      starta[i] = 0;
      for (let j=0; j < col; j++) {
        if (typeof dim[i] !== 'undefined' && typeof dim[i][j] !== 'undefined') {
          starta[i] += dim[i][j];
        } else {
          // go up the column and find the next valid value
          let x = i;
          let found = 'no';
          let lmax = 0;
          while (x > boundary && found != 'yes') {
            x -= 1;
            if (typeof dim[x] !== 'undefined' && typeof dim[x][j] !== 'undefined' && found == 'no') {
              if (lmax < dim[x][j]) {
                lmax = dim[x][j];
              }
              found = 'yes';
            }
          }
          if (found == 'yes') {
            starta[i] += lmax;
          } else {
            starta[i] += self.width;
          }
        }
      }
    }
    console.log(a,col,starta);

    return Math.max(...starta.filter(Number),self.width);
  } //}}}
  var get_x_width = function(dim,maxcol) { //{{{
    let cwidth = 0;
    for (let i=0; i < dim.length; i++) {
      let lwidth = 0;
      for (let j=0; j <= maxcol; j++) {
        if (typeof dim[i] !== 'undefined' && typeof dim[i][j] !== 'undefined') {
          lwidth += dim[i][j];
        } else {
          // go up the column and find the next valid value
          let x = i;
          let found = false;
          while (x > 0 && !found) {
            x -= 1;
            if (typeof dim[x] !== 'undefined' && typeof dim[x][j] !== 'undefined') {
              lwidth += dim[x][j];
              found = true;
            }
          }
          if (!found) {
            lwidth[i] += self.width;
          }
        }
      }
      if (cwidth < lwidth) { cwidth = lwidth; }
    }
    return cwidth;
  } //}}}

  var get_y = this.draw.get_y = function(row) { // {{{
    return { y: row * self.height - self.height, height_shift: self.height_shift};
  } // }}}

  var get_width = this.draw.get_width = function(g) { //{{{
    let t = g.clone();
    self.svg.container.append(t);
    let bb = t[0].getBBox();
    let w = bb.width - bb.x;
    t.remove();
    return w;
  } //}}}
  var get_height = this.draw.get_height = function(g) { //{{{
    let t = g.clone();
    self.svg.container.append(t);
    let bb = t[0].getBBox();
    let h = bb.height - bb.y;
    t.remove();
    return h;
  } //}}}
  var get_dim = this.draw.get_dim = function(g) { //{{{
    let element = g.clone();
    self.svg.container.append(element);
    let svg = element[0].ownerSVGElement;

    var r = element[0].getBBox();

    if (!svg) {
      element[0].remove();
      return { x: 0, y: 0, cx: 0, cy: 0, width: 0, height: 0 };
    }

    var p = svg.createSVGPoint();

    var matrix = svg.getScreenCTM().inverse().multiply(element[0].getScreenCTM());

    p.x = r.x;
    p.y = r.y;
    var a = p.matrixTransform(matrix);

    p.x = r.x + r.width;
    p.y = r.y;
    var b = p.matrixTransform(matrix);

    p.x = r.x + r.width;
    p.y = r.y + r.height;
    var c = p.matrixTransform(matrix);

    p.x = r.x;
    p.y = r.y + r.height;
    var d = p.matrixTransform(matrix);

    var minX = Math.min(a.x, b.x, c.x, d.x);
    var maxX = Math.max(a.x, b.x, c.x, d.x);
    var minY = Math.min(a.y, b.y, c.y, d.y);
    var maxY = Math.max(a.y, b.y, c.y, d.y);

    var width = maxX - minX;
    var height = maxY - minY;

    element.remove();

    return {
      x: minX,
      y: minY,
      width: width,
      height: height,
      cx: minX + width / 2,
      cy: minY + height / 2
    };
  } //}}}

  var bind_event = this.draw.bind_event = function(sym,tname,context) { //{{{
    for(event_name in adaptor.elements[tname]) {
      sym.bind(event_name, {'function_call':adaptor.elements[tname][event_name]}, function(e) { e.data.function_call($(this).attr('element-id'),e)});
      if(event_name == 'mousedown') sym.bind('contextmenu', false);
    }
  } //}}}

  var draw_stripe = this.draw.draw_stripe = function (row, maxcol, dim) { // {{{
    if (maxcol < 1) maxcol = 1;

    let cwidth = get_x_width(dim,maxcol);
    cwidth = cwidth + 2 * self.width - self.width_shift;

    var g = $X('<rect element-row="' + row + '" class="stripe ' + (row % 2 == 0 ? 'even' : 'odd') + '" x="0" y="' + String(row*self.height+self.height_shift/2) + '" width="' + cwidth + '" height="' + (self.height) + '" xmlns="http://www.w3.org/2000/svg"></rect>');
    self.svg.container.prepend(g);
    return g;
  } // }}}
  var draw_symbol = this.draw.draw_symbol = function(sname, id, title, parent_row, max_row, row, col, dim, group, addition) { // {{{
    if (!(row in dim)) { dim[row] = [] }
    if(self.elements[sname] == undefined || self.elements[sname].svg == undefined) sname = 'unknown';
    let center_x = (self.width - self.default_width) / 2;
    let center_y = (self.height - self.default_height) / 2;

    let sstart = get_x(parent_row,col,dim,parent_row);
    let stop = 0;

    sstart = sstart            + center_x - self.width_shift;
    stop   = row * self.height + center_y - (self.height-self.height_shift);

    if (addition) {
      var g = $X('<g class="element" element-row="' + (row-1) + '" element-type="' + sname + '" element-id="' + id  + '" xmlns="http://www.w3.org/2000/svg">' +
                    '<g transform="translate(' + String(sstart) + ',' + String(stop) + ')"></g>' +
                 '</g>');
    } else {
      var g = $X('<g class="element" element-row="' + (row-1) + '" element-type="' + sname + '" element-id="' + id  + '" xmlns="http://www.w3.org/2000/svg">' +
                    '<g transform="translate(' + String(sstart) + ',' + String(stop) + ')">' +
                      '<text class="super" transform="translate(' + (self.default_width-10) + ',8.4)">' +
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
    let lab = $('.label',sym);
    if (lab.length > 0 && self.compact) {
      let sta = $('.part-start',sym);
      let mid = $('.part-middle',sym);
      let end = $('.part-end',sym);
      let nor = $('.part-normal',sym);
      if (title && title != '') {
        lab.text(title);
        let width = this.get_width(lab);
        if (mid.length > 0) {
          if (end.length > 0) {
            let pos = get_dim(mid);
            mid.attr('clip-path','url(#ele-' + id + ')');
            let clip = $X('<clipPath belongs-to="element" id="ele-' + id + '" xmlns="http://www.w3.org/2000/svg">' +
              '<rect x="0" y="-1" width="' + width + '" height="' +  (pos.y + pos.height + 2) + '"></rect>' +
            '</clipPath>');
            $('defs',self.svg.container).append(clip);

            end.attr('transform','translate(' + (pos.x + width - self.endclipshift - 4) + ',0)');
            let tdim = pos.x + width - self.endclipshift - 4 + this.get_width(end) + self.width_shift_label;
            if (!dim[row][col] || dim[row][col] < tdim) { dim[row][col] = tdim; }
          } else {
            let tdim = 0;
            if (self.rotated_labels) {
              lab.addClass('rotate');
              tdim = self.width;
            } else {
              tdim = self.width + width + self.width_shift_label;
            }
            if (!dim[row][col] || dim[row][col] < tdim) { dim[row][col] = tdim; }
          }
        } else {
          let tdim = self.width;
          if (!dim[row][col] || dim[row][col] < tdim) { dim[row][col] = tdim; }
        }
        if (nor.length > 0) { nor.remove(); }
      } else {
        let tdim = self.width;
        if (!dim[row][col] || dim[row][col] < tdim) { dim[row][col] = tdim; }
        if (sta.length > 0) { sta.remove(); }
        if (mid.length > 0) { mid.remove(); }
        if (end.length > 0) { end.remove(); }
      }
    } else {
      $('.part-start',sym).remove();
      $('.part-middle',sym).remove();
      $('.part-end',sym).remove();
      let tdim = self.width;
      if (!dim[row][col] || dim[row][col] < tdim) { dim[row][col] = tdim; }
    }

    sym.attr('class','activities');
    $(g[0].childNodes[0]).append(sym);

    // Binding events for symbol
    bind_event(g,sname,true);

    if (group) {group.append(g);}
    else {self.svg.container.children('g:first').append(g);}

    return g;
  } // }}}
  var draw_border = this.draw.draw_border = function(id, p1, p2, group, dim) { // {{{
    let bstart = get_x(p1.row,p1.col,dim);
    group.prepend($X('<rect element-id="' + id + '" x="' + (bstart-0.50) + '" ' +
        'y="' + (p1.row-0.80)*self.height + '" ' +
        'width="' + ((p2.col+1.00)-p1.col)*self.width + '" ' +
        'height="' + ((p2.row+1.00)-p1.row)*self.height +'" ' +
        'class="block" rx="15" ry="15" xmlns="http://www.w3.org/2000/svg"/>'));
  } // }}}
  var draw_tile = this.draw.draw_tile = function(id, p1, p2, group, dim) { // {{{
    let bstart = get_x(p1.row,p1.col,dim);
    let bend = get_x(p1.row,p2.col,dim);
    group.prepend($X('<rect element-id="' + id + '" x="' + (bstart - 1.1 * self.width_shift) + '" ' +
        'y="' + ((p1.row-1)*self.height+self.height_shift/2) + '" ' +
        'width="' + (bend-bstart) + '" ' +
        'height="' + ((p2.row+1)-p1.row)*self.height +'" ' +
        'class="tile" rx="12" ry="12" xmlns="http://www.w3.org/2000/svg"/>'));
  } // }}}
  var draw_connection = this.draw.draw_connection = function(group, start, end, context_row, arrow, dim) { // {{{
    let sr = Math.min(start.row,end.row);
    let cstart = get_x(sr,start.col,dim,context_row);
    let cend = get_x(sr,end.col,dim,context_row);

    if(((end['row']-start['row']) == 0) && ((end['col']-start['col']) == 0)) return;
    var line;
    if (arrow)
      line = $X('<path xmlns="http://www.w3.org/2000/svg" class="ourline" marker-end="url(#arrow)"/>');
    else
      line = $X('<path xmlns="http://www.w3.org/2000/svg" class="ourline"/>');
    if (end['row']-start['row'] == 0 || end['col']-start['col'] == 0) { // straight line
      line.attr("d", "M " + String(cstart) + "," + String(start['row']*self.height-15) +" "+
                            String(cend) +   "," + String(end['row']*self.height-15)
      );
    } else if (end['row']-start['row'] > 0) { // downwards
      if (end['col']-start['col'] > 0) {// left - right
        if (self.compact) {
          line.attr("d", "M " + String(cstart) + "," + String(start['row']*self.height-15) +" "+
                                String(cstart+14) + "," + String((end['row']-1)*self.height) +" "+ // first turn of horizontal-line going away from node
                                String(cend) + "," + String((end['row']-1)*self.height) +" "+
                                String(cend) + "," + String(end['row']*self.height-15)
          );
        } else {
          line.attr("d", "M " + String(cstart) + "," + String(start['row']*self.height-15) +" "+
                                String(cend) + "," + String(start['row']*self.height-15) +" "+
                                String(cend) + "," + String(end['row']*self.height-15)
          );
        }
      } else { // right - left
        line.attr("d", "M " + String(cstart) + "," + String(start['row']*self.height-15) +" "+
                              String(cstart) + "," + String(end['row']*self.height-35) +" "+
                              String(cend+14) + "," + String(end['row']*self.height-35) +" "+ // last turn of horizontal-line going into the node
                              String(cend) + "," + String(end['row']*self.height-15)
        );
      }
    } else if(end['row']-start['row'] < 0) { // upwards
      cstart = cend + self.width;
      line.attr("d", "M " + String(cstart) + "," + String(start['row']*self.height-15) +" "+
                            String(cstart) + "," + String(start['row']*self.height+3) +" "+
                            String(cend+15) + "," + String(start['row']*self.height+3) +" "+
                            String(cend+15) + "," + String(end['row']*self.height+15)+" "+
                            String(cend) + "," + String(end['row']*self.height-15)
      );
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
  this.set_labels = function(graph,dim) {
    if (illustrator.striped == true && illustrator.compact == false) {
      for (var i=0; i < graph.max.row; i++) {
        illustrator.draw.draw_stripe(i,graph.max.col,dim);
      }
    }
    if (illustrator.compact == false) {
      adaptor.draw_labels(graph.max,labels,{ 'height': illustrator.height, 'height_shift': illustrator.height_shift },illustrator.striped == true ? true : false);
    } else {
      adaptor.draw_labels(graph.max,[],{ 'height': illustrator.height, 'height_shift': illustrator.height_shift },false);
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
    let dim = [];
    var graph = parse(description.children('description').get(0), {'row':0,'col':0,final:false,wide:false}, dim);
    illustrator.set_svg(graph);
    self.set_labels(graph,dim);
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
    let dim = [];
    var graph = parse(description.children('description').get(0), {'row':0,'col':0}, dim);
    illustrator.set_svg(graph);
    self.set_labels(graph,dim);
    doit(self);
  }
  var update = this.update = function(svgid) { // {{{
    id_counter = {};
    if(update_illustrator){
      labels = [];
      illustrator.clear();
      let dim = [];
      var graph = parse(description.children('description').get(0), {'row':0,'col':0}, dim);
      illustrator.set_svg(graph);
      self.set_labels(graph,dim);
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
  var parse = function(root, parent_pos, dim)  { // private {{{
    var pos = JSON.parse(JSON.stringify(parent_pos));
    var max = {'row': 0,'col': 0};
    var prev = [parent_pos]; // connects parent with child(s), depending on the expansion
    var endnodes = [];
    var sname = sym_name(root.tagName,root);
    var root_expansion = illustrator.elements[root.tagName].expansion(root);
    var block =  { 'max': {'row': pos.row, 'col': pos.col}, 'endnodes': [], 'svg': $X('<g class="group" xmlns="http://www.w3.org/2000/svg"/>') };

    if(root_expansion == 'horizontal') pos.row++;
    if(illustrator.elements[root.tagName].col_shift(root) == true && root_expansion != 'horizontal') pos.col++;

    if(root.tagName == 'description') { // First parsing {{{
      pos.row++;
      $(root).attr('svg-id','description');
      $(root).attr('svg-type','description');
      $(root).attr('svg-subtype','description');
      block.svg.attr('element-id','group-description');
      if (illustrator.elements[sname].label) {
        // javascript object spread syntax is my new weird crush - the JS designers must be serious people
        labels.push({...{row: pos.row, element_id: 'start', tname: 'start', label: illustrator.elements[sname].label(root)},...illustrator.draw.get_y(pos.row)});
      }
      illustrator.draw.draw_symbol(sname, 'description', 'START', pos.row, pos.row, pos.row, pos.col, dim, block.svg);
    } // }}}

    $(root).children().filter(function(){ return this.localName[0] != '_'; }).each(function() {
      var context = this;
      var tname = context.tagName;
      var sname = sym_name(tname,context);
      pos.final = illustrator.elements[sname].final ? true : false;
      pos.wide = illustrator.elements[sname].wide ? true : false;
      pos.noindent = illustrator.elements[sname].noindent ? true : false;

      // Calculate next position {{{
      if(root_expansion == 'vertical') { pos.row++; }
      if(root_expansion == 'horizontal')  {
        // for noindent themes do not indent the first column
        if (!pos.noindent || (pos.noindent && endnodes.length > 1)) {
          illustrator.draw.set_x(dim,pos.row,pos.col,illustrator.width);
          pos.col++;
        }
        if (!illustrator.compact) {
          if (block.max.row) {
            illustrator.draw.set_x(dim,pos.row,pos.col,illustrator.width);
            pos.row = block.max.row + 1;
          }
        }
      }

      if(illustrator.elements[tname] != undefined && illustrator.elements[tname].type == 'complex') {
        if(illustrator.elements[tname] != undefined && !illustrator.elements[tname].svg) pos.row--;
        // TODO: Remaining problem is the order inside the svg. Thats why the connection is above the icon

        illustrator.draw.set_x(dim,pos.row,pos.col,illustrator.width);
        // but fuuuuu, we calculate the gateways only later, so we couldnt even have them bigger for now

        // console.log('----> down', tname, parent_pos.row, pos.row, parent_pos.col, pos.col, dim);

        let tblock = parse(context, JSON.parse(JSON.stringify(pos)), dim);

        // merge block and tblock, enforce the max, as the second branch could have fewer nodes than the first
        block.max.row = Math.max(block.max.row,tblock.max.row);
        block.max.col = Math.max(block.max.col,tblock.max.col);
        block.endnodes = tblock.endnodes;

        // console.log('<---- up', tname, parent_pos.row, block.max.row, parent_pos.col, block.max.col, dim);

        block.svg.append(tblock.svg);
        block.svg.attr('id', 'group-' + $(context).attr('svg-id'));
        if(illustrator.elements[sname].endnodes == 'aggregate') endnodes = []; // resets endpoints e.g. potential preceding primitive
      } else {
        if(illustrator.elements[tname] != undefined && illustrator.elements[tname].type == 'primitive'  && illustrator.elements[tname].svg) { // This enables "invisble" elements, by returning undefined in the SVG function (e.g. constraints)
          block.max.row = pos.row;
          block.max.col = pos.col;
          block.endnodes = [pos];
        }
      }
      // }}}

      var g;
      set_details(tname,sname,pos,context);
      var origpos = JSON.parse(JSON.stringify(pos));
      [g, endnodes] = draw_position(tname,parent_pos,origpos,prev,block,dim,endnodes,context);

      // Prepare next iteration {{{
      if(root_expansion == 'vertical') { prev = JSON.parse(JSON.stringify(endnodes)); pos.row = block.max.row;} // covers e.g. input's for alternative, parallel_branch, ... everything with horizontal expansion
      if(root_expansion == 'horizontal') pos.col = block.max.col;
      if(max.row < block.max.row) max.row = block.max.row;
      if(max.col < block.max.col) max.col = block.max.col;
      // }}}

      if (illustrator.elements[sname].closing_symbol) {
        var ctname = illustrator.elements[sname].closing_symbol;
        var csname = sym_name(ctname,context);
        pos.row++;
        max.row++;
        block.max.row = pos.row;
        if (illustrator.elements[sname].endnodes == 'this') {
          pos.col++;
          if (pos.col > max.col) {
            max.col++;
            block.max.col = pos.col;
          }
          draw_position(ctname,parent_pos,pos,block.endnodes,block,dim,[],context,{svg: g, pos: origpos});
          pos.col--;
          set_details(ctname,csname,pos,context,true);
        } else {
          set_details(ctname,csname,pos,context,true);
          [undefined, endnodes] = draw_position(ctname,parent_pos,pos,prev,block,dim,[],context,{svg: g, pos: origpos});
        }
        prev = JSON.parse(JSON.stringify(endnodes));
      }
    });

    if($(root).children().filter(function(){ return this.attributes['svg-id'] != undefined; }).length == 0) { // empty complex found
      endnodes = [parent_pos];
      max.row = parent_pos.row;
      max.col = parent_pos.col;
    }

    if(root.tagName == 'description' && illustrator.elements[root.tagName].closing_symbol) {
      pos.row++;
      max.row = pos.row;
      draw_position(illustrator.elements['start'].closing_symbol,parent_pos,pos,prev,block,dim,[],this,{svg: block.svg, pos: pos});
    }

    return {'endnodes': endnodes, 'max':max, 'svg': block.svg};
  } // }}}
  var sym_name = function(tname,context) { //{{{
    var sname;
    if(!illustrator.elements[tname])                                         {sname = 'unknown';}
    else if(typeof illustrator.elements[tname].resolve_symbol == 'function') {sname = illustrator.elements[tname].resolve_symbol(context,illustrator.elements[tname].col_shift ? illustrator.elements[tname].col_shift(context) : undefined);}
    else if(typeof illustrator.elements[tname].resolve_symbol == 'string')   {sname = illustrator.elements[tname].resolve_symbol;}
    else                                                                     {sname = tname;}
    if (sname == null) {sname = tname;}
    return sname;
  } //}}}
  var set_details = function(tname,sname,pos,context,simple) { //{{{
    if (simple == undefined || simple == false) {
      if($(context).attr('id') == undefined) {
        if(id_counter[tname] == undefined) id_counter[tname] = -1;
        $(context).attr('svg-id', tname + '_' + (++id_counter[tname]));
      } else {
        $(context).attr('svg-id',  $(context).attr('id'));
      }
    }
    if (illustrator.elements[sname].label) {
      var lab = illustrator.elements[sname].label(context);
      if (lab && lab[0] && lab[0].value && lab[0].column == 'Label' && lab[0].value != '') {
        $(context).attr('svg-label', lab[0].value);
      }
      labels.push({...{row: pos.row, element_id: $(context).attr('svg-id'), tname: tname, label: lab},...illustrator.draw.get_y(pos.row)});
    }
  } //}}}
  var draw_position = function(tname,parent_pos,pos,prev,block,dim,endnodes,context,second) { // private {{{
    var sname = sym_name(tname,context);
    // console.log('----- pos ' + sname, parent_pos.row, block.max.row, parent_pos.col, block.max.col, block, dim);

    // Draw Symbol {{{
    if (second) {
      console.log('x');
      illustrator.draw.draw_symbol(sname, $(context).attr('svg-id'), $(context).attr('svg-label'), parent_pos.row, block.max.row, pos.row, pos.col, dim, second.svg, true).addClass(illustrator.elements[sname] ? illustrator.elements[sname].type : 'primitive unknown');
    } else {
      $(context).attr('svg-type',tname);
      $(context).attr('svg-subtype',sname);
      if((illustrator.elements[sname] && illustrator.elements[sname].svg) || sname == 'unknown') {
        var g = illustrator.draw.draw_symbol(sname, $(context).attr('svg-id'), $(context).attr('svg-label'), parent_pos.row, block.max.row, pos.row, pos.col, dim, block.svg).addClass(illustrator.elements[sname] ? illustrator.elements[sname].type : 'primitive unknown');

        if (illustrator.elements[sname].info) {
          var info = illustrator.elements[sname].info(context);
          _.each(info,function(val,key) {
            g.attr(key, val);
          });
        }
      } else { console.log("no icon "+ sname);}
      if (illustrator.elements[sname] && illustrator.elements[sname].border) {
        var wide = (illustrator.elements[sname].wide == true && block.max.col == pos.col) ? pos.col + 1 : block.max.col;
        if (illustrator.elements[sname].closing_symbol) {
          illustrator.draw.draw_border($(context).attr('svg-id'), pos, { col: wide, row: block.max.row + 1 }, block.svg, dim);
        } else {
          illustrator.draw.draw_border($(context).attr('svg-id'), pos, { col: wide, row: block.max.row }, block.svg, dim);
        }
      }
      if (illustrator.elements[sname] && illustrator.elements[sname].type == 'complex') {
        var wide = (illustrator.elements[sname].wide == true && block.max.col == pos.col) ? pos.col + 1 : block.max.col;
        if (illustrator.elements[sname].closing_symbol) {
          illustrator.draw.draw_tile($(context).attr('svg-id'), pos, { col: wide, row: block.max.row + 1 }, block.svg, dim);
        } else {
          illustrator.draw.draw_tile($(context).attr('svg-id'), pos, { col: wide, row: block.max.row }, block.svg, dim);
        }
      }
    }
    // }}}

    // Calculate Connection {{{
    let connection_case = 0;
    if(illustrator.elements[sname] != undefined && illustrator.elements[sname].closeblock == true) { // Close Block if element e.g. loop
      if (second) {
        if (second.pos.row+1 < pos.row) { // when no content, dont paint the up arrow
          connection_case = 1;
          console.log('++ case 1',prev[node].row,pos.row,dim);
          illustrator.draw.draw_connection(block.svg, pos, second.pos, 0, true, dim);
        }
      } else {
        for (let node=0; node < block.endnodes.length; node++) {
          if (block.endnodes[node] && !block.endnodes[node].final) {
            connection_case = 2;
            console.log('++ case 2',prev[node].row,pos.row,dim);
            illustrator.draw.draw_connection(block.svg, block.endnodes[node], pos, 0, true, dim);
          }
        }
      }
    }
    if(illustrator.elements[sname] != undefined && illustrator.elements[sname].endnodes != 'this') {
      for(i in block.endnodes) { endnodes.push(block.endnodes[i]); } // collects all endpoints from different childs e.g. alternatives from choose
    } else { endnodes = [JSON.parse(JSON.stringify(pos))]; } // sets this element as only endpoint (aggregate)
    if(prev[0].row == 0 || prev[0].col == 0) { // this enforces the connection from description to the first element
      connection_case = 3;
      illustrator.draw.draw_connection(block.svg, { row: 1, col: 1 }, pos, 0, true, dim);
    } else {
      if (illustrator.elements[sname].noarrow == undefined || illustrator.elements[sname].noarrow == false) {
        for (let node=0; node < prev.length; node++) {
          if (prev[node] && !prev[node].final) {
            if (prev[node].wide) {
              var pn = JSON.parse(JSON.stringify(prev[node]));
              if (pos.col > prev[node].col) {
                pn.col = pos.col;
              }
              connection_case = 4;
              console.log('++ case 4',prev[node].row,pos.row,dim);
              illustrator.draw.draw_connection(block.svg, pn, pos, 0, true, dim);
            } else {
              connection_case = 5;
              if (prev.length == 1) {
                console.log('++ case 5a',parent_pos.row, '---', prev[node].row,pos.row,dim);
                illustrator.draw.draw_connection(block.svg, prev[node], pos, 0, true, dim);
              } else {
                console.log('++ case 5b',prev[node].row,pos.row,dim);
                illustrator.draw.draw_connection(block.svg, prev[node], pos, 0, true, dim);
              }
            }
          }
        }
      } else {
        for (let node=0; node < prev.length; node++) {
          if (prev[node] && !prev[node].final) {
            connection_case = 6;
            console.log('++ case 6',prev[node].row,pos.row,dim);
            illustrator.draw.draw_connection(block.svg, prev[node], pos, prev[node].row, false, dim);
          }
        }
      }
    }
    // }}}

    illustrator.set_svg_direct(block.svg);
    debugger;

    return [g, endnodes];
  } // }}}
  //  }}}

  //  Initialze {{{
  adaptor = wf_adaptor;
  illustrator = wf_illustrator;
  // }}}
} // }}}
