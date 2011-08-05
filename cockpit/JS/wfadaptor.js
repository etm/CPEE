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
  // }}}
  // Generic Functions {{{
  var set_container = function(con) { // {{{
    console.log('illustrator: set container');
  } // }}}
  var clear = this.clear = function() { // {{{
    console.log('illustrator: clear');
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
    console.log('ENDNODE');
  } // }}}
  this.call = function(id, pid, index) { // public {{{
    console.log('CALL -> ' + id + ' Parent: ' + pid);
    handle_call_types(id, pid, index, 'call');
  } // }}}
  this.callmanipulate = function(id, pid, index) { // public {{{
    console.log('CALL_MANIPULATE -> ' + id + ' Parent: ' + pid);
    handle_call_types(id, pid, index, 'callmanipulate');
  } // }}}
  this.callinject = function(id, pid, index) { // public {{{
    console.log('CALL_INJECT -> ' + id + ' Parent: ' + pid);
    handle_call_types(id, pid, index, 'callinject');
  } // }}}
  this.manipulate = function(id, pid, index) { // public {{{
    console.log('MANIPULATE -> ' + id + ' Parent: ' + pid);
    if(index == undefined) {
    } else {
    }
  } // }}}
  this.choose = function(id, pid, index) { // public {{{
    console.log('CHOOSE -> ' +id + ' Parent: ' + pid);
    if(index == undefined) {
    } else {
    }
  } // }}}
  this.loop = function(id, pid, index) { // public {{{
    console.log('LOOP -> ' + id + ' Parent: ' + pid);
    if(index == undefined) {
    } else {
    }
  } // }}}
  this.alternative = function(id, pid, index) { // public {{{
    console.log('ALTERNATIVE -> ' + id + ' Parent: ' + pid);
    if(index == undefined) {
    } else {
    }
  } // }}}
  this.otherwise = function(id, pid, index) { // public {{{
    console.log('OTHERWISE -> ' + id + ' Parent: ' + pid);
    if(index == undefined) {
    } else {
    }
  } // }}}
  this.parallel = function(id, pid, index) { // public {{{
    console.log('PARALLEL -> ' +id + ' Parent: ' + pid);
    if(index == undefined) {
    } else {
    }
  } // }}}
  this.parallel_branch = function(id, pid, index) { // public {{{
    console.log('PARALLEL_BRANCH -> ' +id + ' Parent: ' + pid);
    if(index == undefined) {
    } else {
    }
  } // }}}
  this.critical = function(id, pid, index) { // public {{{
    console.log('CRITICAL -> ' + id + ' Parent: ' + pid);
    if(index == undefined) {
    } else {
    }
  } // }}}
  this.draw_connection = function(start_id, end_id) { // private {{{
  } // }}}
  var repaint = this.repaint = function() { // public {{{
    var lines = document.getElementById("lines");
    var symbols = document.getElementById("symbols");
    var blocks = document.getElementById("blocks");
    var symclick= function(node) { };
    
    for(row in matrix) {
      for(col in matrix[row]) {
        var svgNS = "http://www.w3.org/2000/svg";
        var xlinkNS = "http://www.w3.org/1999/xlink";
        var g = document.createElementNS(svgNS, "g");
        console.log(typeof row);
        console.log(typeof col);
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
  } // }}}
  // }}}
  // Helper Functions {{{
  var handle_call_types = function(id, pid, index, type) { // private {{{
    var ppos = find_parent(pid);
    if(index == undefined && ppos == undefined) { // append on top-level
      matrix.push([{'id': id, 'type': type,'pid':pid}]);
      console.log(matrix);
    } else if(index == undefined) { // append on sub-level
    } else if(ppos == undefined) { // insert at top-level
    } else {
    }
  } // }}}
  var find_parent = function(pid) { // private {{{
    for(row in matrix) {
      for(col in matrix[row]) {
        if(matrix[row][col].id == pid) return {'row':row, 'col': col};
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
    parse(description, null);
    console.log(' -> Description: End parsing');
    illustrator.repaint();
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
  var parse = function(root, pid) { // private {{{
    //for(index in children.toArray()) {
    root.children().each(function() {
      var matched = false;
      var id = null;
      switch(this.tagName) {
        // special elements
        case 'description': // matches only root element named description as only this one has no pid as parameter
          if(pid == undefined) {
            parse($(this), 'top-level');
            illustrator.endnode();
            break;
          }
        // atomic elements
        case 'call':
          if($(this).children('parameters').children('service').length > 0 && !matched) {  // $('> parameters > service', $(this)) is deprecated (see jQuery Selectors 
            matched = true;
            (illustrator['callinject'])($(this).attr('id'), pid);
          }
          if($(this).children('manipulate').length > 0 && !matched) {
            matched = true;
            (illustrator['callmanipulate'])($(this).attr('id'), pid);
          }
        // non-atomic elements
        default:
          if($(this).attr('id') == undefined) {
            if(id_counter[this.tagName] == undefined) id_counter[this.tagName] = -1;
            id = this.tagName + '_' + (++id_counter[this.tagName]);
          } else { id = $(this).attr('id');}
          $(this).attr('svg-id', id);
          if((illustrator[this.tagName] != undefined) && !matched) {
            (illustrator[this.tagName])(id, pid); 
            parse($(this), id);
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
