/*
  This file is part of CPEE.

  CPEE is free software: you can redistribute it and/or modify it under the terms
  of the GNU Lesser General Public License as published by the Free Software Foundation,
  either version 3 of the License, or (at your option) any later version.

  CPEE is distributed in the hope that it will be useful, but WITHOUT ANY
  WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
  PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License along with
  CPEE (file LICENSE in the main directory).  If not, see
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
    this.properties = {};
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
  this.get_svg = function() { // {{{
    return illustrator.get_svg();
  } // }}}

  function loadTheme(doit) { //{{{
    manifestation = new WFAdaptorManifestation(self);
    illustrator.compact = manifestation.compact == true ? true : false;
    illustrator.rotated_labels = manifestation.rotated_labels == true ? true : false;
    illustrator.striped = manifestation.striped == true ? true : false;
    illustrator.lr = manifestation.lr == true ? true : false;
    illustrator.wellformed_pre_test = manifestation.wellformed_pre_test == true ? true : false;
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
          manifestation.elements[element].description.forEach(function(val,ind){
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
    })
  } //}}}

  // initialize
  this.illustrator = illustrator = new WfIllustrator(this);
  this.description = description = new WfDescription(this, this.illustrator);

  this.draw_element = function(type,id,label) {
    let pos = {'row': 1,'col': 0};
    let block = { 'max': {'row': pos.row, 'col': pos.col}, 'endnodes': [], 'svg': $X('<g class="group" xmlns="http://www.w3.org/2000/svg"/>') };
    illustrator.draw.draw_symbol(type, id, label, pos.row, pos.row, pos.row, pos.col, block.svg, false, {}, {})
    self.illustrator.set_svg(block);
  }

  this.redraw = function(doit){
    description.redraw(doit);
  }

  $.getScript(self.theme_base).done(function() {
    loadTheme(doit);
  }).fail(function(){
    // default theme
    self.theme_base = 'themes/preset/theme.js';
    self.theme_dir = self.theme_base.replace(/theme.js/,'');
    $.getScript(self.theme_base,function() {
      loadTheme(doit);
    });
  });
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
    this.group_extend = 1;
    this.structural_tighten = 3; // 'structural' borders are smaller in y
    this.elements = {}; // the svgs
    this.svg = {};
    this.draw = {};
    this.dim = {};
    this.dim.symbols = [];
    this.dim.connections = [];
    this.dim.rows = []; // lr only: start and size of each symbol along the rows
    this.compact = true;
    this.rotated_labels = true;
    this.striped = true;
    this.lr = false;
    this.wellformed_pre_test = false; // experimental: pre_test loops are drawn reversed
    this.inverted = false; // true while drawing inside such a loop, nested pre_test loops toggle it
    this.global_style = {};
    // private
    var self = this;
    var adaptor = null;
  // }}}
  // Internal Functions
  this.set_label_container = function(con) { // {{{
    self.svg.label_container = con;
  } // }}}
  this.set_svg_container = function(con) { // {{{
    self.svg.container = con;
    self.svg.container.append($X('<defs xmlns="http://www.w3.org/2000/svg">' +
      '  <marker id="arrow" viewBox="0 0 10 10" refX="28.5" refY="5" orient="auto" markerUnits="strokeWidth" markerWidth="14" markerHeight="3.5">' +
      '    <path d="m 2 2 l 6 3 l -6 3 z"/>' +
      '  </marker>' +
      '  <marker id="endarrow" viewBox="0 0 10 10" refX="7" refY="5" orient="auto" markerUnits="strokeWidth" markerWidth="14" markerHeight="5.2">' +
      '    <path d="M 2,2 L 6.21,4.11 Q 8,5 6.21,5.89 L 2,8 Z"/>' +
      '  </marker>' +
      '  <marker id="arrowrev" viewBox="0 0 10 10" refX="28.5" refY="5" orient="auto-start-reverse" markerUnits="strokeWidth" markerWidth="14" markerHeight="3.5">' +
      '    <path d="m 2 2 l 6 3 l -6 3 z"/>' +
      '  </marker>' +
      '  <marker id="endarrowrev" viewBox="0 0 10 10" refX="7" refY="5" orient="auto-start-reverse" markerUnits="strokeWidth" markerWidth="14" markerHeight="5.2">' +
      '    <path d="M 2,2 L 6.21,4.11 Q 8,5 6.21,5.89 L 2,8 Z"/>' +
      '  </marker>' +
      '  <marker id="arrowdiag" viewBox="0 0 10 10" refX="24.5" refY="5" orient="auto" markerUnits="strokeWidth" markerWidth="14" markerHeight="3.5">' +
      '    <path d="m 2 2 l 6 3 l -6 3 z"/>' +
      '  </marker>' +
      '  <marker id="arrowdiagrev" viewBox="0 0 10 10" refX="24.5" refY="5" orient="auto-start-reverse" markerUnits="strokeWidth" markerWidth="14" markerHeight="3.5">' +
      '    <path d="m 2 2 l 6 3 l -6 3 z"/>' +
      '  </marker>' +
      '  <clipPath id="startclip">' +
      '    <rect x="-4" y="-4" width="35" height="38"/>' +
      '  </clipPath>' +
      '  <clipPath id="endclip">' +
      '    <rect x="20" y="-1" width="' + self.endclipshift + '" height="35"/>' +
      '  </clipPath>' +
      '  <linearGradient id="custom-gradient" x2="0.35" y2="1">' +
      '    <stop offset="0%" stop-color="var(--wfadaptor-background)"/>' +
      '    <stop offset="50%" stop-color="var(--custom-color)"/>' +
      '    <stop offset="100%" stop-color="var(--custom-color)"/>' +
      '  </linearGradient>' +
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
  this.set_svg = function(graph) { // {{{
    self.svg.container.append(graph.svg);
    let bb = graph.svg[0].getBBox();

    let w = self.dim.get_x_max(0,graph.max.row,graph.max.col,'start');
    if (w == 0) { w = bb.x + bb.width + self.width_shift; }
    // the alternative is bb.x + bb.width + self.width_shift, but this is bad when clipped elements

    if (self.lr) { // mirror at the diagonal: rows go to the right, columns go down
      graph.svg.attr('transform',lr_matrix());
      self.svg.container.attr('height', w - lr_shift() + self.height_shift);
      self.svg.container.attr('width', bb.y + bb.height + self.height_shift + lr_shift());
    } else {
      self.svg.container.attr('height', bb.y + bb.height + self.height_shift); // small border on the bottom
      self.svg.container.attr('width', w);  // small border on the right
    }
    self.svg.container.attr('data-pos-matrix', JSON.stringify(self.dim.symbols));
    self.svg.container.attr('data-con-list', JSON.stringify(self.dim.connections));
  } // }}}
  this.get_svg = function() { // {{{
    // standalone copy for export: the rules of all stylesheets marked with
    // data-include-export are inlined into the style attributes (var()
    // resolved, in cascade order), further columns from the label container are
    // merged in, and interaction state and the render time are removed
    var svgs = [self.svg.container.get(0)];
    if (self.svg.label_container) {
      self.svg.label_container.children('svg').not(self.svg.container).each(function(_,ele) { svgs.push(ele); });
    }
    var clones = svgs.map(function(s) { return s.cloneNode(true); });

    var root = getComputedStyle(document.documentElement);
    var rules = [];
    var family = '';
    $.each(document.styleSheets, function(_,sheet) {
      if (!sheet.ownerNode || !sheet.ownerNode.hasAttribute('data-include-export')) { return; }
      $.each(sheet.cssRules, function(_,rule) {
        if (!rule.selectorText || rule.selectorText == ':root') { return; }
        if (rule.selectorText == 'svg') {
          if (rule.style.getPropertyValue('font-family') != '') {
            family = getComputedStyle(svgs[0]).getPropertyValue('font-family').replace(/["']/g,'').trim();
          }
          return;
        }
        var css = rule.style.cssText.replace(/var\((--[\w-]+)\)/g, function(m,v) { return root.getPropertyValue(v).trim() || m; });
        rule.selectorText.split(',').forEach(function(sel) {
          rules.push({ sel: sel.trim(), spec: specificity(sel), order: rules.length, css: css });
        });
      });
    });
    rules.sort(function(a,b) { return a.spec - b.spec || a.order - b.order; });
    family = family.replace(/-/,' ').split(' ').map(function(w) { return w[0].toUpperCase() + w.substr(1); }).join(' '); // adwaita-sans -> Adwaita Sans, the installed name

    clones.forEach(function(clone) {
      $(clone).find('.duration').remove();
      $(clone).find('.selected').removeClass('selected');
      $(clone).find('.hover').removeClass('hover');
      $(clone).find('*').each(function(_,el) {
        var decl = [];
        rules.forEach(function(r) {
          try { if (el.matches(r.sel)) { decl.push(r.css); } } catch (e) { } // e.g. unsupported pseudo classes
        });
        var own = el.getAttribute('style');
        if (own && own.trim() != '') { decl.push(own.trim().replace(/;?$/,';')); }
        if ($(el).is('text.super, g.hoverstyle, g.markstyle')) { decl.push('display: none;'); }
        if (el.nodeName == 'text' && family != '') { decl.push('font-family: \'' + family + '\';'); }
        if (decl.length > 0) { el.setAttribute('style', decl.join(' ')); }
      });
    });

    var svg = clones.shift();
    var width = parseInt(svg.getAttribute('width'));
    clones.forEach(function(clone) {
      var gr = $X('<g transform="translate(' + width + ')" xmlns="http://www.w3.org/2000/svg"></g>');
      gr.append($(clone).children());
      width += parseInt(clone.getAttribute('width'));
      $(svg).append(gr);
    });
    svg.setAttribute('width', width + 1);
    return svg;
  } // }}}
  var specificity = function(sel) { // {{{ ids, classes/attributes/pseudo classes, types
    var s = sel.replace(/::[\w-]+/g,'');
    var a = (s.match(/#[\w-]+/g) || []).length;
    var b = (s.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+/g) || []).length;
    var c = (s.replace(/\[[^\]]*\]/g,'').match(/(^|[\s>+~(])[a-zA-Z][\w-]*/g) || []).length;
    return a * 10000 + b * 100 + c;
  } // }}}
  this.set_duration = function(start) { //{{{
    self.svg.container.append(
      $X('<text class="duration" transform="translate(3,' + self.height_shift + ') rotate(90)" xmlns="http://www.w3.org/2000/svg">' +
         Math.trunc(performance.now()-start) + ' ms' +
         '</text>')
    );
  } //}}}

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

  // External Functions
  var clear = this.clear = function() { // {{{
    $('> :not(defs)', self.svg.container).each(function() {$(this).remove()});
    $('> defs > [belongs-to=element]', self.svg.container).each(function() {$(this).remove()});
    self.dim.symbols = [];
    self.dim.connections = [];
    self.dim.rows = [];
  } // }}}
  var get_symbol = this.get_symbol = function() { // {{{
  } // }}}
  var get_properties = this.get_properties = function() { // {{{
  } // }}}

  // Helper Functions {{{
  var debug_dim = this.dim.debug = function() { //{{{
    line = '\n';
    for (let i=1; i < self.dim.symbols.length; i++) {
      line += $.sprintf('%02d',i) + ': ';
      if (self.dim.symbols[i]) {
        for (let j=1; j < self.dim.symbols[i].length; j++) {
          line += ' [ ';
          if (self.dim.symbols[i] && self.dim.symbols[i][j] && self.dim.symbols[i][j].x) { line += $.sprintf('%3d',self.dim.symbols[i][j].x); } else { line += '   '; }
          line += ', ';
          if (self.dim.symbols[i] && self.dim.symbols[i][j] && self.dim.symbols[i][j].width) { line += $.sprintf('%3d',self.dim.symbols[i][j].width); } else { line += '   '; }
          line += ' ] ';
        }
      }
      line += "\n";
    }
    return line;
  } //}}}

  var set_x = this.dim.set_x = function(row,col,twidth,sname) { //{{{
    if (!self.dim.symbols[row]) { self.dim.symbols[row] = []; }
    if (!self.dim.symbols[row][col]) { self.dim.symbols[row][col] = {}; }

    if (self.dim.symbols[row-1] && self.dim.symbols[row-1][col] && self.dim.symbols[row-1][col].x) { // row before
      self.dim.symbols[row][col].x = self.dim.symbols[row-1][col].x;
    } else if (self.dim.symbols[row] && self.dim.symbols[row][col-1] && self.dim.symbols[row][col-1].x) { // column before
      let mx = 0;
      for (let i=row; i<self.dim.symbols.length; i++) {
        if (self.dim.symbols[i][col-1] && mx < self.dim.symbols[i][col-1].x + self.dim.symbols[i][col-1].width) {
          mx = self.dim.symbols[i][col-1].x + self.dim.symbols[i][col-1].width;
        }
      }
      self.dim.symbols[row][col].x = mx;
    } else if (self.dim.symbols[row-1] && self.dim.symbols[row-1][col-1] && self.dim.symbols[row-1][col-1].x) { // diagonal left above
      self.dim.symbols[row][col].x = self.dim.symbols[row-1][col-1].x + self.dim.symbols[row-1][col-1].width;
    } else if (self.dim.symbols.length > row + 1) { // same column below
      let mx = 0;
      for (let i=row; i<self.dim.symbols.length; i++) {
        if (self.dim.symbols[i] && self.dim.symbols[i][col] && mx < self.dim.symbols[i][col].x) {
          mx = self.dim.symbols[i][col].x;
        }
      }
      self.dim.symbols[row][col].x = mx;
    } else { // same column above
      let mx = 0;
      for (let i=row; i>0; i--) {
        if (self.dim.symbols[i] && self.dim.symbols[i][col] && mx < self.dim.symbols[i][col].x) {
          mx = self.dim.symbols[i][col].x;
        }
      }
      self.dim.symbols[row][col].x = mx;
    }
    if (self.dim.symbols[row][col].width) {
      if (twidth > self.dim.symbols[row][col].width) {
        self.dim.symbols[row][col].width = twidth;
      }
    } else {
      self.dim.symbols[row][col].width = twidth;
    }
    self.dim.symbols[row][col].type = sname;
    // console.log('set_x ',row,col,debug_dim());
  } //}}}
  var set_x_cond = this.dim.set_x_cond = function(row,col,tx,twidth,sname,label,subtype,sty,eid) { //{{{
    if (self.lr) { // labels widen the row, not the column
      set_row(row,col,[]);
      self.dim.rows[row][col].size = Math.max(self.dim.rows[row][col].size || 0, twidth);
      twidth = self.width;
    }
    if (!self.dim.symbols[row]) { self.dim.symbols[row] = []; }
    if (!self.dim.symbols[row][col] || self.dim.symbols[row][col].width < twidth) {
      self.dim.symbols[row][col] = {};
      self.dim.symbols[row][col].x = tx;
      self.dim.symbols[row][col].width = twidth;
    }
    self.dim.symbols[row][col].type = sname;
    self.dim.symbols[row][col].label = label;
    self.dim.symbols[row][col].subtype = subtype;
    self.dim.symbols[row][col].eid = eid;
    for (const s in sty) {
      self.dim.symbols[row][col][s] = sty[s];
    }
    // console.log('set_x_cond',row,col,debug_dim());
  } //}}}

  var get_x = this.dim.get_x = function(row,col,deb='') { //{{{
    if (row<0) { row = 0 };

    let mlen = 0;
    if (self.dim.symbols[row] && self.dim.symbols[row][col] && self.dim.symbols[row][col].x) { // this column
      mlen = self.dim.symbols[row][col].x;
    } else if (self.dim.symbols[row] && !self.dim.symbols[row][col] && self.dim.symbols.length > row && self.dim.symbols[row+1] && self.dim.symbols[row+1][col] && self.dim.symbols[row+1][col].x ) { // row after
      mlen = self.dim.symbols[row+1][col].x;
    } else if (self.dim.symbols[row-1] && self.dim.symbols[row-1][col] && self.dim.symbols[row-1][col].x) { // row before
      mlen = self.dim.symbols[row-1][col].x;
    } else if (self.dim.symbols[row] && self.dim.symbols[row][col-1] && self.dim.symbols[row][col-1].x) { // column before
      for (let i=row; i<self.dim.symbols.length; i++) {
        if (self.dim.symbols[i][col-1] && mlen < self.dim.symbols[i][col-1].x + self.dim.symbols[i][col-1].width) {
          mlen = self.dim.symbols[i][col-1].x + self.dim.symbols[i][col-1].width;
        }
      }
    } else if (self.dim.symbols[row+1] && self.dim.symbols[row+1][col] && self.dim.symbols[row+1][col].x) { // directly below
      mlen = self.dim.symbols[row+1][col].x;
    } else if (self.dim.symbols[row-1] && self.dim.symbols[row-1][col-1] && self.dim.symbols[row-1][col-1].x) { // diagonal left above
      mlen = self.dim.symbols[row-1][col-1].x + self.dim.symbols[row-1][col-1].width;
    } else { // same column below
      for (let i=row; i<self.dim.symbols.length; i++) {
        if (self.dim.symbols[i] && self.dim.symbols[i][col] && mlen < self.dim.symbols[i][col].x + self.dim.symbols[i][col].width) {
          mlen = self.dim.symbols[i][col].x;
        }
      }
      // found nothing in the rows below
      if (mlen == 0) { // mostly for column 0
        mlen = self.width;
      }
    }
    // console.log(deb,row,col,'--> ' + mlen,debug_dim());
    return mlen;
  } //}}}
  var get_x_plus = this.dim.get_x_plus = function(rowf,rowt,col,deb='') { //{{{
    if (rowf<0) { rowf = 0 };

    mlen = 0;
    for (let i=rowf; i<=rowt; i++) {
      if (self.dim.symbols[i] && self.dim.symbols[i][col] && mlen < self.dim.symbols[i][col].x + self.dim.symbols[i][col].width) {
        mlen = self.dim.symbols[i][col].x + self.dim.symbols[i][col].width;
      }
    }
    // console.log(deb,rowf,rowt,col,'--> ' + mlen,debug_dim());
    return mlen;
  } //}}}
  var get_x_max = this.dim.get_x_max = function(rowf,rowt,colt,deb='') { //{{{
    if (rowf<0) { rowf = 0 };

    mlen = 0;
    for (let i=rowf; i<=rowt; i++) {
      for (let j=0; j<=colt; j++) {
        if (self.dim.symbols[i] && self.dim.symbols[i][j] && mlen < self.dim.symbols[i][j].x + self.dim.symbols[i][j].width) {
          mlen = self.dim.symbols[i][j].x + self.dim.symbols[i][j].width;
        }
      }
    }
    // console.log(deb,rowf,rowt,colt,'--> ' + mlen,debug_dim());
    return mlen;
  } //}}}
  var get_x_width = this.dim.get_x_width = function(maxcol) { //{{{
    let cwidth = 0;
    for (let i=0; i < self.dim.symbols.length; i++) {
      let lwidth = 0;
      for (let j=0; j <= maxcol; j++) {
        if (typeof self.dim.symbols[i] !== 'undefined' && typeof self.dim.symbols[i][j] !== 'undefined') {
          lwidth += self.dim.symbols[i][j].width;
        } else {
          // go up the column and find the next valid value
          let x = i;
          let found = false;
          while (x > 0 && !found) {
            x -= 1;
            if (typeof self.dim.symbols[x] !== 'undefined' && typeof self.dim.symbols[x][j] !== 'undefined') {
              lwidth += self.dim.symbols[x][j].width;
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
  var lr_shift = function() { // {{{
    // mirroring swaps the left (width - width_shift) and top (height_shift) margins, so shift them back
    return self.width - self.width_shift - self.height_shift;
  } // }}}
  var lr_matrix = function() { // {{{
    return 'matrix(0,1,1,0,' + lr_shift() + ',' + (self.height_shift - lr_shift()) + ')'; // top margin is twice the height_shift
  } // }}}
  var set_row = this.dim.set_row = function(row,col,prev) { // {{{
    // lr: a symbol starts where its predecessors end, so only things in the same block are aligned
    if (!self.lr) { return; }
    if (!self.dim.rows[row]) { self.dim.rows[row] = []; }
    if (self.dim.rows[row][col]) { return; }
    let mx = 0;
    prev.forEach((p) => {
      if (!p) { return; }
      if (p.row == 0 || p.col == 0) { p = { row: 1, col: 1 }; } // first element connects to description
      mx = Math.max(mx, get_row_end(p.row,p.col));
    });
    for (let i=1; i<row; i++) { // and after everything before in this and the following columns, e.g. blocks in vertical parallels share columns
      for (let j=col; self.dim.rows[i] && j<self.dim.rows[i].length; j++) {
        if (self.dim.rows[i][j]) { mx = Math.max(mx, get_row_end(i,j)); }
      }
    }
    self.dim.rows[row][col] = { start: mx };
  } // }}}
  var get_row = this.dim.get_row = function(row,col) { // {{{
    if (!self.lr) { return (row - 1) * self.height; }
    for (let j=col; j>=0; j--) { // e.g. wide connections point to empty columns
      if (self.dim.rows[row] && self.dim.rows[row][j]) { return self.dim.rows[row][j].start; }
    }
    return 0;
  } // }}}
  var get_row_end = this.dim.get_row_end = function(row,col) { // {{{
    if (!self.lr) { return row * self.height; }
    let size = self.dim.rows[row] && self.dim.rows[row][col] && self.dim.rows[row][col].size;
    return get_row(row,col) + (size || self.height);
  } // }}}
  var get_row_max = this.dim.get_row_max = function(rowf,rowt,colf,colt) { // {{{
    if (!self.lr) { return rowt * self.height; }
    let mx = 0;
    let last = false;
    for (let i=rowf; i<=rowt; i++) {
      for (let j=colf; j<=colt; j++) {
        if (self.dim.rows[i] && self.dim.rows[i][j]) {
          mx = Math.max(mx, get_row_end(i,j));
          if (i == rowt) { last = true; }
        }
      }
    }
    return last ? mx : mx + self.height; // closing symbols are drawn after the border
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

  var draw_stripe = this.draw.draw_stripe = function (row, maxcol) { // {{{
    if (maxcol < 1) maxcol = 1;

    let cwidth = get_x_width(maxcol);
    cwidth = cwidth + 2 * self.width - self.width_shift;

    var g = $X('<rect element-row="' + row + '" class="stripe ' + (row % 2 == 0 ? 'even' : 'odd') + '" x="0" y="' + String(row*self.height+self.height_shift/2) + '" width="' + cwidth + '" height="' + (self.height) + '" xmlns="http://www.w3.org/2000/svg"></rect>');
    self.svg.container.prepend(g);
    return g;
  } // }}}
  var draw_symbol = this.draw.draw_symbol = function(sname, id, title, parent_row, max_row, row, col, group, addition, info, style) { // {{{
    if(self.elements[sname] == undefined || self.elements[sname].svg == undefined) sname = 'unknown';
    let center_x = (self.width - self.default_width) / 2;
    let center_y = (self.height - self.default_height) / 2;

    let dstart = get_x(parent_row,col,'symbol ' + sname);

    let sstart = dstart           + center_x - self.width_shift;
    let stop   = get_row(row,col) + center_y + self.height_shift;

    var g = $X('<g class="element" element-row="' + (row-1) + '" element-type="' + sname + '" element-id="' + id  + '" xmlns="http://www.w3.org/2000/svg">' +
                  '<g transform="translate(' + String(sstart) + ',' + String(stop) + ')' + (self.lr ? ' matrix(0,1,1,0,0,0)' : '') + '"></g>' + // lr: mirror back, so that the symbol is upright
               '</g>');

    // add the element-endpoint and other stuff to each symbol (from theme info function)
    for (const key in info) {
      g.attr(key, info[key]);
    }

    var sym = self.svg.defs[sname].clone();
    var subtype = undefined;

    if (g.attr('element-endpoint')) {
      let tsym = self.get_symbol(g.attr('element-endpoint'));
      if (tsym) {
        let found = false;
        $('.part-end',sym).remove();
        if ($('.part-end',tsym).length > 0) {
          sym.prepend($('.part-end',tsym).clone());
          found = true;
        }
        if ($('.part-middle',tsym).length > 0) {
          $('.part-middle',sym).remove();
          sym.prepend($('.part-middle',tsym).clone());
          found = true;
        }
        if ($('.part-start',tsym).length > 0) {
          $('.part-start',sym).remove();
          sym.prepend($('.part-start',tsym).clone());
          found = true;
        }
        if ($('.part-normal',tsym).length > 0) {
          $('.part-normal',sym).remove();
          sym.prepend($('.part-normal',tsym).clone());
          found = true;
        }
        if (!found) {
          $('.part-normal',sym).remove();
          let ts = $X('<g class="part-normal" xmlns="http://www.w3.org/2000/svg"></g>');
              ts.append($(tsym.documentElement.children).clone());
          sym.prepend(ts);
        }
      }
      let tprop = self.get_properties(g.attr('element-endpoint'));
      if (tprop) {
        subtype = tprop.subtype;
      }
    }

    sym.attr('class','activities');
    let sty = { ...self.global_style, ...style };
    for (const s in sty) {
      $('.colorstyle', sym).each((_,ele) => {
        $(ele).css(s,sty[s]);
      });
    }

    var tit = $X('<title xmlns="http://www.w3.org/2000/svg"></title>');
        tit.text(title);
    sym.prepend(tit);
    let lab = $('.label',sym);
    if (lab.length > 0 && self.compact) {
      let l_maxlen = 40; // max label size
      let l_split  = 18; // desired split position
      let l_dev    = 10; // if one split line is bigger than l_split + l_dev, split was not successfull and we have to display a more truncated string
      let l_trunc  = 18; // trucation size

      let sta = $('.part-start',sym);
      let mid = $('.part-middle',sym);
      let end = $('.part-end',sym);
      let xtr = $('.part-extra',sym);
      let nor = $('.part-normal',sym);
      if (title && title != '') {
        if (title.length < l_split) {
          lab.text(title);
        } else {
          if (title.length > l_maxlen) { title = title.substr(0,l_maxlen) + '\u2026'; }
          if (title.includes(' ')) {
            let len = title.length;
            let pos = -2;
            let seps = []
            while (pos != -1) {
              pos = title.indexOf(' ',pos+1);
              if (pos > -1) seps.push(pos);
            }
            let closest = title.length;
            let it = 0;
            seps.forEach((ele) => {
              let min = Math.abs(title.length/2 - ele);
              if (min < closest) { closest = min; it = ele; }
            });
            let l1 = title.substr(0,it);
            let l2 = title.substr(it+1);
            if (l1.length > l_split+l_dev) {
              title = title.substr(0,l_trunc) + '\u2026';
              lab.text(title);
            } else {
              if (l2.length > l_split) { l2 = l2.substr(0,l_trunc) + '\u2026'; }
              let a1 = $X('<tspan x="0" dy="-8" xmlns="http://www.w3.org/2000/svg"></tspan>');
                  a1.text(l1);
              let a2 = $X('<tspan x="0" dy="12" xmlns="http://www.w3.org/2000/svg"></tspan>');
                  a2.text(l2);
              lab.append(a1);
              lab.append(a2);
            }
          } else {
            if (title.length > l_split) { title = title.substr(0,l_trunc) + '\u2026'; }
            lab.text(title);
          }
        }
        let width = this.get_width(lab);
        if (mid.length > 0) {
          if (end.length > 0) {
            let pos = get_dim(mid);
            mid.attr('clip-path','url(#ele-' + id + ')');
            let clip = $X('<clipPath belongs-to="element" id="ele-' + id + '" xmlns="http://www.w3.org/2000/svg">' +
              '<rect x="0" y="-1" width="' + width + '" height="' +  (pos.y + pos.height + 4) + '"></rect>' +
            '</clipPath>');
            $('defs',self.svg.container).append(clip);

            end.attr('transform','translate(' + (pos.x + width - self.endclipshift - 4) + ',0)');
            if (xtr.length > 0) {
              xtr.attr('transform','translate(' + (pos.x + width - self.endclipshift - 4) + ',0)');
            }
            set_x_cond(row,col,dstart,pos.x + width - self.endclipshift - 4 + this.get_width(end) + 2 * self.width_shift_label,sname,title,subtype,sty,id);
          } else {
            let tdim = 0;
            if (self.rotated_labels && self.elements[sname].rotatelabels != false) {
              lab.addClass('rotate');
              tdim = self.width;
            } else {
              tdim = self.width + width + self.width_shift_label;
            }
            set_x_cond(row,col,dstart,tdim,sname,title,subtype,sty,id);
          }
        } else {
          set_x_cond(row,col,dstart,self.width,sname,title,subtype,sty,id);
        }
        if (nor.length > 0) { nor.remove(); }
      } else {
        set_x_cond(row,col,dstart,self.width,sname,title,subtype,sty,id);
        if (sta.length > 0) { sta.remove(); }
        if (mid.length > 0) { mid.remove(); }
        if (end.length > 0) { end.remove(); }
      }
    } else {
      $('.part-start',sym).remove();
      $('.part-middle',sym).remove();
      $('.part-end',sym).remove();
      set_x_cond(row,col,dstart,self.width,sname,title,subtype,sty,id);
    }


    $(g[0].childNodes[0]).append(sym);
    if (!addition) {
      // TODO change to better respresent exec
      $(g[0].childNodes[0]).append(
        $X('<text class="super" transform="translate(20,-2)" xmlns="http://www.w3.org/2000/svg">' +
            '<tspan class="exec">▶</tspan>' +
            '<tspan class="active">0</tspan>' +
            '<tspan class="colon">,</tspan>' +
            '<tspan class="vote">0</tspan>' +
          '</text>')
      );
    }

    // hover
    $(g[0].childNodes[0]).append(
      $X(
        '<g class="hoverstyle markstyle" xmlns="http://www.w3.org/2000/svg">' +
          '<circle cx="2" cy="0" r="7"/>' +
          '<path d="m -1 0 l 2 2 l 4 -4" class="standline"/>' +
        '</g>'
      )
    );

    // Binding events for symbol
    bind_event(g,sname,true);

    if (group) {group.append(g);}
    else {self.svg.container.children('g:first').append(g);}

    return g;
  } // }}}
  var draw_border = this.draw.draw_border = function(id, p1, p2, group, yshrink) { // {{{
    yshrink = yshrink || 0;
    let bstart = get_x(p1.row,p1.col,'border from');
    let bend = get_x_plus(p1.row,p2.row,p2.col,'border to');
    group.prepend($X('<rect element-id="' + id + '" x="' + (bstart - 1.1 * self.width_shift - self.group_extend) + '" ' +
        'y="' + (get_row(p1.row,p1.col)+self.height_shift/2-self.group_extend+yshrink) + '" ' +
        'width="' + (bend-bstart+2*self.group_extend) + '" ' +
        'height="' + (get_row_max(p1.row,p2.row,p1.col,p2.col)-get_row(p1.row,p1.col)+2*self.group_extend-2*yshrink) + '" ' +
        'class="block" rx="12" ry="12" xmlns="http://www.w3.org/2000/svg"/>'));
  } // }}}
  var draw_tile = this.draw.draw_tile = function(id, p1, p2, group, yshrink=0) { // {{{
    let bstart = get_x(p1.row,p1.col,'tile from');
    let bend = get_x_plus(p1.row,p2.row,p2.col,'tile to');
    group.prepend($X('<rect element-id="' + id + '" x="' + (bstart - 1.1 * self.width_shift - self.group_extend) + '" ' +
        'y="' + (get_row(p1.row,p1.col)+self.height_shift/2-self.group_extend+yshrink) + '" ' +
        'width="' + (bend-bstart+2*self.group_extend) + '" ' +
        'height="' + (get_row_max(p1.row,p2.row,p1.col,p2.col)-get_row(p1.row,p1.col)+2*self.group_extend-2*yshrink) + '" ' +
        'class="tile" rx="12" ry="12" xmlns="http://www.w3.org/2000/svg"/>'));
  } // }}}
  var draw_connection = this.draw.draw_connection = function(group, start, end, context_row, arrow) { // {{{
    let sr = Math.min(start.row,end.row);
    let cstart = get_x(sr,start.col,'conn from');
    let cend = get_x(sr,end.col,'conn to');
    self.dim.connections.push({from: {row: start.row, col: start.col}, to: {row: end.row, col: end.col}});

    if(((end['row']-start['row']) == 0) && ((end['col']-start['col']) == 0)) return;
    var line = $X('<path xmlns="http://www.w3.org/2000/svg" class="edge"/>');
    let diag = false; // the arrow sits on a diagonal segment (into a gateway), so it has to be closer to the center
    let sy = get_row(start['row'],start['col']) + self.height - 15 + start.yoffset; // center of the symbols
    let ey = get_row(end['row'],end['col']) + self.height - 15 + end.yoffset;
    if (end['row']-start['row'] == 0 || end['col']-start['col'] == 0) { // straight line
      line.attr("d", "M " + String(cstart) + "," + String(sy) +" "+
                            String(cend) +   "," + String(ey)
      );
    } else if (end['row']-start['row'] > 0) { // downwards
      if (end['col']-start['col'] > 0) {// left - right
        if (self.compact) {
          diag = self.inverted;
          line.attr("d", "M " + String(cstart) + "," + String(sy) +" "+
                                String(cstart+14) + "," + String(get_row_end(start['row'],start['col'])) +" "+ // first turn of horizontal-line going away from node
                                String(cend) + "," + String(get_row_end(start['row'],start['col'])) +" "+
                                String(cend) + "," + String(ey)
          );
        } else {
          line.attr("d", "M " + String(cstart) + "," + String(sy) +" "+
                                String(cend) + "," + String(sy) +" "+
                                String(cend) + "," + String(ey)
          );
        }
      } else { // right - left
        diag = !self.inverted;
        line.attr("d", "M " + String(cstart) + "," + String(sy) +" "+
                              String(cstart) + "," + String(get_row(end['row'],end['col'])+self.height-32) +" "+
                              String(cend+14) + "," + String(get_row(end['row'],end['col'])+self.height-32) +" "+ // last turn of horizontal-line going into the node
                              String(cend) + "," + String(ey)
        );
      }
    } else if(end['row']-start['row'] < 0) { // upwards
      diag = !self.inverted;
      let by = (self.lr ? get_row_end(start['row'],start['col']) : (self.dim.symbols.length-1)*self.height) + 4;
      line.attr("d", "M " + String(cstart) + "," + String(sy) +" "+
                            String(cstart) + "," + String(by) +" "+
                            String(cend+15) + "," + String(by) +" "+
                            String(cend+15) + "," + String(get_row(end['row'],end['col'])+self.height+15)+" "+
                            String(cend) + "," + String(ey)
      );
    }
    if (arrow) { line.attr(self.inverted ? 'marker-start' : 'marker-end', 'url(#' + (end.structural ? 'endarrow' : (diag ? 'arrowdiag' : 'arrow')) + (self.inverted ? 'rev' : '') + ')'); } // inverted: arrow points to the start
    if (self.lr) { line.attr('transform',lr_matrix()); } // connections are not part of the graph group
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
  var used_id_list = [];
  var description;
  var orig_description;
  var id_counter = {};
  var update_illustrator = true;
  var labels = [];

  // Set Labels //{{{
  this.set_labels = function(graph) {
    if (illustrator.striped == true && illustrator.compact == false) {
      for (var i=0; i < graph.max.row; i++) {
        illustrator.draw.draw_stripe(i,graph.max.col);
      }
    }
    adaptor.draw_labels(graph.max,labels,{ 'height': illustrator.height, 'stripe_height': illustrator.default_height, 'height_shift': illustrator.height_shift },illustrator.striped == true ? true : false);
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
    orig_description = $($X(description.serializeXML()).get(0).ownerDocument);
    id_counter = {};
    labels = [];
    let start = performance.now();
    illustrator.clear();
    var graph = parse(description.children('description').get(0), {'row':0,'col':0,final:false,wide:false,yoffset:0});
    illustrator.set_svg(graph);
    self.set_labels(graph);
    illustrator.set_duration(start);
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

  var reset_used_id_list = this.reset_used_id_list = function() { // {{{
    used_id_list = [];
  } // }}}
  var get_free_id = this.get_free_id = function(prefix,aname,other) { // {{{
    var existing = new Array();
    if (other) {
      if ($(other).attr(aname)) {
        existing.push($(other).attr(aname));
      }
      $(other).find("[" + aname + "]").each(function(k,v){
        existing.push($(v).attr(aname));
      });
    }
    $('*[' + aname + ']', description).each(function(){existing.push($(this).attr(aname))});
    var id = 1;
    while ($.inArray(prefix + id,existing) != -1) {
      id += 1;
    }
    while ($.inArray(prefix + id,used_id_list) != -1) {
      id += 1;
    }
    used_id_list.push(prefix + id);
    return prefix + id;
  } // }}}
  var redraw = this.redraw = function(doit) {
    id_counter = {};
    let start = performance.now();
    labels = [];
    illustrator.clear();
    clean_description();
    var graph = parse(description.children('description').get(0), {'row':0,'col':0,final:false,wide:false,yoffset:0});
    illustrator.set_svg(graph);
    self.set_labels(graph);
    illustrator.set_duration(start);
    if (doit) doit(self);
  }
  var update = this.update = function(svgid) { // {{{
    id_counter = {};
    var notify_target = () => {
      var newn = $('*[new=true]',description);
      newn.removeAttr('new');

      if (newn.attr('svg-id') != undefined)
        adaptor.notify(newn.attr('svg-id'));
      else if (svgid != undefined)
        adaptor.notify(svgid);
      else if (newn.parents('[svg-id]').length > 0)
        adaptor.notify(newn.parent('[svg-id]').attr('svg-id'));
      else
        console.info('Something went horribly wrong');
    };
    if (update_illustrator) {
      self.redraw(notify_target);
    } else {
      notify_target();
    }
  } // }}}
  // }}}
  // Adaption functions {{{
  this.insert_after = function(new_node, target, source_opts) { // {{{
    reset_used_id_list();
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
    reset_used_id_list();
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
    reset_used_id_list();
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
  var clean_description = function() { // private {{{
    $('*[svg-id]',description).each(function(){
      $(this).removeAttr('svg-id');
    });
    $('*[svg-type]',description).each(function(){
      $(this).removeAttr('svg-type');
    });
    $('*[svg-subtype]',description).each(function(){
      $(this).removeAttr('svg-subtype');
    });
    $('*[svg-label]',description).each(function(){
      $(this).removeAttr('svg-label');
    });
  } //}}}
  var reversed_loop = function(node) { // private {{{
    return illustrator.wellformed_pre_test && node.tagName == 'loop' && $(node).attr('mode') == 'pre_test';
  } // }}}
  var parse = function(root, parent_pos, first_prev)  { // private {{{
    var pos = JSON.parse(JSON.stringify(parent_pos));
    var max = {'row': 0,'col': 0};
    var prev = [first_prev || parent_pos]; // connects parent with child(s), depending on the expansion
    var endnodes = [];
    var markers = []; // wellformed_pre_test: branch markers, drawn in one row below all branches
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
      illustrator.global_style = (illustrator.elements[sname].style && root) ? illustrator.elements[sname].style(root) : {};
      illustrator.draw.draw_symbol(sname, 'description', 'START', pos.row, pos.row, pos.row, pos.col, block.svg, false, {}, {})
    } // }}}

    var children = $(root).children().filter(function(){ return this.localName[0] != '_'; });
    if (illustrator.inverted && root_expansion != 'horizontal') { children = $(children.get().reverse()); } // wellformed_pre_test: everything inside is drawn in reverse order, but not the branches
    children.each(function() {
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
          illustrator.dim.set_x(pos.row,pos.col,illustrator.width,sname);
          pos.col++;
        }
        if (!illustrator.compact) {
          if (block.max.row) {
            illustrator.dim.set_x(pos.row,pos.col,illustrator.width,sname);
            pos.row = block.max.row + 1;
          }
        }
      }

      var bottom = false;
      if(illustrator.elements[tname] != undefined && illustrator.elements[tname].type == 'complex') {
        bottom = illustrator.inverted && root_expansion == 'horizontal'; // wellformed_pre_test: branch markers are drawn below their content
        if(illustrator.elements[tname] != undefined && !illustrator.elements[tname].svg) pos.row--;
        // TODO: Remaining problem is the order inside the svg. Thats why the connection is above the icon

        illustrator.dim.set_x(pos.row,pos.col,illustrator.width,sname);
        illustrator.dim.set_row(pos.row,pos.col,prev);
        if ((bottom ? !illustrator.lr : (illustrator.lr && illustrator.elements[tname].expansion(context) == 'vertical' && !illustrator.elements[tname].col_shift(context))) && illustrator.elements[sname].svg) { // lr: the content follows the label in the same column, bottom: the marker is drawn after the next branches, so measure the symbol before it is drawn
          let lab = (illustrator.elements[sname].label ? illustrator.elements[sname].label(context) : []) || [];
          let tit = lab.find((l) => l && l.column == 'Label' && l.value);
          illustrator.draw.draw_symbol(sname, 'measure', tit ? tit.value : undefined, pos.row, pos.row, pos.row, pos.col, $X('<g xmlns="http://www.w3.org/2000/svg"/>'), true, {}, {});
        }
        // but fuuuuu, we calculate the gateways only later, so we couldnt even have them bigger for now

        // console.log('----> down', tname, parent_pos.row, pos.row, parent_pos.col, pos.col, illustrator.dim.debug());

        if (reversed_loop(context)) { illustrator.inverted = !illustrator.inverted; }
        let tblock;
        if (bottom) { // content starts in the row of the marker and connects to the gateway
          let up = JSON.parse(JSON.stringify(pos));
          up.row--;
          tblock = parse(context, up, prev[0]);
        } else {
          tblock = parse(context, JSON.parse(JSON.stringify(pos)));
        }
        if (reversed_loop(context)) { illustrator.inverted = !illustrator.inverted; }

        // merge block and tblock, enforce the max, as the second branch could have fewer nodes than the first
        block.max.row = Math.max(block.max.row,tblock.max.row);
        block.max.col = Math.max(block.max.col,tblock.max.col);
        block.endnodes = tblock.endnodes;
        if (bottom) { // markers are drawn after all branches, see below
          markers.push({ tname: tname, sname: sname, context: context, prev: tblock.endnodes, col: pos.col, top: pos.row, maxcol: tblock.max.col });
        }

        // console.log('<---- up', tname, parent_pos.row, block.max.row, parent_pos.col, block.max.col, illustrator.dim.debug());

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
      if (!bottom) {
        set_details(tname,sname,pos,context);
        var origpos = JSON.parse(JSON.stringify(pos));
        [g, endnodes] = draw_position(tname,parent_pos,origpos,prev,block,endnodes,context);
      }

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
        if (reversed_loop(context)) { illustrator.inverted = !illustrator.inverted; } // the arrows to the closing symbol belong to the loop
        if (illustrator.elements[sname].endnodes == 'this') {
          pos.col++;
          if (pos.col > max.col) {
            max.col++;
            block.max.col = pos.col;
          }
          draw_position(ctname,parent_pos,pos,block.endnodes,block,[],context,{svg: g, pos: origpos});
          pos.col--;
          set_details(ctname,csname,pos,context,true);
        } else {
          set_details(ctname,csname,pos,context,true);
          [undefined, endnodes] = draw_position(ctname,parent_pos,pos,prev,block,[],context,{svg: g, pos: origpos});
        }
        if (reversed_loop(context)) { illustrator.inverted = !illustrator.inverted; }
        if (illustrator.elements[sname].border == 'structural') {
          // structural border: outgoing arrow starts at the group border instead of from the icon
          // small y offset.
          endnodes = endnodes.map(function(p) {
            var np = JSON.parse(JSON.stringify(p));
            np.yoffset = illustrator.height_shift/2 + illustrator.group_extend + 15 - illustrator.structural_tighten;
            return np;
          });
        }
        prev = JSON.parse(JSON.stringify(endnodes));
      }
    });

    if (markers.length > 0) {
      max.row++;
      block.max.row = max.row;
      let maxcol = block.max.col;
      if (illustrator.lr) { // all markers start at the same position, after the longest branch
        markers.forEach((m) => { illustrator.dim.set_row(max.row,m.col,m.prev); });
        let start = Math.max(...markers.map((m) => illustrator.dim.get_row(max.row,m.col)));
        markers.forEach((m) => { illustrator.dim.rows[max.row][m.col].start = start; });
      }
      markers.forEach((m) => {
        let mpos = { row: max.row, col: m.col, final: false, wide: false, yoffset: 0, top: m.top, marker: true }; // the tile starts at the top of the branch
        block.endnodes = [mpos]; // the marker is the end of its branch
        block.max.col = m.maxcol; // the tile only covers its own branch
        set_details(m.tname,m.sname,mpos,m.context);
        draw_position(m.tname,parent_pos,mpos,m.prev,block,endnodes,m.context);
      });
      block.max.col = maxcol;
    }

    if($(root).children().filter(function(){ return this.attributes['svg-id'] != undefined; }).length == 0) { // empty complex found
      endnodes = [prev[0]]; // parent_pos, or for markers below their content the gateway
      max.row = parent_pos.row;
      max.col = parent_pos.col;
    }

    if(root.tagName == 'description' && illustrator.elements[root.tagName].closing_symbol) {
      pos.row++;
      max.row = pos.row;
      draw_position(illustrator.elements['start'].closing_symbol,parent_pos,pos,prev,block,[],root,{svg: block.svg, pos: pos});
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
      if (lab) {
        for (let i=0; i<lab.length; i++) {
          if (lab[i] && lab[i].value && lab[i].column == 'Label' && lab[i].value != '') {
            $(context).attr('svg-label', lab[0].value);
            if (illustrator.compact) {
              lab.splice(i,1);
            }
          }
        }
        labels.push({...{row: pos.row, element_id: $(context).attr('svg-id'), tname: tname, label: lab},...illustrator.draw.get_y(pos.row)});
      }
    }
  } //}}}
  var draw_position = function(tname,parent_pos,pos,prev,block,endnodes,context,second) { // private {{{
    var sname = sym_name(tname,context);
    // console.log('----- pos ' + sname, parent_pos.row, block.max.row, parent_pos.col, block.max.col, block, illustrator.dim.debug());

    // Draw Symbol {{{
    illustrator.dim.set_row(pos.row,pos.col,prev);
    let style = {};
    if (illustrator.elements[sname].style && context) {
      style = illustrator.elements[sname].style(context);
    }
    if (second) {
      // wide is only for the special case of variable parallel, only event_end has it, all others should reference the first row
      illustrator.draw.draw_symbol(sname, $(context).attr('svg-id'), $(context).attr('svg-label'), illustrator.elements[sname].wide == true ?  parent_pos.row+1 : parent_pos.row, block.max.row, pos.row, pos.col, second.svg, true, {}, style).addClass(illustrator.elements[sname] ? illustrator.elements[sname].type : 'primitive unknown');
    } else {
      $(context).attr('svg-type',tname);
      $(context).attr('svg-subtype',sname);
      if((illustrator.elements[sname] && illustrator.elements[sname].svg) || sname == 'unknown') {
        let info = {};
        if (illustrator.elements[sname].info && context) {
          info = illustrator.elements[sname].info(context);
        }
        var g = illustrator.draw.draw_symbol(sname, $(context).attr('svg-id'), $(context).attr('svg-label'), parent_pos.row, block.max.row, pos.row, pos.col, block.svg, false, info, style).addClass(illustrator.elements[sname] ? illustrator.elements[sname].type : 'primitive unknown');
      } else { console.log("no icon "+ sname);}
      if (illustrator.elements[sname] && illustrator.elements[sname].border) {
        let wide = (illustrator.elements[sname].wide == true && block.max.col == pos.col) ? pos.col + 1 : block.max.col;
        let yshrink = illustrator.elements[sname].border == 'structural' ? illustrator.structural_tighten : 0;
        if (illustrator.elements[sname].closing_symbol) {
          illustrator.draw.draw_border($(context).attr('svg-id'), pos, { col: wide, row: block.max.row + 1 }, block.svg, yshrink);
        } else {
          illustrator.draw.draw_border($(context).attr('svg-id'), pos, { col: wide, row: block.max.row }, block.svg, yshrink);
        }
      }
      if (illustrator.elements[sname] && illustrator.elements[sname].type == 'complex') {
        let wide = (illustrator.elements[sname].wide == true && block.max.col == pos.col) ? pos.col + 1 : block.max.col;
        let yshrink = illustrator.elements[sname].border == 'structural' ? illustrator.structural_tighten : 0;
        if (illustrator.elements[sname].closing_symbol) {
          illustrator.draw.draw_tile($(context).attr('svg-id'), pos, { col: wide, row: block.max.row + 1 }, block.svg, yshrink);
        } else {
          illustrator.draw.draw_tile($(context).attr('svg-id'), pos.top ? { row: pos.top, col: pos.col } : pos, { col: wide, row: block.max.row }, block.svg, yshrink); // top: marker below its content
        }
      }
    }
    // }}}

    // Calculate Connection {{{
    let connection_case = 0;
    var conn_target = pos;
    if (illustrator.elements[sname].border == 'structural' && !second) {
      // structural border: incoming arrow stops at the group border instead of reaching into the icon
      // (only a pixel-level yoffset, row/col stay integers so get_x() column lookups stay correct)
      conn_target = JSON.parse(JSON.stringify(pos));
      conn_target.yoffset = -illustrator.height + illustrator.height_shift/2 - illustrator.group_extend + 15 + illustrator.structural_tighten;
      conn_target.structural = true;
    }
    if(illustrator.elements[sname] != undefined && illustrator.elements[sname].closeblock == true) { // Close Block if element e.g. loop
      if (second) {
        if (second.pos.row+1 < pos.row) { // when no content, dont paint the up arrow
          connection_case = 1;
          // console.log('++ case 1',prev[node].row,pos.row,illustrator.dim.debug());
          illustrator.draw.draw_connection(block.svg, pos, second.pos, 0, true);
        }
      } else {
        for (let node=0; node < block.endnodes.length; node++) {
          if (block.endnodes[node] && !block.endnodes[node].final) {
            connection_case = 2;
            // console.log('++ case 2',prev[node].row,pos.row,illustrator.dim.debug());
            illustrator.draw.draw_connection(block.svg, block.endnodes[node], pos, 0, true);
          }
        }
      }
    }
    if(illustrator.elements[sname] != undefined && illustrator.elements[sname].endnodes != 'this') {
      for(i in block.endnodes) { endnodes.push(block.endnodes[i]); } // collects all endpoints from different childs e.g. alternatives from choose
    } else { endnodes = [JSON.parse(JSON.stringify(pos))]; } // sets this element as only endpoint (aggregate)
    if(prev[0].row == 0 || prev[0].col == 0) { // this enforces the connection from description to the first element
      connection_case = 3;
      illustrator.draw.draw_connection(block.svg, { row: 1, col: 1, yoffset: 0 }, conn_target, 0, true);
    } else {
      if (illustrator.elements[sname].noarrow == undefined || illustrator.elements[sname].noarrow == false || illustrator.inverted) { // inverted: the arrow points from the marker to the content
        for (let node=0; node < prev.length; node++) {
          if (prev[node] && !(illustrator.inverted ? pos.final : prev[node].final)) { // inverted: nothing goes out of a final element, which is drawn as the target
            if (prev[node].wide) {
              var pn = JSON.parse(JSON.stringify(prev[node]));
              if (pos.col > prev[node].col) {
                pn.col = pos.col;
              }
              connection_case = 4;
              // console.log('++ case 4',prev[node].row,pos.row,illustrator.dim.debug());
              illustrator.draw.draw_connection(block.svg, pn, conn_target, 0, true);
            } else {
              connection_case = 5;
              if (prev.length == 1) {
                // console.log('++ case 5a',parent_pos.row, '---', prev[node].row,pos.row,illustrator.dim.debug());
                illustrator.draw.draw_connection(block.svg, prev[node], conn_target, 0, !prev[node].marker);
              } else {
                // console.log('++ case 5b',prev[node].row,pos.row,illustrator.dim.debug());
                illustrator.draw.draw_connection(block.svg, prev[node], conn_target, 0, !prev[node].marker); // no arrow into markers drawn below their content
              }
            }
          }
        }
      } else {
        for (let node=0; node < prev.length; node++) {
          if (prev[node] && !prev[node].final) {
            connection_case = 6;
            // console.log('++ case 6',prev[node].row,pos.row,illustrator.dim.debug());
            illustrator.draw.draw_connection(block.svg, prev[node], conn_target, prev[node].row, false);
          }
        }
      }
    }
    // }}}

    ///////// show graph step by step
    // illustrator.set_svg(block);
    // debugger;

    return [g, endnodes];
  } // }}}
  //  }}}

  //  Initialze {{{
  adaptor = wf_adaptor;
  illustrator = wf_illustrator;
  // }}}
} // }}}
