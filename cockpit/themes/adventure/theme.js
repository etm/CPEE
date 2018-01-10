function WFAdaptorManifestation(adaptor) {
  var self = this;

  this.adaptor = adaptor;
  this.elements = {};
  this.events = {};
  this.compact = true;

  this.noarrow = ['alternative', 'otherwise'];
  this.source = function(rng) {
    $('#relaxngworker').empty();
    var rngw = new RelaxNGui(rng,$('#relaxngworker'),self.adaptor.description.context_eval);
    return $(rngw.save().documentElement);
  };

  // Events
  this.events.mousedown = function(svgid, e, child, sibling) { // {{{
    if(e.button == 0) {  // left-click
    } else if(e.button == 1) { // middle-click
    } else if(e.button == 2) { // right-click
      var xml_node = self.adaptor.description.get_node_by_svg_id(svgid);
      var group = null;
      var menu = {};

      if (child) {
        group = self.elements[xml_node.get(0).tagName].permissible_children(xml_node);
        if(group.length > 0) menu['Insert into'] = group;
      }
      if (sibling) {
        group = self.elements[xml_node.parent().get(0).tagName].permissible_children(xml_node);
        if(group.length > 0) menu['Insert after'] = group;
      }

      if(xml_node.get(0).tagName != 'description' && !self.elements[xml_node.get(0).tagName].neverdelete) {
        var icon =  self.elements[xml_node.get(0).tagName].illustrator.svg.clone();
        icon.children('.rfill').css({'fill':'#ff7f7f','fill-opacity':'1'});
        menu['Delete'] = [{
          'label': 'Remove Element',
          'function_call': self.adaptor.description.remove,
          'menu_icon': icon,
          'params': [null, xml_node]
        }];
      }
      if($('> finalize, > update', xml_node).length > 0 && xml_node.get(0).tagName == 'call') {
        var icon =  self.elements.callmanipulate.illustrator.svg.clone();
        icon.children('.rfill:last').css({'fill':'#ff7f7f','fill-opacity':'1'});
        menu['Delete'].push({
          'label': 'Remove Scripts',
          'function_call': self.adaptor.description.remove,
          'menu_icon': icon,
          'params': ['> finalize, > update', xml_node]
        });
      }
      new CustomMenu(e).contextmenu(menu);
    }
    return false;
  } // }}}
  this.events.click = function(svgid) { // {{{
    var visid = 'details';
    var tab   = $('#dat_' + visid);
        tab.empty();

    if (self.adaptor.description.get_node_by_svg_id(svgid).length == 0) {
      return;
    }
    self.adaptor.illustrator.get_nodes().removeClass('clicked');

    var vtarget = self.adaptor.illustrator.get_node_by_svg_id(svgid);
    if (vtarget.length > 0) {
      vtarget.addClass('clicked');
    }

    if ($('#state').text() != 'finished')
      $('#main ui-behind button').show();
    if ($('#main ui-behind button').hasClass('highlight')) {
      var check = confirm("Discard changes?");
      if (check)
        $('#main ui-behind button').removeClass('highlight');
      else
        return;
    }

    var node  = self.adaptor.description.get_node_by_svg_id(svgid).get(0);

    if (self.adaptor.description.elements[$(node).attr('svg-type')]) {
      save[visid + '_target'] = { 'svgid': svgid, 'model': self.adaptor.description };
      save[visid] = new RelaxNGui(self.adaptor.description.elements[$(node).attr('svg-type')],tab,self.adaptor.description.context_eval);
      save[visid].content(node);
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

  // Primitive Elements
  this.elements.call = { /*{{{*/
    'type' : 'primitive',
    'illustrator': {//{{{
      'endnodes' : 'this',
      'resolve_symbol' : function(node) {
        if($(node).attr('endpoint') == 'instantiation') {
          return 'callinstantiation';
        } else if($(node).attr('endpoint') == 'correlation') {
          return 'callcorrelation';
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
    'permissible_children': function(node) { //{{{
      if(node.children('finalize,update').length < 1)
        return [
         {'label': 'Scripts',
          'function_call': self.adaptor.description.insert_last_into,
          'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
          'params': [self.adaptor.description.elements.scripts, node]}
        ];
      return [];
    }, //}}}
  'adaptor' : {//{{{
    'mousedown': function (node,e) { self.events.mousedown(node,e,true,true); },
    'click': self.events.click,
    'dragstart': self.events.dragstart,
   }//}}}
  }; /*}}}*/
  this.elements.manipulate = { /*{{{*/
    'type' : 'primitive',
    'illustrator': {//{{{
      'endnodes' : 'this',
      'svg': self.adaptor.theme_dir + 'symbols/manipulate.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/manipulate.rng',
    'permissible_children': function(node) { //{{{
      return [];
    }, //}}}
  'adaptor' : {//{{{
    'mousedown': function (node,e) { self.events.mousedown(node,e,false,true); },
    'click': self.events.click,
   }//}}}
  }; /*}}}*/
  this.elements.escape = { /*{{{*/
    'type' : 'primitive',
    'illustrator': {//{{{
      'endnodes' : 'this',
      'svg': self.adaptor.theme_dir + 'symbols/escape.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/escape.rng',
    'permissible_children': function(node) { //{{{
      return [];
    }, //}}}
    'adaptor' : {//{{{
      'mousedown': function (node,e) { self.events.mousedown(node,e,false,true); },
      'click': self.events.click,
    }//}}}
  }; /*}}}*/

  // Complex Elements
  this.elements.choose = { /*{{{*/
    'type' : 'complex',
    'illustrator': {//{{{
      'endnodes' : 'aggregate',
      'closeblock': false,
      'expansion' : function(node) {
        return 'horizontal';
      },
      'resolve_symbol' : function(node) {
        if($(node).attr('mode') == 'exclusive') {
          return 'choose_exclusive';
        } else {
          return 'choose_inclusive';
        }
      },
      'col_shift' : function(node) {
        return false;
      },
      'svg': self.adaptor.theme_dir + 'symbols/choose.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/choose.rng',
    'permissible_children': function(node) { //{{{
      var func = null;
      if(node.get(0).tagName == 'choose') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      if(node.children('parallel_branch').length > 0) {
        return [{'label': 'Parallel Branch',
         'function_call': func,
         'menu_icon': self.elements.parallel_branch.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.parallel_branch, node]}];
      }
      var childs = [{'label': 'Alternative',
       'function_call': func,
       'menu_icon': self.elements.alternative.illustrator.svg.clone(),
       'params': [self.adaptor.description.elements.alternative, node]}];
      if((node.children('otherwise').length == 0) && node.parents('parallel').length == node.parents('parallel_branch').length)
        childs.push({'label': 'Otherwise',
         'function_call': func,
         'menu_icon': self.elements.otherwise.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.otherwise, node]});
      if(node.parents('parallel').length > node.parents('parallel_branch').length)
        childs.push({'label': 'Parallel Branch',
         'function_call': func,
         'menu_icon': self.elements.parallel_branch.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.parallel_branch, node]});
      return childs;
    }, //}}}
    'adaptor' : {//{{{
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
    'type' : 'complex',
    'illustrator': {//{{{
      'endnodes' : 'passthrough',
      'closeblock': false,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return false;
      },
      'svg': self.adaptor.theme_dir + 'symbols/otherwise.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/otherwise.rng',
    'neverdelete': true,
    'permissible_children': function(node) { //{{{
      var func = null;
      var childs = null;
      if(node.get(0).tagName == 'otherwise') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      return [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.elements.parallel.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.critical, node]}
      ];
    }, //}}}
    'adaptor' : {//{{{
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
    'type' : 'complex',
    'illustrator': {//{{{
      'endnodes' : 'passthrough',
      'closeblock':false,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return false;
      },
      'svg': self.adaptor.theme_dir + 'symbols/alternative.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/alternative.rng',
    'permissible_children': function(node) { //{{{
      if(node.get(0).tagName == 'alternative') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      if(node.parents('parallel').length > node.parents('parallel_branch').length && node.get(0).tagName == 'alternative') {
        return [{'label': 'Parallel Branch',
         'function_call': func,
         'menu_icon': self.elements.parallel_branch.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.parallel_branch, node]}];
      }
      return [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.elements.parallel.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.critical, node]}
      ];
    }, //}}}
    'adaptor' : {//{{{
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
    'type' : 'complex',
    'illustrator': {//{{{
      'endnodes' : 'this',
      'closeblock' : true,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg': self.adaptor.theme_dir + 'symbols/loop.svg'
    },// }}}
    'description': self.adaptor.theme_dir + 'rngs/loop.rng',
    'permissible_children': function(node) { //{{{
      var func = null;
      if(node.get(0).tagName == 'loop') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Manipulate',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.critical, node]}
      ];
      if(node.parent('parallel').length > node.parent('parallel_branch').length) {
        childs.push({'label': 'Parallel Branch',
                     'function_call': func,
                     'menu_icon': self.elements.parallel_branch.illustrator.svg.clone(),
                     'params': [self.adaptor.description.elements.parallel_branch, node]}
                    );
      } else {
        childs.push({'label': 'Parallel',
                     'function_call': func,
                     'menu_icon': self.elements.parallel.illustrator.svg.clone(),
                     'params': [self.adaptor.description.elements.parallel, node]}
                    );
      }
      return childs;
    }, //}}}
    'adaptor' : {//{{{
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
    'type' : 'complex',
    'illustrator': {//{{{
      'endnodes' : 'this',
      'closeblock' : false,
      'border': true,
      'expansion' : function(node) {
        // check if any sibling other than 'parallel_branch' is present
        if($(node).children(':not(parallel_branch)').length > 0) return 'vertical';
        return 'horizontal';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg': self.adaptor.theme_dir + 'symbols/parallel.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/parallel.rng',
    'permissible_children': function(node) { //{{{
      var childs =  [
        {'label': 'Service Call with Scripts',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Manipulate',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Decision',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.critical, node]},
        {'label': 'Parallel Branch',
         'function_call': self.adaptor.description.insert_last_into,
         'menu_icon': self.elements.parallel_branch.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.parallel_branch, node]}
      ];
      if(node.get(0).tagName != 'parallel')
        childs.push({'label': 'Parallel',
           'function_call': self.adaptor.description.insert_last_into,
           'menu_icon': self.elements.parallel.illustrator.svg.clone(),
           'params': [self.adaptor.description.elements.parallel, node]});
      return childs;
    }, //}}}
    'adaptor' : {//{{{
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
    'type' : 'complex',
    'illustrator': {//{{{
      'endnodes' : 'this',
      'closeblock' : false,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        if(node.parentNode.tagName == 'choose') return false;
        if($(node).parents('parallel').first().children(':not(parallel_branch)').length > 0) return true;
        return false;
      },
      'svg': self.adaptor.theme_dir + 'symbols/parallel_branch.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/parallel_branch.rng',
    'permissible_children': function(node) { //{{{
      var func = null;
      var childs = null;
      if(node.get(0).tagName == 'parallel_branch') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      childs =  [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.elements.parallel.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.critical, node]},
      ];
      if(node.parents('choose').length > node.parents('alternative, otherwise').length && node.get(0).tagName == 'parallel_branch') {
        return [{'label': 'Alternative',
         'function_call': func,
         'menu_icon': self.elements.alternative.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.alternative, node]}];
      }
      return childs;
    }, //}}}
    'adaptor' : {//{{{
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
    'type' : 'complex',
    'illustrator': {//{{{
      'endnodes' : 'aggregate',
      'closeblock' : false,
      'border': true,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg': self.adaptor.theme_dir + 'symbols/critical.svg'
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/critical.rng',
    'permissible_children': function(node) { //{{{
      var func = null;
      if(node.get(0).tagName == 'critical') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      return [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.elements.parallel.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.critical, node]},
      ];
    }, //}}}
    'adaptor' : {//{{{
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
    'type' : 'complex',
    'illustrator': {//{{{
      'endnodes' : 'aggregate',
      'closeblock' : false,
      'border': 'injectiongroup', // other value than true,false inidcates the used class for the svg-object
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg': null
    },//}}}
    'description': self.adaptor.theme_dir + 'rngs/group.rng',
    'permissible_children': function(node) { //{{{
      var func = null;
      if(node.get(0).tagName == 'group') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      return [
      ];
    }, //}}}
    'adaptor' : {//{{{
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
    'type' : 'description',
    'illustrator': {//{{{
      'endnodes' : 'passthrough',
      'closeblock' : false,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg': self.adaptor.theme_dir + 'symbols/start.svg'
    },//}}}
    'description': null,
    'permissible_children': function(node) { //{{{
      var func = null;
      if(node.get(0).tagName == 'description') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      return [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': self.elements.call.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script Task',
         'function_call': func,
         'menu_icon': self.elements.manipulate.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.elements.parallel.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.elements.choose.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.elements.loop.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.elements.critical.illustrator.svg.clone(),
         'params': [self.adaptor.description.elements.critical, node]}
      ];
    }, //}}}
    'adaptor' : {//{{{
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
    'type'  : 'abstract',
    'parent': 'call',
    'description': self.adaptor.theme_dir + 'rngs/callmanipulate.rng',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/callmanipulate.svg'
    },//}}}
  }; /*}}}*/
  this.elements.choose_inclusive = { /*{{{*/
    'type'  : 'abstract',
    'parent': 'choose',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/choose_inclusive.svg'
    },//}}}
  };  /*}}}*/
  this.elements.choose_exclusive = { /*{{{*/
    'type' : 'abstract',
    'parent': 'choose',
    'illustrator': {//{{{
      'svg': self.adaptor.theme_dir + 'symbols/choose_exclusive.svg'
    },//}}}
  };  /*}}}*/
  this.elements.scripts = { /*{{{*/
    'type' : 'abstract',
    'description': [self.adaptor.theme_dir + 'rngs/update.rng',self.adaptor.theme_dir + 'rngs/finalize.rng']
  }; /*}}}*/
}
