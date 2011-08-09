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
    var svg = null;
  // }}}
  // Generic Functions {{{
  var set_container = function(con) { // {{{
    console.log('illustrator: set container');
    svg = $(con);
  } // }}}
  var clear = this.clear = function() { // {{{
    console.log('illustrator: clear');
    $('g > *', svg).each(function() {$(this).remove()});
    matrix = [];
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
  this.call = {};//{{{ 
  this.call.draw = function(node, pos) { 
    if($(node).children('parameters').children('service').length > 0) {  // $('> parameters > service', $(this)) is deprecated (see jQuery Selectors)
      draw_symbol('callinject', $(node).attr('svg-id'), pos.row, pos.col);
    } else if($(node).children('manipulate').length > 0) {
      draw_symbol('callmanipulate', $(node).attr('svg-id'), pos.row, pos.col);
    } else {
      draw_symbol('call', $(node).attr('svg-id'), pos.row, pos.col);
    }
  }
  this.call.type = 'primitive'; 
  // }}}
  this.manipulate = {}; // {{{
  this.manipulate.draw = function(node, _pos) {
    draw_symbol('manipulate', $(node).attr('svg-id'), pos.row, pos.col);
  }
  this.manipulate.type = 'primitive'; 
  // }}}
  this.choose = {}; // {{{
  this.choose.draw = function(node, pos) {
    draw_symbol('choose', $(node).attr('svg-id'), pos.row, pos.col);
  }
  this.choose.type = 'complex';
  this.choose.expansion = 'horizontal';
  this.choose.col_shift = true; 
  this.choose.closing = 'branches'; 
  // }}}
  this.loop = {}; // {{{
  this.loop.draw = function(node, pos) {
    draw_symbol('loop', $(node).attr('svg-id'), pos.row, pos.col);
  }
  this.loop.type = 'complex';
  this.loop.expansion = 'vertical';
  this.loop.col_shift = true; 
  this.loop.closing = 'root'; 
  // }}}
  this.otherwise = {}; // {{{
  this.otherwise.draw = function(node, pos) {
    draw_symbol('otherwise', $(node).attr('svg-id'), pos.row, pos.col);
  }
  this.otherwise.type = 'complex';
  this.otherwise.expansion = 'vertical'; 
  this.otherwise.col_shift = false; 
  this.otherwise.closing = 'none'; 
  // }}}
  this.alternative = {}; // {{{
  this.alternative.draw = function(node, pos) {
    draw_symbol('alternative', $(node).attr('svg-id'), pos.row, pos.col);
  }
  this.alternative.type = 'complex';
  this.alternative.expansion = 'vertical'; 
  this.alternative.col_shift = false; 
  this.alternative.closing = 'none'; 
  // }}}
  this.parallel = {}; // {{{
  this.parallel.draw = function(node, pos) {
    draw_symbol('parallel', $(node).attr('svg-id'), pos.row, pos.col);
  }
  this.parallel.type = 'complex';
  this.parallel.expansion = 'horizontal';
  this.parallel.col_shift = true; 
  this.parallel.closing = 'none'; 
  // }}}
  this.parallel_branch = {}; // {{{
  this.parallel_branch.draw = function(node, pos) {
    draw_symbol('parallel_branch', $(node).attr('svg-id'), pos.row, pos.col);
  }
  this.parallel_branch.type = 'complex';
  this.parallel_branch.expansion = 'vertical'; 
  this.parallel_branch.col_shift = false; 
  this.parallel_branch.closing = 'none'; 
  // }}}
  this.critical = {}; // {{{
  this.critical.draw = function(node, pos) {
    draw_symbol('critical', $(node).attr('svg-id'), pos.row, pos.col);
  }
  this.critical.type = 'complex';
  this.critical.expansion = 'vertical';
  this.critical.col_shift = true; 
  this.critical.closing = 'successor'; 
  // }}}
  this.end = {}; // {{{
  this.end.draw = function(node, pos) {
//    draw_symbol('end', $(node).attr('svg-id'), pos.row, pos.col);
  } 
  this.end.type = 'primitive'; // }}}
  // }}}
  this.description = {}; // {{{
  this.description.expansion = 'vertical';
  this.description.col_shift = true; 
  this.description.closing = 'end'; 
  // }}}
  // Helper Functions {{{
  var draw_symbol = function (sym_name, id, row, col) { // {{{
    var svgNS = "http://www.w3.org/2000/svg";
    var xlinkNS = "http://www.w3.org/1999/xlink";
    var g = document.createElementNS(svgNS, "g");
        g.setAttribute('transform', 'translate(' + String((col*width)-((width/2))) + ',' + String(row*height-((height/2))) + ')');

    var use = document.createElementNS(svgNS, "use");
    use.setAttributeNS(xlinkNS, "href", "#"+sym_name);

    var attrs = {};
    if (id) {
      g.setAttribute('id', 'node-' + id);

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
  } // }}}    
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
    var expansion = parse($(description), {'row':0,'col':0, 'max':{'row':0,'col':0}});
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
    var end_nodes = []; 
    var initial_shift = false;

    if(illustrator[root.tagName] != undefined && illustrator[root.tagName].col_shift == true) {pos.col++; initial_shift = true;}
    if(illustrator[root.tagName] != undefined && illustrator[root.tagName].expansion == 'horizontal') pos.row++;

    $(root).children().each(function() {
      // Set SVG-ID {{{
      if($(this).attr('id') == undefined) {
        if(id_counter[this.tagName] == undefined) id_counter[this.tagName] = -1;
         $(this).attr('svg-id',this.tagName + '_' + (++id_counter[this.tagName]));
      } else { $(this).attr('svg-id', $(this).attr('id'));} // }}}
      switch(this.tagName) {
        // special elements
        case 'description': 
          var block = parse(this, parent_pos);
console.log('Block: description');
console.log(block);
          illustrator.end.draw(block);
          return {'col':0,'row':0,'max':{'col':0,'row':0}};
        case 'group': // ???
          break;
        default:
        if(illustrator[root.tagName].expansion == 'vertical')  pos.row++;
        if(illustrator[root.tagName].expansion == 'horizontal' && !initial_shift)  pos.col++; // second condition avoid second shift after initial col_shift happend
        initial_shift = false;
          (illustrator[this.tagName].draw)(this, pos);
          // draw line from prev_pos to pos
      }
    
      if(illustrator[this.tagName].type == 'complex') { // complex elements
        var block = parse(this, pos);
console.log('Block: ' + this.tagName);
console.log(block);
        if(max.row < block.max.row) max.row = block.max.row;
        if(max.col < block.max.col) max.col = block.max.col;
        if(illustrator[root.tagName].expansion == 'vertical' && max.row > pos.row) pos.row = max.row;
        if(illustrator[root.tagName].expansion == 'horizontal' && max.col > pos.col) pos.col = max.col;
      } else { // primitive elements
      }
      
    });
    // if(illustrator[root.nodeName] != undefined && illustrator[root.nodeName].closing_connector == 'parent') ... draw line back to parent
    if(max.row < pos.row) max.row = pos.row;
    if(max.col < pos.col) max.col = pos.col;
/*
    switch(illustrator[root.tagName].closing) { // {{{
      case 'none':
      case 'root':
      case 'successor':
    } // }}}
*/
    return {'end_nodes': end_nodes, 'max':max};
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
