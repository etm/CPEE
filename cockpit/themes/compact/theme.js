function WFAdaptorManifestation(adaptor) {
  var self = this;

  this.adaptor = adaptor;
  this.resources = {};
  this.elements = {};
  this.events = {};
  this.compact = true;

  this.noarrow = ['alternative', 'otherwise'];
  this.source = function(base,opts) {
    if (base[0].namespaceURI == "http://relaxng.org/ns/structure/1.0") {
      $('#relaxngworker').empty();
      var rngw = new RelaxNGui(base,$('#relaxngworker'),self.adaptor.description.context_eval);
      var nnew = $(rngw.save().documentElement);
          nnew.attr('trans-xmlns','http://cpee.org/ns/description/1.0');
      var ntxt = nnew.serializeXML();
      ntxt = ntxt.replace(/trans-xmlns/,'xmlns');

      return($X(ntxt));
    } else {
      if (opts && opts == 'clone') {
        if (base.attr('id')) {
          base = base.clone();
          // not very generic, because it is assumed that id is attribute of top level
          // a better solution would be to parse rng for get_free_id()
          // but: there is lots of lock-in to element-id, so fuck it
          base.attr('id',self.adaptor.description.get_free_id());
        }
      }
      return base;
    }
  };
  this.clicked = function(){
    var svgid = 'unknown';
    _.each(self.adaptor.illustrator.get_elements(),function(value,key) {
      if ($(value).hasClass('clicked')) {
        svgid = $(value).attr('element-id');
      }
    });
    return svgid;
  };
  this.marked = function(){
    var svgid = [];
    _.each(self.adaptor.illustrator.get_elements(),function(value,key) {
      if ($(value).hasClass('marked')) {
        svgid.push($(value).attr('element-id'));
      }
    });
    return svgid;
  };

  function copyOrMove(menu,group,xml_node,mode) {
    var markymark = self.marked();
    var check1 = [];
    var check2 = [];
    $(markymark).each(function(key,svgid){
      var node = self.adaptor.description.get_node_by_svg_id(svgid);
      check1.push($(node).attr('svg-type'));
    });
    $(group).each(function(key,value){
      check2.push(value.type);
    });

    if (markymark.length > 0 && _.uniq(check1).length == _.intersection(check1,check2).length) {
      var nodes = [];
      $(markymark).each(function(key,svgid){
        var node = self.adaptor.description.get_node_by_svg_id(svgid);
        nodes.unshift(node);
      });

      var iconm =  self.resources['arrow'].clone();
      var iconc =  self.resources['arrow'].clone();
      iconm.children('.rfill').addClass('menu');
      menu.push(
        {
          'label': '<em>Move Marked Elements</em>',
          'function_call': mode,
          'menu_icon': iconm,
          'type': undefined,
          'params': [nodes, xml_node]
        },
        {
          'label': '<em>Copy Marked Elements</em>',
          'function_call': mode,
          'menu_icon': iconc,
          'type': undefined,
          'params': [nodes, xml_node, 'clone']
        }
      );
    }
  }

  // Events
  this.events.mousedown = function(svgid, e, child, sibling) { // {{{
    if(e.button == 0) {  // left-click
    } else if(e.button == 1) { // middle-click
    } else if(e.button == 2) { // right-click
      var xml_node = self.adaptor.description.get_node_by_svg_id(svgid);
      var group = null;
      var menu = {};

      if (child) {
        group = self.elements[xml_node.get(0).tagName].permissible_children(xml_node,'into');
        if(group.length > 0) {
          menu['Insert into'] = group;
          copyOrMove(menu['Insert into'],group,self.adaptor.description.insert_first_into);
        }
      }
      if (sibling) {
        group = self.elements[xml_node.parent().get(0).tagName].permissible_children(xml_node,'after');
        if(group.length > 0) {
          menu['Insert after'] = group;
          copyOrMove(menu['Insert after'],group,xml_node,self.adaptor.description.insert_after);
        }
      }

      if(xml_node.get(0).tagName != 'description' && !self.elements[xml_node.get(0).tagName].neverdelete) {
        var icon =  self.elements[xml_node.get(0).tagName].illustrator.svg.clone();
        icon.children('.rfill').addClass('menu');
        menu['Delete'] = [{
          'label': 'Remove Element',
          'function_call': self.adaptor.description.remove,
          'menu_icon': icon,
          'type': undefined,
          'params': [null, xml_node]
        }];
      }
      if($('> finalize, > update', xml_node).length > 0 && xml_node.get(0).tagName == 'call') {
        var icon =  self.elements.callmanipulate.illustrator.svg.clone();
        icon.children('.rfill:last').addClass('menu');
        menu['Delete'].push({
          'label': 'Remove Scripts',
          'function_call': self.adaptor.description.remove,
          'menu_icon': icon,
          'type': undefined,
          'params': ['> finalize, > update', xml_node]
        });
      }
      new CustomMenu(e).contextmenu(menu);
    }
    return false;
  } // }}}
  this.events.click = function(svgid, e) { // {{{
    if (self.adaptor.description.get_node_by_svg_id(svgid).length == 0) {
      return;
    }

    var visid = 'details';
    var tab   = $('#dat_' + visid);
        tab.empty();

    self.adaptor.illustrator.get_elements().removeClass('clicked');

    if (e && e.ctrlKey) {
      var vtarget = self.adaptor.illustrator.get_node_by_svg_id(svgid);
      if (vtarget.length > 0) {
        vtarget.parents('g.element[element-id]').toggleClass('marked');
      }
    } else {
      self.adaptor.illustrator.get_elements().removeClass('marked');

      var vtarget = self.adaptor.illustrator.get_node_by_svg_id(svgid);
      if (vtarget.length > 0) {
        vtarget.parents('g.element[element-id]').addClass('clicked');
      }

      var node  = self.adaptor.description.get_node_by_svg_id(svgid).get(0);

      if (self.adaptor.description.elements[$(node).attr('svg-type')]) {
        save[visid + '_target'] = { 'svgid': svgid, 'model': self.adaptor.description };
        save[visid] = new RelaxNGui(self.adaptor.description.elements[$(node).attr('svg-type')],tab,self.adaptor.description.context_eval);
        save[visid].content(node);
      }
    }
  } // }}}
  this.events.dblclick = function(svgid, e) { // {{{
  } // }}}
  this.events.mouseover = function(svgid, e) { // {{{
    $('.tile[element-id = "' + svgid + '"]').css('display','block');
    return false;
  } // }}}
  this.events.mouseout = function(svgid, e) { // {{{
    $('.tile[element-id = "' + svgid + '"]').css('display','none');
    return false;
  } // }}}
  this.events.dragstart = function (svgid, e) { //{{{
  } //}}}

  // other resources
  this.resources.arrow =  self.adaptor.theme_dir + 'symbols/arrow.svg';

  // Primitive Elements
  this.elements.call = { /*{{{*/
    'type': 'primitive',
    'illustrator': {//{{{
      'endnodes': 'this',
      'label': function(node){return $('label',$(node).children('parameters')).text().replace(/^['"]/,'').replace(/['"]$/,'')},
      'resolve_symbol': function(node) {
        if($(node).attr('endpoint').match(/^instantiation/)) {
          return 'callinstantiation';
        } else if($(node).attr('endpoint').match(/^correlation_send/)) {
          return 'callcorrelationsend';
        } else if($(node).attr('endpoint').match(/^correlation_receive/)) {
          return 'callcorrelationreceive';
        } else if($(node).attr('endpoint').match(/^worklist/) && $('finalize,update', node).length > 0) {
          return 'callmanipulateworklist';
        } else if($(node).attr('endpoint').match(/^worklist/)) {
          return 'callworklist';
        } else if($('parameters > service', node).length > 0) {
          return 'callinjection';
        } else if($('finalize,update', node).length > 0) {
          return 'callmanipulate';
        } else {
          return'call';
        }
      },
      'svg': self.adaptor.theme_dir + 'symbols/call.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/call.rng',
    'permissible_children': function(node,mode) { //{{{
      if(node.children('finalize,update').length < 1)
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
    'click': self.events.click,
    'dragstart': self.events.dragstart,
   }//}}}
  }; /*}}}*/
  this.elements.manipulate = { /*{{{*/
    'type': 'primitive',
    'illustrator': {//{{{
      'endnodes': 'this',
      'label': function(node){
        var lab = $(node).attr('label');
        if (lab) {
          return lab.replace(/^['"]/,'').replace(/['"]$/,'');
        }  else {
          return "";
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
    'click': self.events.click,
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
      'click': self.events.click,
    }//}}}
  }; /*}}}*/

  // Complex Elements
  this.elements.choose = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'label': function(node){return $(node).attr('mode') == 'exclusive' ? 'exclusive' : 'inclusive' },
      'endnodes': 'aggregate',
      'closeblock': false,
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
      if((node.children('otherwise').length == 0) && node.parents('parallel').length == node.parents('parallel_branch').length)
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
      'mousedown': function (node,e) {
        self.events.mousedown(node,e,true,true);
      },
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.otherwise = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'endnodes': 'passthrough',
      'closeblock': false,
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
      return [
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
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'type': 'critical',
         'params': [self.adaptor.description.elements.critical, node]}
      ];
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) {
        self.events.mousedown(node,e,true,false);
      },
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  }; /*}}}*/
  this.elements.alternative = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'label': function(node){return $(node).attr('condition')},
      'endnodes': 'passthrough',
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
      return [
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
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'type': 'critical',
         'params': [self.adaptor.description.elements.critical, node]}
      ];
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) {
        self.events.mousedown(node,e,true,false);
      },
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.loop = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'label': function(node){return  $(node).attr('condition') + ($(node).attr('mode') == 'pre_test' ? ' (⭱)' : ' (⭳)') },
      'endnodes': 'this',
      'closeblock': true,
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
        {'label': 'Manipulate',
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
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'type': 'critical',
         'params': [self.adaptor.description.elements.critical, node]}
      ];
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
      'mousedown': function (node,e) {
        self.events.mousedown(node,e,true,true);
      },
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.parallel = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'endnodes': 'this',
      'closeblock': false,
      'border': true,
      'expansion': function(node) {
        // check if any sibling other than 'parallel_branch' is present
        if($(node).children(':not(parallel_branch)').length > 0) return 'vertical';
        return 'horizontal';
      },
      'col_shift': function(node) {
        return true;
      },
      'svg': self.adaptor.theme_dir + 'symbols/parallel.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/parallel.rng',
    'permissible_children': function(node,mode) { //{{{
      var childs =  [
        {'label': 'Service Call with Scripts',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Manipulate',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Decision',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'type': 'critical',
         'params': [self.adaptor.description.elements.critical, node]},
        {'label': 'Parallel Branch',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.parallel_branch.illustrator.svg.clone(),
         'type': 'parallel_branch',
         'params': [self.adaptor.description.elements.parallel_branch, node]}
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
      'mousedown': function (node,e) {
        self.events.mousedown(node,e,true,true);
      },
      'click': self.events.click,
      'dblclick': self.events.dblclick,
      'mouseover': self.events.mouseover,
      'mouseout': self.events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.parallel_branch = { /*{{{*/
    'type': 'complex',
    'illustrator': {//{{{
      'endnodes': 'this',
      'closeblock': false,
      'expansion': function(node) {
        return 'vertical';
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
      var childs = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      childs =  [
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
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'type': 'critical',
         'params': [self.adaptor.description.elements.critical, node]},
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
      'mousedown': function (node,e) {
        self.events.mousedown(node,e,true,false);
      },
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
      return [
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
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'type': 'critical',
         'params': [self.adaptor.description.elements.critical, node]},
      ];
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) {
        self.events.mousedown(node,e,true,true);
      },
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
      'mousedown': function (node,e) {
        self.events.mousedown(node,e,true,true);
      },
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
      'closeblock': false,
      'expansion': function(node) {
        return 'vertical';
      },
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
      return [
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
        {'label': 'Script Task',
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
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'type': 'critical',
         'params': [self.adaptor.description.elements.critical, node]}
      ];
    }, //}}}
    'adaptor': {//{{{
      'mousedown': function (node,e) {
        self.events.mousedown(node,e,true,false);
      },
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
    'type': 'abstract',
    'parent': 'call',
    'description': self.adaptor.theme_dir + 'rngs/callmanipulate.rng',
    'illustrator': {//{{{
      'label': function(node){return $('label',$(node).children('parameters')).text().replace(/^['"]/,'').replace(/['"]$/,'')},
      'svg': self.adaptor.theme_dir + 'symbols/callmanipulate.svg'
    },//}}}
  }; /*}}}*/
  this.elements.choose_inclusive = { /*{{{*/
    'type': 'abstract',
    'parent': 'choose',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/choose_inclusive.svg'
    },//}}}
  };  /*}}}*/
  this.elements.choose_exclusive = { /*{{{*/
    'type': 'abstract',
    'parent': 'choose',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/choose_exclusive.svg'
    },//}}}
  };  /*}}}*/
  this.elements.scripts = { /*{{{*/
    'type': 'abstract',
    'description': [self.adaptor.theme_dir + 'rngs/update.rng',self.adaptor.theme_dir + 'rngs/finalize.rng']
  }; /*}}}*/
  this.elements.callinstantiation = { /*{{{*/
    'type': 'abstract',
    'parent': 'call',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/callinstantiation.svg'
    },//}}}
  };  /*}}}*/
  this.elements.callcorrelationsend = { /*{{{*/
    'type': 'abstract',
    'parent': 'call',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/callcorrelationsend.svg'
    },//}}}
  };  /*}}}*/
  this.elements.callcorrelationreceive = { /*{{{*/
    'type': 'abstract',
    'parent': 'call',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/callcorrelationreceive.svg'
    },//}}}
  };  /*}}}*/
  this.elements.callworklist = { /*{{{*/
    'type': 'abstract',
    'parent': 'call',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/callworklist.svg'
    },//}}}
  };  /*}}}*/
  this.elements.callmanipulateworklist = { /*{{{*/
    'type': 'abstract',
    'parent': 'call',
    'description': self.adaptor.theme_dir + 'rngs/callmanipulate.rng',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/callmanipulateworklist.svg'
    },//}}}
  };  /*}}}*/
}
