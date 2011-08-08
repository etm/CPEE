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
    var matrix = []; // rows and cols
    var svg = null;
    var max_height = 0;
    var max_width = 0;
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
  this.endnode = function() { // public {{{
    matrix.push([{'id': 'end-node', 'type': 'end','pid':'top-level'}]);
    return {'row':matrix.length-1, 'col':0};
  } // }}}
  this.call = function(id, pid, ppos, index) { // public {{{
    return handle_call_types(id, pid, ppos, index, 'call');
  } // }}}
  this.callmanipulate = function(id, pid, ppos, index) { // public {{{
    return handle_call_types(id, pid, ppos, index, 'callmanipulate');
  } // }}}
  this.callinject = function(id, pid, ppos, index) { // public {{{
    return handle_call_types(id, pid, ppos, index, 'callinject');
  } // }}}
  this.manipulate = function(id, pid, ppos, index) { // public {{{
    if(index == undefined && ppos == undefined) { // append on top-level
      matrix.push([{'id': id, 'type': 'manipulate', 'pid':pid}]);
      return {'row':matrix.length-1, 'col':0};
    } else if(index == undefined) { // append on sub-level
      return append_sublevel({'id': id, 'type': 'manipulate', 'pid':pid}, ppos);
    } else if(ppos == undefined) { // insert at top-level
    } else {
    }
  } // }}}
  this.choose = function(id, pid, ppos, index) { // public {{{
    if(index == undefined && ppos == undefined) { // append on top-level
      matrix.push([{'id': id, 'type': 'choose', 'pid':pid, 'left_skip':1, 'expansion': 'horizontal'}]);
      return {'row':matrix.length-1, 'col':0};
    } else if(index == undefined) { // append on sub-level
      return append_sublevel({'id': id, 'type': 'choose', 'pid':pid, 'ppos':ppos, 'left_skip':1, 'expansion': 'horizontal'});
    } else if(ppos == undefined) { // insert at top-level
    } else {
    }
  } // }}}
  this.alternative = function(id, pid, ppos, index) { // public {{{
    if(index == undefined && ppos == undefined) { // append on top-level
      matrix.push([{'id': id, 'type': 'alternative', 'pid':pid, 'left_skip': 0, 'expansion': 'vertical'}]);
      return {'row':matrix.length-1, 'col':0};
    } else if(index == undefined) { // append on sub-level
      return append_sublevel({'id': id, 'type': 'alternative', 'pid':pid, 'ppos':ppos, 'left_skip':0, 'expansion': 'vertical'});
    } else if(ppos == undefined) { // insert at top-level
    } else {
    }
  } // }}}
  this.otherwise = function(id, pid, ppos, index) { // public {{{
    if(index == undefined && ppos == undefined) { // append on top-level
      matrix.push([{'id': id, 'type': 'otherwise', 'pid':pid, 'left_skip':1, 'expansion': 'vertical'}]);
      return {'row':matrix.length-1, 'col':0};
    } else if(index == undefined) { // append on sub-level
      return append_sublevel({'id': id, 'type': 'otherwise', 'pid':pid, 'ppos':ppos, 'left_skip':1, 'expansion': 'vertical'});
    } else if(ppos == undefined) { // insert at top-level
    } else {
    }
  } // }}}
  this.loop = function(id, pid, ppos, index) { // public {{{
    if(index == undefined && ppos == undefined) { // append on top-level
      matrix.push([{'id': id, 'type': 'loop', 'pid':pid, 'left_skip':1, 'expansion': 'vertical'}]);
      return {'row':matrix.length-1, 'col':0};
    } else if(index == undefined) { // append on sub-level
      return append_sublevel({'id': id, 'type': 'loop', 'pid':pid, 'ppos':ppos, 'left_skip':1, 'expansion': 'vertical'});
    } else if(ppos == undefined) { // insert at top-level
    } else {
    }
  } // }}}
  this.parallel = function(id, pid, ppos, index) { // public {{{
    if(index == undefined && ppos == undefined) { // append on top-level
      matrix.push([{'id': id, 'type': 'parallel', 'pid':pid, 'left_skip':1, 'expansion': 'horizontal'}]);
      return {'row':matrix.length-1, 'col':0};
    } else if(index == undefined) { // append on sub-level
      return append_sublevel({'id': id, 'type': 'parallel', 'pid':pid, 'ppos':ppos, 'left_skip':1, 'expansion': 'horizontal'});
    } else if(ppos == undefined) { // insert at top-level
    } else {
    }
  } // }}}
  this.parallel_branch = function(id, pid, ppos, index) { // public {{{
    if(index == undefined && ppos == undefined) { // append on top-level
      matrix.push([{'id': id, 'type': 'loop', 'pid':pid, 'left_skip':0, 'expansion': 'vertical'}]);
      return {'row':matrix.length-1, 'col':0};
    } else if(index == undefined) { // append on sub-level
      return append_sublevel({'id': id, 'type': 'loop', 'pid':pid, 'ppos':ppos, 'left_skip':0, 'expansion': 'vertical'});
    } else if(ppos == undefined) { // insert at top-level
    } else {
    }
  } // }}}
  this.critical = function(id, pid, ppos, index) { // public {{{
    if(index == undefined && ppos == undefined) { // append on top-level
      matrix.push([{'id': id, 'type': 'critical', 'pid':pid, 'left_skip':1, 'expansion': 'vertical'}]);
      return {'row':matrix.length-1, 'col':0};
    } else if(index == undefined) { // append on sub-level
      return append_sublevel({'id': id, 'type': 'critical', 'pid':pid, 'ppos':ppos, 'left_skip':1, 'expansion': 'vertical'});
    } else if(ppos == undefined) { // insert at top-level
    } else {
    }
  } // }}}
  this.draw_connection = function(start_id, end_id) { // private {{{
  } // }}}
  var repaint = this.repaint = function() { // public {{{
    console.log('Illsutrator: repaint start');
    console.log(matrix);
    $('g > *', svg).each(function() {$(this).remove()});
    var lines = document.getElementById("lines");
    var symbols = document.getElementById("symbols");
    var blocks = document.getElementById("blocks");
    var symclick= function(node) { };
    
    for(var row = 0; row <  matrix.length; row++) {
      for(var col = 0; col < matrix[row].length; col++) {
        if(matrix[row][col] == undefined) continue;
        var svgNS = "http://www.w3.org/2000/svg";
        var xlinkNS = "http://www.w3.org/1999/xlink";
        var g = document.createElementNS(svgNS, "g");
            g.setAttribute('transform', 'translate(' + String((parseInt(col)+1)*width-15) + ',' + String((parseInt(row)+1)*height-30) + ')');

        var use = document.createElementNS(svgNS, "use");
        use.setAttributeNS(xlinkNS, "href", "#"+matrix[row][col].type);

        var attrs = {};
        g.setAttribute('id', 'node-' + matrix[row][col].id);

        attrs = {'id': 'graph-' + matrix[row][col].id, 'class': 'activities'};
        var title = document.createElementNS(svgNS, "title");
        title.appendChild(document.createTextNode(matrix[row][col].id));
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
        switch(matrix[row][col].type) {
          case 'loop':
          case 'alternative':
            var title = document.createElementNS(svgNS, "title");
            title.appendChild(document.createTextNode(matrix[row][col].condition));
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
      }
    }
    console.log('set SVG height: ' + max_height * height); 
    svg.attr('height', max_height * height);
    console.log('set SVG width: ' +  max_width * width); 
    svg.attr('width', max_width * width);
    console.log(svg);
    console.log('Illsutrator: repaint end');
  } // }}}
  // }}}
  // Helper Functions {{{
  var append_sublevel = function(obj) { // {{{
    var row = null;
    var col = null;
    console.log('append');
    for(var i = 0; i < matrix.length; i++) { console.log(matrix[i]);}
    console.log('append');
    console.log(obj);
    if(matrix[obj.ppos.row][obj.ppos.col].expansion == 'vertical') { // {{{
      var match = false;
      row = obj.ppos.row+1;
      while(!match) {
        if(matrix[row] == undefined) matrix[row] = [];
        if(matrix[row][obj.ppos.col + obj.ppos.left_skip] == undefined) {
          matrix[row][obj.ppos.col + obj.ppos.left_skip] = obj;
//          matrix[row][obj.ppos.col] = '';
          match = true;
          col = obj.ppos.col + matrix[obj.ppos.row][obj.ppos.col].left_skip;
          console.log(obj.ppos.col);
          console.log(matrix[obj.ppos.row][obj.ppos.col]);;
          console.log("COL: " + col);
        } else {row++;}
      } // }}}
    } else if(matrix[obj.ppos.row][obj.ppos.col].expansion == 'horizontal') { // {{{
      row = obj.ppos.row+1;
      if(matrix[row] == undefined) matrix[obj.ppos.row+1] = [];
      if(matrix[row][obj.ppos.col + obj.ppos.left_skip] == undefined) {i
        matrix[row][obj.ppos.col + obj.ppos.left_skip] = obj;
        col = obj.ppos.col + obj.ppos.left_skip;
      } else {
        matrix[row].push(obj);
        col = matrix[row].length;
      } // }}}
    } else { // {{{
      console.log('Append Sublevel: Error -> ' + obj.id)
      console.log(obj);
      return;
    } // }}}

    // Expand Matrix up to Top-Parent // {{{
    var p = matrix[obj.ppos.row][obj.ppos.col];
    while(p.pid != 'top-level') {
    console.log(p);
      p = matrix[p.ppos.row][p.ppos.col];
    }
    for(var i = p.row; i < row; i++) {
      if(matrix[i].length < matrix[row].length) matrix[i][matrix[row].length-1] = undefined;
    } // }}}
    return {'row': row, 'col':col};
  } // }}}
  var handle_call_types = function(id, pid, ppos, index, type) { // private {{{
    if(index == undefined && ppos == undefined) { // append on top-level
      matrix.push([{'id': id, 'type': type,'pid':pid}]);
      return {'row':matrix.length-1, 'col':0};
    } else if(index == undefined) { // append on sub-level
      return append_sublevel({'id': id, 'type': type, 'pid':pid,  'ppos':ppos});
    } else if(ppos == undefined) { // insert at top-level
    } else {
    }
  } // }}}
  var find_parent = function(pid) { // private {{{
    for(var row = 0; row <  matrix.length; row++) {
      for(var col = 0; col < matrix[row].length; col++) {
        if(matrix[row][col] != undefined  && matrix[row][col].id != undefined && matrix[row][col].id == pid) return {'row':parseInt(row), 'col': parseInt(col), 'left_skip':matrix[row][col].left_skip};
      }
    }
  } // }}}
  this.display_matrix = function() { // to be removed in the end {{{
    var tab = $('#matrix');
    tab.children().each(function() {$(this).remove();});
    for(var row = 0; row <  matrix.length; row++) {
      var r = $('<tr/>');
      r.append('<b>' + row + '</b>');
      tab.append(r);
      for(var col = 0; col < matrix[row].length; col++) {
        r.append('<td>' + (matrix[row][col] == undefined ? '&nbsp;' : matrix[row][col].id) + '</td>');
      }
    }
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
    parse(description, null);
    illustrator.repaint();
    illustrator.display_matrix();
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
  var parse = function(root, pid, ppos)  { // private {{{
    //for(index in children.toArray()) {
    root.children().each(function() {
      var matched = false;
      var id = null;
      switch(this.tagName) {
        // special elements
        case 'description': // matches only root element named description as only this one has no pid as parameter
          if(ppos == undefined) {
            parse($(this), 'top-level');
            illustrator.endnode();
            break;
          }
        // atomic elements
        case 'call':
          if($(this).children('parameters').children('service').length > 0 && !matched) {  // $('> parameters > service', $(this)) is deprecated (see jQuery Selectors 
            matched = true;
            (illustrator['callinject'])($(this).attr('id'), pid, ppos);
            illustrator.display_matrix();
          }
          if($(this).children('manipulate').length > 0 && !matched) {
            matched = true;
            (illustrator['callmanipulate'])($(this).attr('id'), pid, ppos);
            illustrator.display_matrix();
          }
        // non-atomic elements
        default:
          if($(this).attr('id') == undefined) {
            if(id_counter[this.tagName] == undefined) id_counter[this.tagName] = -1;
            id = this.tagName + '_' + (++id_counter[this.tagName]);
          } else { id = $(this).attr('id');}
          $(this).attr('svg-id', id);
          if((illustrator[this.tagName] != undefined) && !matched) {
            var pos = (illustrator[this.tagName])(id, pid, ppos);
            illustrator.display_matrix();
            parse($(this), id, pos);
          }
      }
    });
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
