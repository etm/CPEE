function WFAdaptorManifestation(adaptor) {
  var self = this;

  this.adaptor = adaptor;
  this.resources = {};
  this.elements = {};
  this.events = {};
  this.compact = false;
  this.striped = true;
  this.endpoints = {};
  this.presstimer;

  //{{{ transform the details data to description parts based on rng
  this.source = function(base,opts) {
    if (base[0].namespaceURI == "http://relaxng.org/ns/structure/1.0") {
      $('#relaxngworker').empty();
      var rngw = new RelaxNGui(base,$('#relaxngworker'),self.adaptor.description.context_eval);
      var nnew = $(rngw.save().documentElement);
      return(nnew);
    } else {
      if (opts && opts == 'clone') {
        base = base.clone();
        if (base.attr('id')) {
          base.attr('id',self.adaptor.description.get_free_id());
        }
        base.find('*[id]').each(function(k,v){
          $(v).attr('id',self.adaptor.description.get_free_id(base));
        });
      }
      return base;
    }
  }; //}}}
  //{{{ Return the svgid for the selected task
  this.selected = function(){
    var svgid = 'unknown';
    _.each(self.adaptor.illustrator.get_elements(),function(value,key) {
      if ($(value).hasClass('selected')) {
        svgid = $(value).attr('element-id');
      }
    });
    return svgid;
  }; //}}}
  //{{{ Return the svgids for all marked tasks
  this.marked = function(){
    var svgid = [];
    _.each(self.adaptor.illustrator.get_elements(),function(value,key) {
      if ($(value).hasClass('marked')) {
        svgid.push($(value).attr('element-id'));
      }
    });
    return svgid;
  }; //}}}
  //{{{ Return the json for all marked tasks
  this.marked_text = function(){
    var nodes = [];
    var markymark = _.uniq(self.marked());
    $(markymark).each(function(key,svgid){
      var node = self.adaptor.description.get_node_by_svg_id(svgid);
      nodes.push($(node).serializePrettyXML());
    });
    return JSON.stringify(nodes);
  }; //}}}
  //{{{ Render the details from rng (right hand side of graph tab)
  this.update_details = function(svgid){
    var tab  = $('#dat_details');
    var node = self.adaptor.description.get_node_by_svg_id(svgid).get(0);
        tab.empty();
    if (self.adaptor.description.elements[$(node).attr('svg-subtype')]) {
      save['details_target'] = { 'svgid': svgid, 'model': self.adaptor.description };
      var rng = self.adaptor.description.elements[$(node).attr('svg-subtype')].clone();
      if (save['endpoints_cache'][$(node).attr('endpoint')] && save['endpoints_cache'][$(node).attr('endpoint')].schema) {
        var schema = save['endpoints_cache'][$(node).attr('endpoint')].schema.documentElement;
        $(rng).find(' > element[name="parameters"] > element[name="arguments"]').replaceWith($(schema).clone());
      }
      if (save['endpoints_list'][$(node).attr('endpoint')] && (!save['endpoints_list'][$(node).attr('endpoint')].startsWith('http') || save['endpoints_list'][$(node).attr('endpoint')].match(/^https?-/))) {
        $(rng).find(' > element[name="parameters"] > element[name="method"]').remove();
      }
      save['details'] = new RelaxNGui(rng,tab,self.adaptor.description.context_eval,true);
      var nn = $X($(node).serializeXML());
          nn.removeAttr('svg-id');
          nn.removeAttr('svg-type');
          nn.removeAttr('svg-subtype');
          nn.removeAttr('svg-label');
      save['details'].content(nn);
      format_visual_forms();
    }
  }; //}}}

  function copyOrMove(menu,group,xml_node,mode) { //{{{
    var nodes = localStorage.getItem('marked');

    if (typeof(nodes) != "string") { return; }

    nodes = JSON.parse(nodes);
    $(nodes).each(function(key,str) {
      nodes[key] = $X(str);
    });

    var check1 = [];
    var check2 = [];
    $(nodes).each(function(key,node){
      check1.push($(node).attr('svg-type'));
    });
    $(group).each(function(key,value){
      check2.push(value.type);
    });

    if (nodes.length > 0 && _.uniq(check1).length == _.intersection(check1,check2).length) {
      if (myid == localStorage.getItem('marked_from')) {
        $(nodes).each(function(key,node){
          nodes[key] = self.adaptor.description.get_node_by_svg_id($(node).attr('svg-id'));
        });
      }
      nodes.reverse();
      var iconm =  self.resources['arrow'].clone();
      var iconc =  self.resources['arrow'].clone();
      iconm.children('.rfill').addClass('menu');
      if (myid == localStorage.getItem('marked_from')) {
        menu.push(
          {
            'label': '<em>Move Marked Elements</em>',
            'function_call': mode,
            'menu_icon': iconm,
            'type': undefined,
            'params': [nodes, xml_node]
          }
        );
      }
      menu.push(
        {
          'label': '<em>Copy Marked Elements</em>',
          'function_call': mode,
          'menu_icon': iconc,
          'type': undefined,
          'params': [nodes, xml_node, 'clone']
        }
      );
    }
  } //}}}

  function contextMenuHandling(svgid,e,child,sibling) { //{{{
    if (save['state'] != "ready" && save['state'] != "stopped") { return false; }

    var xml_node = self.adaptor.description.get_node_by_svg_id(svgid);
    var group = null;
    var menu = {};

    if (child) {
      group = self.elements[xml_node.get(0).tagName].permissible_children(xml_node,'into');
      if(group.length > 0) {
        menu['Insert into'] = group;
        copyOrMove(menu['Insert into'],group,xml_node,self.adaptor.description.insert_first_into);
      }
      if (self.elements[xml_node.get(0).tagName].permissible_children_expert) {
        group = self.elements[xml_node.get(0).tagName].permissible_children_expert(xml_node,'into');
        if(group.length > 0) {
          menu['Insert into (Experts Only!)'] = group;
          copyOrMove(menu['Insert into (Experts Only!)'],group,xml_node,self.adaptor.description.insert_first_into);
        }
      }
    }
    if (sibling) {
      group = self.elements[xml_node.parent().get(0).tagName].permissible_children(xml_node,'after');
      if(group.length > 0) {
        menu['Insert after'] = group;
        copyOrMove(menu['Insert after'],group,xml_node,self.adaptor.description.insert_after);
      }
      if (self.elements[xml_node.parent().get(0).tagName].permissible_children_expert) {
        group = self.elements[xml_node.parent().get(0).tagName].permissible_children_expert(xml_node,'after');
        if(group.length > 0) {
          menu['Insert after (Experts Only!)'] = group;
          copyOrMove(menu['Insert after (Experts Only!)'],group,xml_node,self.adaptor.description.insert_after);
        }
      }
    }

    if(xml_node.get(0).tagName != 'description' && !self.elements[xml_node.get(0).tagName].neverdelete) {
      var icon =  self.elements[xml_node.get(0).tagName].illustrator.svg.clone();
      icon.find('.rfill').addClass('menu');
      icon.find('.hfill').addClass('menu');
      menu['Delete'] = [{
        'label': 'Remove Element',
        'function_call': function(selector,target,selected){
          del_ui_pos(target)
          self.adaptor.description.remove(selector,target);
          localStorage.removeItem('marked');
          localStorage.removeItem('marked_from');
        },
        'menu_icon': icon,
        'type': undefined,
        'params': [null, xml_node, self.selected()]
      }];
      var nodes = localStorage.getItem('marked');
      nodes = JSON.parse(nodes);
      if (nodes && nodes.length > 0) {
        var icond =  self.resources['delete'].clone();
        icond.children('.standfat').addClass('menu');
        menu['Delete'].push({
          'label': 'Remove Marked Elements',
          'function_call': function(){
            $(nodes).each(function(key,str) {
              nodes[key] = $X(str);
            });
            $(nodes).each(function(key,node){
              var target = self.adaptor.description.get_node_by_svg_id($(node).attr('svg-id'));
              del_ui_pos(target)
              self.adaptor.description.remove(null,target);
              localStorage.removeItem('marked');
              localStorage.removeItem('marked_from');
            });
          },
          'menu_icon': icond,
          'type': undefined,
          'params': []
        })
      }
    }
    if($('> code', xml_node).length > 0 && xml_node.get(0).tagName == 'call') {
      var icon =  self.elements.callmanipulate.illustrator.svg.clone();
      icon.children('.rfill:last').addClass('menu');
      menu['Delete'].push({
        'label': 'Remove Scripts',
        'function_call': self.adaptor.description.remove,
        'menu_icon': icon,
        'type': undefined,
        'params': ['> code', xml_node]
      });
    }
    if (xml_node.get(0).tagName == "call" || xml_node.get(0).tagName == "manipulate" || xml_node.get(0).tagName == "stop") {
      var icon =  self.elements.call.illustrator.svg.clone();
      icon.children('g.replace').addClass('passive');
      var vtarget = self.adaptor.illustrator.get_node_by_svg_id(svgid);
      if (vtarget.length > 0) {
        if (vtarget.parents('g.activities.passive, g.activities.active').length > 0) {
          menu['Position'] = [{
            'label': 'No Execution from here',
            'function_call': del_ui_pos,
            'menu_icon': icon,
            'type': undefined,
            'params': xml_node
          }];
        } else {
          menu['Position'] = [{
            'label': 'Execute from here',
            'function_call': add_ui_pos,
            'menu_icon': icon,
            'type': undefined,
            'params': xml_node
          }];
        }
      }
    }
    new CustomMenu(e).contextmenu(menu);
  } //}}}

  function positionHandling(svgid) {
    var xml_node = self.adaptor.description.get_node_by_svg_id(svgid);
    var vtarget = self.adaptor.illustrator.get_node_by_svg_id(svgid);
    if (vtarget.length > 0) {
      if (vtarget.parents('g.activities.passive, g.activities.active').length > 0) {
        del_ui_pos(xml_node);
      } else {
        add_ui_pos(xml_node);
      }
    }
  }

  // Events
  this.events.touchend = function(svgid, e) { // {{{
    clearTimeout(self.presstimer);
  } // }}}
  this.events.touchstart = function(svgid, e, child, sibling) { // {{{
    self.presstimer = window.setTimeout(function() { contextMenuHandling(svgid,e,child,sibling); },1000);
    return false;
  } // }}}
  this.events.mousedown = function(svgid, e, child, sibling) { // {{{
    if(e.button == 0) {  // left-click
    } else if(e.button == 1) { // middle-click
      positionHandling(svgid);
    } else if(e.button == 2) { // right-click
      contextMenuHandling(svgid,e,child,sibling);
    }
    return false;
  } // }}}
  this.events.suppress = function(svgid, e, child, sibling) { // {{{
    return false;
  } // }}}
  this.events.click = function(svgid, e) { // {{{
    if (self.adaptor.description.get_node_by_svg_id(svgid).length == 0) {
      return;
    }

    self.adaptor.illustrator.get_elements().removeClass('selected');
    self.adaptor.illustrator.get_labels().removeClass('selected');

    if (e && (e.ctrlKey || e.metaKey)) {
      if (save['state'] != "ready" && save['state'] != "stopped") { return false; }
      var tab = $('#dat_details');
          tab.empty();
      var vtarget = self.adaptor.illustrator.get_node_by_svg_id(svgid);
      if (vtarget.length > 0) {
        var vt = vtarget.parents('g.element[element-id]');
            vt.toggleClass('marked');
        if (vt.hasClass('marked')) {
          localStorage.setItem('marked',self.marked_text());
          localStorage.setItem('marked_from',myid);
        } else {
          localStorage.removeItem('marked');
          localStorage.removeItem('marked_from');
        }
      }
    } else if (e && (e.shiftKey)) {
      positionHandling(svgid);
    } else {
      self.adaptor.illustrator.get_elements().removeClass('marked');
      localStorage.removeItem('marked');
      localStorage.removeItem('marked_from');

      var vtarget = self.adaptor.illustrator.get_node_by_svg_id(svgid);
      if (vtarget.length > 0) {
        vtarget.parents('g.element[element-id]').addClass('selected');
      }
      self.adaptor.illustrator.get_label_by_svg_id(svgid).addClass('selected');

      self.update_details(svgid);
    }
  } // }}}
  this.events.dblclick = function(svgid, e) { // {{{
  } // }}}
  this.events.mouseover = function(svgid, e) { // {{{
    self.adaptor.illustrator.svg.container.find('.tile[element-id = "' + svgid + '"]').css('display','block');
    self.adaptor.illustrator.svg.container.find('[element-id = "' + svgid + '"]').addClass('hover');
    self.adaptor.illustrator.svg.label_container.find('[element-id = "' + svgid + '"]').addClass('hover');
    return false;
  } // }}}
  this.events.mouseout = function(svgid, e) { // {{{
    self.adaptor.illustrator.svg.container.find('.tile[element-id = "' + svgid + '"]').css('display','none');
    self.adaptor.illustrator.svg.container.find('[element-id = "' + svgid + '"]').removeClass('hover');
    self.adaptor.illustrator.svg.label_container.find('[element-id = "' + svgid + '"]').removeClass('hover');
    return false;
  } // }}}
  this.events.dragstart = function (svgid, e) { //{{{
  } //}}}

  // other resources
  this.resources.arrow =  self.adaptor.theme_dir + 'symbols/arrow.svg';
  this.resources.delete =  self.adaptor.theme_dir + 'symbols/delete.svg';

  // Primitive Elements
  this.elements.call = { /*{{{*/
    'type': 'primitive',
    'illustrator': {//{{{
      'endnodes': 'this',
      'label': function(node){
        var rep = $('body').attr('current-resources');
        var ep = self.endpoints[$(node).attr('endpoint')];
        var wait = $('_timing_wait',$(node).children('annotations')).text();
        var threshold = $('_timing_threshold',$(node).children('annotations')).text();
        var adur = $('_timing_avg',$(node).children('annotations')).text();
        var lab = $('> label',$(node).children('parameters')).text().replace(/^['"]/,'').replace(/['"]$/,'');
        var ret = [ { column: 'ID', value: $(node).attr('id') } ];
        if (lab != '') {
          ret.unshift( { column: 'Label', value: lab } );
        }
        if (wait != '') {
          ret.push({ column: 'Wait', value: 'ω = ' + wait });
        }
        if (threshold != '') {
          ret.push({ column: 'Threshold', value: 'κ = ' + threshold });
        }
        if (adur != '') {
          ret.push({ column: 'Duration', value: '~T = ' + adur + 'm' });
        }
        return ret;
      },
      'info': function(node){ return { 'element-endpoint': $(node).attr('endpoint') }; },
      'resolve_symbol': function(node) {
        if($('> code', node).length > 0) {
          return 'callmanipulate';
        } else {
          return 'call';
        }
      },
      'svg': self.adaptor.theme_dir + 'symbols/call.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/call.rng',
    'permissible_children': function(node,mode) { //{{{
      if(node.children('code').length < 1)
        return [
         {'label': 'Scripts',
          'function_call': self.adaptor.description.insert_last_into,
          'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
          'type': undefined,
          'params': [self.adaptor.description.elements.scripts, node]}
        ];
      return [];
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dragstart': self.events.dragstart,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout
    }//}}}
  }; /*}}}*/
  this.elements.manipulate = { /*{{{*/
    'type': 'primitive',
    'illustrator': {//{{{
      'endnodes': 'this',
      'label': function(node){
        var lab = $(node).attr('label');
        if (lab) {
          return [ { column: 'Label', value: lab.replace(/^['"]/,'').replace(/['"]$/,'') }, { column: 'ID', value: $(node).attr('id') } ];
        }  else {
          return [ { column: 'ID', value: $(node).attr('id') } ];
        }
      },
      'svg': self.adaptor.theme_dir + 'symbols/manipulate.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/manipulate.rng',
    'permissible_children': function(node,mode) { //{{{
      return [];
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,false,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,false,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout
    }//}}}
  }; /*}}}*/
  this.elements.escape = { /*{{{*/
    'type': 'primitive',
    'illustrator': {//{{{
      'endnodes': 'this',
      'svg': self.adaptor.theme_dir + 'symbols/escape.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/escape.rng',
    'permissible_children': function(node,mode) { //{{{
      return [];
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,false,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,false,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout
    }//}}}
  }; /*}}}*/
  this.elements.stop = { /*{{{*/
    'type': 'primitive',
    'illustrator': {//{{{
      'endnodes': 'this',
      'label': function(node){
        return [ { column: 'ID', value: $(node).attr('id') } ];
      },
      'svg': self.adaptor.theme_dir + 'symbols/stop.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/stop.rng',
    'permissible_children': function(node,mode) { //{{{
      return [];
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,false,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,false,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout
    }//}}}
  }; /*}}}*/
  this.elements.terminate = { /*{{{*/
    'type': 'primitive',
    'illustrator': {//{{{
      'endnodes': 'this',
      'final': true,
      'svg': self.adaptor.theme_dir + 'symbols/terminate.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/terminate.rng',
    'permissible_children': function(node,mode) { //{{{
      return [];
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,false,false); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,false,false); },
      'touchend': self.events.touchend,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout
    }//}}}
  }; /*}}}*/
  this.elements.end = { /*{{{*/
    'type': 'primitive',
    'illustrator': {//{{{
      'endnodes': 'this',
      'svg': self.adaptor.theme_dir + 'symbols/end.svg'
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.suppress(); }
    }//}}}
  }; /*}}}*/
  this.elements.event_end = { /*{{{*/
    'type': 'primitive',
    'illustrator': {//{{{
      'endnodes': 'this',
      'svg': self.adaptor.theme_dir + 'symbols/event_end.svg'
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.suppress(); },
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout
    }//}}}
  }; /*}}}*/
  this.elements.choose_finish = { /*{{{*/
    'type': 'primitive',
    'illustrator': {//{{{
      'endnodes': 'this',
      'svg': self.adaptor.theme_dir + 'symbols/choose_inclusive.svg',
      'resolve_symbol': function(node) {
        if($(node).attr('mode') == 'exclusive') {
          return 'choose_exclusive_finish';
        } else {
          return 'choose_inclusive_finish';
        }
      },
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout
    }//}}}
  }; /*}}}*/
  this.elements.loop_finish = { /*{{{*/
    'type': 'primitive',
    'illustrator': {//{{{
      'endnodes': 'this',
      'closeblock': true,
      'label': function(node){
        var avg = $('> _probability_avg',$(node).children('_probability')).text();
        var ret = [ { column: 'Label', value: $(node).attr('condition') } ];
        if (avg != '') {
          ret.push({ column: 'Average', value: avg + 'ｘ' });
        }
        return ret;
      },
      'svg': self.adaptor.theme_dir + 'symbols/choose_exclusive.svg',
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout
    }//}}}
  }; /*}}}*/
  this.elements.parallel_finish = { /*{{{*/
    'type': 'primitive',
    'illustrator': {//{{{
      'endnodes': 'this',
      'svg': self.adaptor.theme_dir + 'symbols/parallel.svg',
      'resolve_symbol': function(node) {
        if($(node).children(':not(parallel_branch)').length > 0) {
          return 'parallel_complex';
        } else if($(node).attr('cancel') == 'last' && $(node).attr('wait') == '-1') {
          return 'parallel_simple';
        } else if($(node).attr('cancel') == 'first' && $(node).attr('wait') == '-1') {
          return 'parallel_event_all';
        } else if($(node).attr('cancel') == 'first' && $(node).attr('wait') == '1') {
          return 'parallel_event_one';
        } else {
          return 'parallel_complex';
        }
      },
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout
    }//}}}
  }; /*}}}*/

  // Complex Elements
  this.elements.choose = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'label': function(node){ return [ { column: 'Label', value: $(node).attr('mode') == 'exclusive' ? 'exclusive' : 'inclusive' } ]; },
      'endnodes': 'aggregate',
      'closeblock': false,
      'closing_symbol': 'choose_finish',
      'expansion': function(node) {
        return 'horizontal';
      },
      'resolve_symbol': function(node) {
        if($(node).attr('mode') == 'exclusive') {
          return 'choose_exclusive';
        } else {
          return 'choose_inclusive';
        }
      },
      'col_shift': function(node) {
        return false;
      },
      'svg': self.adaptor.theme_dir + 'symbols/choose.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/choose.rng',
    'permissible_children': function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      if(node.children('parallel_branch').length > 0) {
        return [{'label': 'Parallel Branch',
         'function_call': func,
         'menu_icon': self.elements.parallel_branch.illustrator.svg.clone(),
         'type': 'parallel_branch',
         'params': [self.adaptor.description.elements.parallel_branch, node]}];
      }
      var childs = [{'label': 'Alternative',
       'function_call': func,
       'menu_icon': self.elements.alternative.illustrator.svg.clone(),
       'type': 'alternative',
       'params': [self.adaptor.description.elements.alternative, node]}];
      if((node.children('otherwise').length == 0) && node.parents('parallel').length == node.parents('parallel_branch').length && node.parent('choose').length == 0)
        childs.push({'label': 'Otherwise',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.otherwise.illustrator.svg.clone(),
         'type': 'otherwise',
         'params': [self.adaptor.description.elements.otherwise, node]});
      if(node.parents('parallel').length > node.parents('parallel_branch').length)
        childs.push({'label': 'Parallel Branch',
         'function_call': func,
         'menu_icon': self.elements.parallel_branch.illustrator.svg.clone(),
         'type': 'parallel_branch',
         'params': [self.adaptor.description.elements.parallel_branch, node]});
      return childs;
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout
    }//}}}
  };  /*}}}*/
  this.elements.otherwise = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'label': function(node){
        var avg = $('> _probability_avg',$(node).children('_probability')).text();
        return (avg == '' ? [] : [ { column: 'Average', value: avg + '%' } ]);
      },
      'endnodes': 'passthrough',
      'closeblock': false,
      'noarrow': true,
      'expansion': function(node) {
        return 'vertical';
      },
      'col_shift': function(node) {
        return false;
      },
      'svg': self.adaptor.theme_dir + 'symbols/otherwise.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/otherwise.rng',
    'neverdelete': true,
    'permissible_children': function(node,mode) { //{{{
      var func = null;
      var childs = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.elements.parallel.illustrator.svg.clone(),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': self.elements.closed_loop.illustrator.svg.clone(),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': self.elements.terminate.illustrator.svg.clone(),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.elements.stop.illustrator.svg.clone(),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': self.elements.critical.illustrator.svg.clone(),
           'type': 'critical',
           'params': [self.adaptor.description.elements.critical, node]
        });
      }
      return childs;
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,false); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,false); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  }; /*}}}*/
  this.elements.alternative = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'label': function(node){
        var avg = $('> _probability_avg',$(node).children('_probability')).text();
        var ret = [ { column: 'Label', value: $(node).attr('condition') } ];
        if (avg != '') {
          ret.push({ column: 'Average', value: avg + '%' });
        }
        return ret;
      },
      'endnodes': 'passthrough',
      'noarrow': true,
      'closeblock':false,
      'expansion': function(node) {
        return 'vertical';
      },
      'col_shift': function(node) {
        return false;
      },
      'svg': self.adaptor.theme_dir + 'symbols/alternative.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/alternative.rng',
    'permissible_children': function(node,mode) { //{{{
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      if(node.parents('parallel').length > node.parents('parallel_branch').length && node.get(0).tagName == 'alternative') {
        return [{'label': 'Parallel Branch',
         'function_call': func,
         'menu_icon': self.elements.parallel_branch.illustrator.svg.clone(),
         'type': 'parallel_branch',
         'params': [self.adaptor.description.elements.parallel_branch, node]}];
      }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.elements.parallel.illustrator.svg.clone(),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': self.elements.closed_loop.illustrator.svg.clone(),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': self.elements.terminate.illustrator.svg.clone(),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.elements.stop.illustrator.svg.clone(),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': self.elements.critical.illustrator.svg.clone(),
           'type': 'critical',
           'params': [self.adaptor.description.elements.critical, node]
        });
      }
      return childs;
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.loop = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'resolve_symbol': function(node) {
        if($(node).attr('mode') == 'pre_test') {
          return 'loop_head';
        } else {
          return 'loop_tail';
        }
      },
      'expansion': function(node) {
        return 'vertical';
      },
      'col_shift': function(node) {
        return true;
      },
      'svg': self.adaptor.theme_dir + 'symbols/loop.svg'
    },// }}}
    'description': self.adaptor.theme_dir + 'rngs/loop.rng',
    'permissible_children': function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': self.elements.closed_loop.illustrator.svg.clone(),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': self.elements.terminate.illustrator.svg.clone(),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.elements.stop.illustrator.svg.clone(),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': self.elements.critical.illustrator.svg.clone(),
           'type': 'critical',
           'params': [self.adaptor.description.elements.critical, node]
        });
      }
      if(node.parent('parallel').length > node.parent('parallel_branch').length) {
        childs.push({'label': 'Parallel Branch',
                     'function_call': func,
                     'menu_icon': self.elements.parallel_branch.illustrator.svg.clone(),
                     'type': 'parallel_branch',
                     'params': [self.adaptor.description.elements.parallel_branch, node]}
                    );
      } else {
        childs.push({'label': 'Parallel',
                     'function_call': func,
                     'menu_icon': self.elements.parallel.illustrator.svg.clone(),
                     'type': 'parallel',
                     'params': [self.adaptor.description.elements.parallel, node]}
                    );
      }
      return childs;
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.closed_loop = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'endnodes': 'aggregate',
      'closeblock': false,
      'col_shift': function(node) {
        return true;
      },
      'closing_symbol': 'closed_loop_finish',
      'expansion': function(node) {
        return 'horizontal';
      },
      'label': function(node){
        var avg = $('> _probability_avg',$(node).children('_probability')).text();
        var ret = [ { column: 'Label', value: ($(node).attr('overrun') + ', ' + $(node).attr('execution')) } ];
        if (avg != '') {
          ret.push({ column: 'Average', value: avg + '%' });
        }
        return ret;
      },
      'svg': self.adaptor.theme_dir + 'symbols/closed_loop.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/closed_loop.rng',
    'permissible_children': function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs =  [
        {'label': 'Measuring',
         'function_call': func,
         'menu_icon': self.elements.closed_loop_measuring.illustrator.svg.clone(),
         'type': 'closed_loop_measuring',
         'params': [self.adaptor.description.elements.closed_loop_measuring, node]} ,
        {'label': 'Control',
         'function_call': func,
         'menu_icon': self.elements.closed_loop_control.illustrator.svg.clone(),
         'type': 'closed_loop_control',
         'params': [self.adaptor.description.elements.closed_loop_control, node]},
        {'label': 'Cancel',
         'function_call': func,
         'menu_icon': self.elements.closed_loop_cancel.illustrator.svg.clone(),
         'type': 'closed_loop_cancel',
         'params': [self.adaptor.description.elements.closed_loop_cancel, node]}
      ];
      return childs;
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.closed_loop_measuring = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'endnodes': 'passthrough',
      'closeblock': false,
      'noarrow': true,
      'expansion': function(node) {
        return 'vertical';
      },
      'col_shift': function(node) {
        return false;
      },
      'label': function(node){
        var vals = [];
        $('> value',$(node).children('_expected')).each((k,v) => {
          vals.push($(v).text());
        });
        var valtext = '';
        if (vals.length > 0) {
          valtext = ' (' + vals.join(', ') + ')';
        } else {
          valtext = '';
        }
        var ret = [ { column: 'Label', value: 'measure: t = ' + $(node).attr('ctime') + ' ms' + valtext } ];
        return ret;
      },
      'svg': self.adaptor.theme_dir + 'symbols/closed_loop_measuring.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/closed_loop_measuring.rng',
    'permissible_children': function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.elements.parallel.illustrator.svg.clone(),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.elements.stop.illustrator.svg.clone(),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      return childs;
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.closed_loop_control = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'endnodes': 'passthrough',
      'closeblock': false,
      'noarrow': true,
      'expansion': function(node) {
        return 'vertical';
      },
      'col_shift': function(node) {
        return false;
      },
      'label': function(node){
        var vals = [];
        $('> change > value',$(node).children('_expected')).each((k,v) => {
          vals.push($(v).text());
        });
        var valtext = '';
        if (vals.length > 0) {
          valtext = ' (' + vals.join(', ') + ')';
        } else {
          valtext = '';
        }
        var ret = [ { column: 'Label', value: 'control: t = ' + $(node).attr('ctime') + ' ms' + valtext } ];
        return ret;
      },
      'svg': self.adaptor.theme_dir + 'symbols/closed_loop_control.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/closed_loop_control.rng',
    'permissible_children': function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Control',
         'function_call': func,
         'menu_icon': self.elements.closed_loop_control.illustrator.svg.clone(),
         'type': 'closed_loop_control',
         'params': [self.adaptor.description.elements.closed_loop_control, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.elements.parallel.illustrator.svg.clone(),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.elements.stop.illustrator.svg.clone(),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      return childs;
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.closed_loop_cancel = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'endnodes': 'passthrough',
      'closeblock': false,
      'noarrow': true,
      'expansion': function(node) {
        return 'vertical';
      },
      'col_shift': function(node) {
        return false;
      },
      'label': function(node){
        var ret = [ { column: 'Label', value: $(node).attr('condition') } ];
        return ret;
      },
      'svg': self.adaptor.theme_dir + 'symbols/closed_loop_cancel.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/closed_loop_cancel.rng',
    'permissible_children': function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.elements.parallel.illustrator.svg.clone(),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.elements.stop.illustrator.svg.clone(),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      return childs;
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.parallel = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'endnodes': 'aggregate',
      'closeblock': false,
      'closing_symbol': 'parallel_finish',
      'expansion': function(node) {
        // check if any sibling other than 'parallel_branch' is present
        if($(node).children(':not(parallel_branch)').length > 0) return 'vertical';
        return 'horizontal';
      },
      'col_shift': function(node) {
        return true;
      },
      'svg': self.adaptor.theme_dir + 'symbols/parallel.svg',
      'resolve_symbol': function(node) {
        if($(node).attr('cancel') == 'last') {
          return 'parallel_start';
        } else if($(node).attr('cancel') == 'first' && $(node).attr('wait') == 1) {
          return 'parallel_eventbased_exclusive';
        } else {
          return 'parallel_eventbased_parallel';
        }
      },
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/parallel.rng',
    'permissible_children': function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs =  [
        {'label': 'Parallel Branch',
         'function_call': func,
         'menu_icon': self.elements.parallel_branch.illustrator.svg.clone(),
         'type': 'parallel_branch',
         'params': [self.adaptor.description.elements.parallel_branch, node]},
      ];
      return childs;
    }, //}}}
    'permissible_children_expert': function(node,mode) { //{{{
      var func = null;
      if (mode.match(/into/)) { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs =  [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': self.elements.closed_loop.illustrator.svg.clone(),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.elements.stop.illustrator.svg.clone(),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.get(0).tagName != 'parallel')
        childs.push({'label': 'Parallel',
           'function_call': self.adaptor.description.insert_last_into,
           'menu_icon': self.elements.parallel.illustrator.svg.clone(),
           'type': 'parallel',
           'params': [self.adaptor.description.elements.parallel, node]});
      return childs;
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.parallel_branch = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'endnodes': 'passthrough',
      'closeblock': false,
      'noarrow': true,
      'expansion': function(node) {
        return 'vertical';
      },
      'resolve_symbol': function(node,shift) {
        if(shift == true) {
          return 'parallel_branch_event';
        } else {
          return 'parallel_branch_normal';
        }
      },
      'col_shift': function(node) {
        if(node.parentNode.tagName == 'choose') return false;
        if($(node).parents('parallel').first().children(':not(parallel_branch)').length > 0) return true;
        return false;
      },
      'svg': self.adaptor.theme_dir + 'symbols/parallel_branch.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/parallel_branch.rng',
    'permissible_children': function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.elements.parallel.illustrator.svg.clone(),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': self.elements.closed_loop.illustrator.svg.clone(),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': self.elements.terminate.illustrator.svg.clone(),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.elements.stop.illustrator.svg.clone(),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'type': 'critical',
         'params': [self.adaptor.description.elements.critical, node]}
      ];
      if(node.parents('choose').length > node.parents('alternative, otherwise').length && node.get(0).tagName == 'parallel_branch') {
        return [{'label': 'Alternative',
         'function_call': func,
         'menu_icon': self.elements.alternative.illustrator.svg.clone(),
         'type': 'alternative',
         'params': [self.adaptor.description.elements.alternative, node]}];
      }
      return childs;
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.critical = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'endnodes': 'aggregate',
      'closeblock': false,
      'border': true,
      'expansion': function(node) {
        return 'vertical';
      },
      'col_shift': function(node) {
        return true;
      },
      'svg': self.adaptor.theme_dir + 'symbols/critical.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/critical.rng',
    'permissible_children': function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.elements.parallel.illustrator.svg.clone(),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': self.elements.closed_loop.illustrator.svg.clone(),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': self.elements.terminate.illustrator.svg.clone(),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.elements.stop.illustrator.svg.clone(),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': self.elements.critical.illustrator.svg.clone(),
           'type': 'critical',
           'params': [self.adaptor.description.elements.critical, node]
        });
      }
      return childs;
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.group = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'endnodes': 'aggregate',
      'closeblock': false,
      'border': 'injectiongroup', // other value than true,false inidcates the used class for the svg-object
      'expansion': function(node) {
        return 'vertical';
      },
      'col_shift': function(node) {
        return true;
      },
      'svg': null
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/group.rng',
    'permissible_children': function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      return [
      ];
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,true); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.start = this.elements.description = { /*{{{*/
    'type': 'description',
    'illustrator': {//{{{
      'endnodes': 'passthrough',
      'label': function(node){ return [ { column: 'Label'}, { column: 'ID' }, { column: 'Resource' }, { column: 'RP' }, { column: 'R#' } ]; },
      'closeblock': false,
      'balance': true,
      'expansion': function(node) {
        return 'vertical';
      },
      'closing_symbol': 'end',
      'col_shift': function(node) {
        return true;
      },
      'svg': self.adaptor.theme_dir + 'symbols/start.svg'
    },//}}}
    'description': null,
    'permissible_children': function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.elements.parallel.illustrator.svg.clone(),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': self.elements.closed_loop.illustrator.svg.clone(),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.elements.stop.illustrator.svg.clone(),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': self.elements.critical.illustrator.svg.clone(),
           'type': 'critical',
           'params': [self.adaptor.description.elements.critical, node]
        });
      }
      return childs;
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,true,false); },
      'touchstart': function (node,e) { self.events.touchstart(node,e,true,false); },
      'touchend': self.events.touchend,
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  }; /*}}}*/

  // Abstract Elements
  // * they may only have an illustrator (or other parts)
  // * they HAVE TO have a parent
  this.elements.callmanipulate = { /*{{{*/
    'parent': 'call',
    'description': self.adaptor.theme_dir + 'rngs/callmanipulate.rng',
    'illustrator': {//{{{
      'info': function(node){ return { 'element-endpoint': $(node).attr('endpoint') }; },
      'svg': self.adaptor.theme_dir + 'symbols/callmanipulate.svg'
    },//}}}
  }; /*}}}*/
  this.elements.loop_head = { /*{{{*/
    'parent': 'loop',
    'illustrator': {//{{{
      'endnodes': 'this',
      'closeblock': true,
      'label': function(node){
        var avg = $('> _probability_avg',$(node).children('_probability')).text();
        var ret = [ { column: 'Label', value: $(node).attr('condition') } ];
        if (avg != '') {
          ret.push({ column: 'Average', value: avg + 'ｘ' });
        }
        return ret;
      },
    }//}}}
  };  /*}}}*/
  this.elements.loop_tail = { /*{{{*/
    'parent': 'loop',
    'illustrator': {//{{{
      'endnodes': 'aggregate',
      'closeblock': false,
      'closing_symbol': 'loop_finish'
    },//}}}
  };  /*}}}*/
  this.elements.choose_inclusive = { /*{{{*/
    'parent': 'choose',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/choose_inclusive.svg'
    }//}}}
  };  /*}}}*/
  this.elements.choose_exclusive = { /*{{{*/
    'parent': 'choose',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/choose_exclusive.svg'
    },//}}}
  };  /*}}}*/
  this.elements.choose_inclusive_finish = { /*{{{*/
    'parent': 'choose_finish',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/choose_inclusive.svg'
    }//}}}
  };  /*}}}*/
  this.elements.choose_exclusive_finish = { /*{{{*/
    'parent': 'choose_finish',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/choose_exclusive.svg'
    },//}}}
  };  /*}}}*/
  this.elements.loop_head_finish = { /*{{{*/
    'parent': 'loop_finish',
    'illustrator': {//{{{
      'endnodes': 'this',
      'closeblock': true,
      'svg': self.adaptor.theme_dir + 'symbols/choose_exclusive.svg'
    }//}}}
  };  /*}}}*/
  this.elements.loop_tail_finish = { /*{{{*/
    'parent': 'loop_finish',
    'illustrator': {//{{{
      'endnodes': 'this',
      'closeblock': false,
      'svg': self.adaptor.theme_dir + 'symbols/choose_exclusive.svg'
    },//}}}
  };  /*}}}*/
  this.elements.closed_loop_finish = { /*{{{*/
    'parent': 'closed_loop_finish',
    'illustrator': {//{{{
      'endnodes': 'this',
      'closeblock': true,
      'svg': self.adaptor.theme_dir + 'symbols/closed_loop.svg'
    }//}}}
  };  /*}}}*/
  this.elements.parallel_start = { /*{{{*/
    'parent': 'parallel',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/parallel.svg'
    }//}}}
  };  /*}}}*/
  this.elements.parallel_eventbased_exclusive = { /*{{{*/
    'parent': 'parallel',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/parallel_eventbased_exclusive.svg'
    }//}}}
  }; /*}}}*/
  this.elements.parallel_eventbased_parallel = { /*{{{*/
    'parent': 'parallel',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/parallel_eventbased_parallel.svg'
    }//}}}
  }; /*}}}*/
  this.elements.parallel_simple = { /*{{{*/
    'parent': 'parallel_finish',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/parallel.svg'
    }//}}}
  };  /*}}}*/
  this.elements.parallel_complex = { /*{{{*/
    'parent': 'parallel_finish',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/complex.svg'
    },//}}}
  };  /*}}}*/
  this.elements.parallel_event_all = { /*{{{*/
    'parent': 'parallel_finish',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/parallel_eventbased_parallel.svg'
    }//}}}
  }; /*}}}*/
  this.elements.parallel_event_one = { /*{{{*/
    'parent': 'parallel_finish',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/parallel_eventbased_exclusive.svg'
    }//}}}
  }; /*}}}*/
  this.elements.parallel_branch_normal = { /*{{{*/
    'parent': 'parallel_branch',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/parallel_branch_normal.svg'
    }//}}}
  };  /*}}}*/
  this.elements.parallel_branch_event = { /*{{{*/
    'parent': 'parallel_branch',
    'illustrator': {//{{{
      'endnodes': 'this',
      'noarrow': false,
      'border': true,
      'wide': true,
      'closing_symbol': 'event_end',
      'svg': self.adaptor.theme_dir + 'symbols/parallel_branch_event.svg'
    }//}}}
  };  /*}}}*/
  this.elements.parallel_branch_compact = { /*{{{*/
    'parent': 'parallel_branch',
    'illustrator': {//{{{
      'endnodes': 'this',
      'svg': self.adaptor.theme_dir + 'symbols/parallel_branch_compact.svg'
    }//}}}
  };  /*}}}*/
  this.elements.scripts = { /*{{{*/
    'description': [self.adaptor.theme_dir + 'rngs/scripts.rng']
  }; /*}}}*/
}
