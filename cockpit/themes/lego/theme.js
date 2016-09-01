function WFAdaptorManifestation(adaptor) {
  this.adaptor = adaptor;
  this.elements = elements = {};
  this.events = events = {};

  this.noarrow = noarrow = ['alternative', 'otherwise'];
  this.description_extract = function(rng) {
    return new RelaxNGui(rng,null).example();
  }

  // Events
  this.events.mousedown = function(svgid, e, child, sibling) { // {{{
    if(e.button == 0) {  // left-click
    } else if(e.button == 1) { // middle-click
    } else if(e.button == 2) { // right-click
      var xml_node = adaptor.description.get_node_by_svg_id(svgid);
      var group = null;
      var menu = {};

      if(child) {
        group = elements[xml_node.get(0).tagName].permissible_children(xml_node);
        if(group.length > 0) menu['Insert into'] = group;
      }
      if(sibling) {
        group = elements[xml_node.parent().get(0).tagName].permissible_children(xml_node);
        if(group.length > 0) menu['Insert after'] = group;
      }

      if(xml_node.get(0).tagName != 'description' && !elements[xml_node.get(0).tagName].neverdelete)
        menu['Remove Element'] = [{'label': 'Actual Element',
                        'function_call': adaptor.description.remove,
                        'menu_icon': function() {
                          var icon =  elements[xml_node.get(0).tagName].illustrator.svg();
                          icon.children('.rfill').css({'fill':'red','fill-opacity':'0.5'});
                          return icon;
                        },
                        'params': [null, xml_node]}];
      if($('> manipulate', xml_node).length > 0 && xml_node.get(0).tagName == 'call') {
        menu['Remove Element'].push({'label': 'Remove Scripts',
                        'function_call': adaptor.description.remove,
                        'menu_icon': function() {
                          var icon =  elements.callmanipulate.illustrator.svg();
                          icon.children('.rfill:last').css({'fill':'red','fill-opacity':'0.5'});
                          return icon;
                        },
                        'params': ['> manipulate', xml_node]});
      }
      new CustomMenu(e).contextmenu(menu);
    }
    return false;
  } // }}}
  this.events.click = function(svgid, e) { // {{{
    if (adaptor.description.get_node_by_svg_id(svgid).length == 0) {
      return;
    }

    if ($('#state').text() != 'finished')
      $('#main .tabbehind button').show();
    if ($('#main .tabbehind button').hasClass('highlight')) {
      var check = confirm("Discard changes?");
      if (check)
        $('#main .tabbehind button').removeClass('highlight');
      else
        return;
    }

    var visid = 'details';
    var tab   = $('#dat_' + visid);
    var node  = adaptor.description.get_node_by_svg_id(svgid).get(0);

    tab.empty();
    $.ajax({
      type: "GET",
      url: adaptor.theme_dir + "rngs/" + node.nodeName + ".rng",
      success: function(rng){
        save['details'] = new RelaxNGui(rng,tab);
        save['details'].content(node,adaptor.description.context_eval);
      }
    });
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

  // Abstract Elements (they only have an illustrator)
  this.elements.callmanipulate = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'abstract',
      'svg': adaptor.theme_dir + 'symbols/callmanipulate.svg'
    },//}}}
  }; /*}}}*/
  this.elements.choose_inclusive = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'abstract',
      'svg': adaptor.theme_dir + 'symbols/choose_inclusive.svg'
    },//}}}
  };  /*}}}*/
  this.elements.choose_exclusive = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'abstract',
      'svg': adaptor.theme_dir + 'symbols/choose_exclusive.svg'
    },//}}}
  };  /*}}}*/
  this.elements.callassline = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'abstract',
      'svg': adaptor.theme_dir + 'symbols/lego.svg'
    },//}}}
  };  /*}}}*/

  // Primitive Elements
  this.elements.call = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'primitive',
      'endnodes' : 'this',
      'resolve_symbol' : function(node) {
        if($(node).attr('endpoint') == 'instantiation') {
          return 'callinstantiation';
        } else if($(node).attr('endpoint') == 'assline') {
          return 'callassline';
        } else if($('parameters > service', node).length > 0) {
          return 'callinjection';
        } else if($('finalize,update', node).length > 0) {
          return 'callmanipulate';
        } else {
          return'call';
        }
      },
      'svg': adaptor.theme_dir + 'symbols/call.svg'
    },//}}}
    'description': '<call id="###" endpoint="" xmlns="http://cpee.org/ns/description/1.0"><parameters xmlns="http://cpee.org/ns/description/1.0"><label>""</label><method>:post</method><parameters/></parameters></call>',
    'permissible_children': function(node) { //{{{
      if(node.children('finalize,update').length < 1)
        return [
         {'label': 'Scripts',
          'function_call': adaptor.description.insert_last_into,
          'menu_icon': elements.callmanipulate.illustrator.svg,
          'params': [adaptor.description.elements.scripts, node]}
        ];
      return [];
    }, //}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) { events.mousedown(node,e,true, true); },
    'click': events.click,
    'dragstart': events.dragstart,
   }//}}}
  }; /*}}}*/
  this.elements.scripts = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'primitive',
      'endnodes' : 'this',
      'svg': adaptor.theme_dir + 'symbols/scripts.svg'
    },//}}}
    'description': ['<finalize xmlns="http://cpee.org/ns/description/1.0"/>','<update xmlns="http://cpee.org/ns/description/1.0"/>'],
    'permissible_children': function(node) { //{{{
      return [];
    }, //}}}
    'adaptor': { //{{{
      'mousedown': function (node, e) { events.mousedown(node,e,false, true); },
      'click': events.click,
    } //}}}
  }; /*}}}*/
  this.elements.manipulate = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'primitive',
      'endnodes' : 'this',
      'svg': adaptor.theme_dir + 'symbols/manipulate.svg'
    },//}}}
    'description': '<manipulate id="###" xmlns="http://cpee.org/ns/description/1.0"/>',
    'permissible_children': function(node) { //{{{
      return [];
    }, //}}}
  'adaptor' : {//{{{
    'mousedown': function (node, e) { events.mousedown(node,e,false, true); },
    'click': events.click,
   }//}}}
  }; /*}}}*/
  this.elements.escape = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'primitive',
      'endnodes' : 'this',
      'svg': adaptor.theme_dir + 'symbols/escape.svg'
    },//}}}
    'description': '<escape xmlns="http://cpee.org/ns/description/1.0"/>',
    'permissible_children': function(node) { //{{{
      return [];
    }, //}}}
    'adaptor' : {//{{{
      'mousedown': function (node, e) { events.mousedown(node,e,false, true); },
      'click': events.click,
    }//}}}
  }; /*}}}*/

  // Complex Elements
  this.elements.choose = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
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
      'svg': adaptor.theme_dir + 'symbols/choose.svg'
    },//}}}
    'description': '<choose mode="exclusive" xmlns="http://cpee.org/ns/description/1.0"><otherwise/></choose>',
    'permissible_children': function(node) { //{{{
      var func = null;
      if(node.get(0).tagName == 'choose') { func = adaptor.description.insert_first_into }
      else { func = adaptor.description.insert_after }
      if(node.children('parallel_branch').length > 0) {
        return [{'label': 'Parallel Branch',
         'function_call': func,
         'menu_icon': elements.parallel_branch.illustrator.svg,
         'params': [adaptor.description.elements.parallel_branch, node]}];
      }
      var childs = [{'label': 'Alternative',
       'function_call': func,
       'menu_icon': elements.alternative.illustrator.svg,
       'params': [adaptor.description.elements.alternative, node]}];
      if((node.children('otherwise').length == 0) && node.parents('parallel').length == node.parents('parallel_branch').length)
        childs.push({'label': 'Otherwise',
         'function_call': func,
         'menu_icon': elements.otherwise.illustrator.svg,
         'params': [adaptor.description.elements.otherwise, node]});
      if(node.parents('parallel').length > node.parents('parallel_branch').length)
        childs.push({'label': 'Parallel Branch',
         'function_call': func,
         'menu_icon': elements.parallel_branch.illustrator.svg,
         'params': [adaptor.description.elements.parallel_branch, node]});
      return childs;
    }, //}}}
    'adaptor' : {//{{{
      'mousedown': function (node, e) {
        events.mousedown(node,e,true, true);
      },
      'click': events.click,
      'dblclick': events.dblclick,
      'mouseover': events.mouseover,
      'mouseout': events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.otherwise = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'passthrough',
      'closeblock': false,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return false;
      },
      'svg': adaptor.theme_dir + 'symbols/otherwise.svg'
    },//}}}
    'description': '<otherwise xmlns="http://cpee.org/ns/description/1.0"/>',
    'neverdelete': true,
    'permissible_children': function(node) { //{{{
      var func = null;
      var childs = null;
      if(node.get(0).tagName == 'otherwise') { func = adaptor.description.insert_first_into }
      else { func = adaptor.description.insert_after }
      return [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': elements.callmanipulate.illustrator.svg,
         'params': [adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': elements.call.illustrator.svg,
         'params': [adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': elements.manipulate.illustrator.svg,
         'params': [adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': elements.parallel.illustrator.svg,
         'params': [adaptor.description.elements.parallel, node]},
        {'label': 'Choose',
         'function_call': func,
         'menu_icon': elements.choose.illustrator.svg,
         'params': [adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': elements.loop.illustrator.svg,
         'params': [adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': elements.critical.illustrator.svg,
         'params': [adaptor.description.elements.critical, node]}
      ];
    }, //}}}
    'adaptor' : {//{{{
      'mousedown': function (node, e) {
        events.mousedown(node,e,true, false);
      },
      'click': events.click,
      'dblclick': events.dblclick,
      'mouseover': events.mouseover,
      'mouseout': events.mouseout,
    }//}}}
  }; /*}}}*/
  this.elements.alternative = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'passthrough',
      'closeblock':false,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return false;
      },
      'svg': adaptor.theme_dir + 'symbols/alternative.svg'
    },//}}}
    'description': '<alternative condition="" xmlns="http://cpee.org/ns/description/1.0"/>',
    'permissible_children': function(node) { //{{{
      if(node.get(0).tagName == 'alternative') { func = adaptor.description.insert_first_into }
      else { func = adaptor.description.insert_after }
      if(node.parents('parallel').length > node.parents('parallel_branch').length && node.get(0).tagName == 'alternative') {
        return [{'label': 'Parallel Branch',
         'function_call': func,
         'menu_icon': elements.parallel_branch.illustrator.svg,
         'params': [adaptor.description.elements.parallel_branch, node]}];
      }
      return [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': elements.callmanipulate.illustrator.svg,
         'params': [adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': elements.call.illustrator.svg,
         'params': [adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': elements.manipulate.illustrator.svg,
         'params': [adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': elements.parallel.illustrator.svg,
         'params': [adaptor.description.elements.parallel, node]},
        {'label': 'Choose',
         'function_call': func,
         'menu_icon': elements.choose.illustrator.svg,
         'params': [adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': elements.loop.illustrator.svg,
         'params': [adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': elements.critical.illustrator.svg,
         'params': [adaptor.description.elements.critical, node]}
      ];
    }, //}}}
    'adaptor' : {//{{{
      'mousedown': function (node, e) {
        events.mousedown(node,e,true, false);
      },
      'click': events.click,
      'dblclick': events.dblclick,
      'mouseover': events.mouseover,
      'mouseout': events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.loop = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'this',
      'closeblock' : true,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg': adaptor.theme_dir + 'symbols/loop.svg'
    },// }}}
    'description': '<loop pre_test="" xmlns="http://cpee.org/ns/description/1.0"/>',
    'permissible_children': function(node) { //{{{
      var func = null;
      if(node.get(0).tagName == 'loop') { func = adaptor.description.insert_first_into }
      else { func = adaptor.description.insert_after }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': elements.callmanipulate.illustrator.svg,
         'params': [adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': elements.call.illustrator.svg,
         'params': [adaptor.description.elements.call, node]},
        {'label': 'Manipulate',
         'function_call': func,
         'menu_icon': elements.manipulate.illustrator.svg,
         'params': [adaptor.description.elements.manipulate, node]},
        {'label': 'Choose',
         'function_call': func,
         'menu_icon': elements.choose.illustrator.svg,
         'params': [adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': elements.loop.illustrator.svg,
         'params': [adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': elements.critical.illustrator.svg,
         'params': [adaptor.description.elements.critical, node]}
      ];
      if(node.parent('parallel').length > node.parent('parallel_branch').length) {
        childs.push({'label': 'Parallel Branch',
                     'function_call': func,
                     'menu_icon': elements.parallel_branch.illustrator.svg,
                     'params': [adaptor.description.elements.parallel_branch, node]}
                    );
      } else {
        childs.push({'label': 'Parallel',
                     'function_call': func,
                     'menu_icon': elements.parallel.illustrator.svg,
                     'params': [adaptor.description.elements.parallel, node]}
                    );
      }
      return childs;
    }, //}}}
    'adaptor' : {//{{{
      'mousedown': function (node, e) {
        events.mousedown(node,e,true, true);
      },
      'click': events.click,
      'dblclick': events.dblclick,
      'mouseover': events.mouseover,
      'mouseout': events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.parallel = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
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
      'svg': adaptor.theme_dir + 'symbols/parallel.svg'
    },//}}}
    'description': '<parallel xmlns="http://cpee.org/ns/description/1.0"/>',
    'permissible_children': function(node) { //{{{
      var childs =  [
        {'label': 'Service Call with Scripts',
         'function_call': adaptor.description.insert_last_into,
         'menu_icon': elements.callmanipulate.illustrator.svg,
         'params': [adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': adaptor.description.insert_last_into,
         'menu_icon': elements.call.illustrator.svg,
         'params': [adaptor.description.elements.call, node]},
        {'label': 'Manipulate',
         'function_call': adaptor.description.insert_last_into,
         'menu_icon': elements.manipulate.illustrator.svg,
         'params': [adaptor.description.elements.manipulate, node]},
        {'label': 'Choose',
         'function_call': adaptor.description.insert_last_into,
         'menu_icon': elements.choose.illustrator.svg,
         'params': [adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': adaptor.description.insert_last_into,
         'menu_icon': elements.loop.illustrator.svg,
         'params': [adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': adaptor.description.insert_last_into,
         'menu_icon': elements.critical.illustrator.svg,
         'params': [adaptor.description.elements.critical, node]},
        {'label': 'Parallel Branch',
         'function_call': adaptor.description.insert_last_into,
         'menu_icon': elements.parallel_branch.illustrator.svg,
         'params': [adaptor.description.elements.parallel_branch, node]}
      ];
      if(node.get(0).tagName != 'parallel')
        childs.push({'label': 'Parallel',
           'function_call': adaptor.description.insert_last_into,
           'menu_icon': elements.parallel.illustrator.svg,
           'params': [adaptor.description.elements.parallel, node]});
      return childs;
    }, //}}}
    'adaptor' : {//{{{
      'mousedown': function (node, e) {
        events.mousedown(node,e,true, true);
      },
      'click': events.click,
      'dblclick': events.dblclick,
      'mouseover': events.mouseover,
      'mouseout': events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.parallel_branch = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
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
      'svg': adaptor.theme_dir + 'symbols/parallel_branch.svg'
    },//}}}
    'description': '<parallel_branch xmlns="http://cpee.org/ns/description/1.0"/>',
    'permissible_children': function(node) { //{{{
      var func = null;
      var childs = null;
      if(node.get(0).tagName == 'parallel_branch') { func = adaptor.description.insert_first_into }
      else { func = adaptor.description.insert_after }
      childs =  [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': elements.callmanipulate.illustrator.svg,
         'params': [adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': elements.call.illustrator.svg,
         'params': [adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': elements.manipulate.illustrator.svg,
         'params': [adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': elements.parallel.illustrator.svg,
         'params': [adaptor.description.elements.parallel, node]},
        {'label': 'Choose',
         'function_call': func,
         'menu_icon': elements.choose.illustrator.svg,
         'params': [adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': elements.loop.illustrator.svg,
         'params': [adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': elements.critical.illustrator.svg,
         'params': [adaptor.description.elements.critical, node]},
      ];
      if(node.parents('choose').length > node.parents('alternative, otherwise').length && node.get(0).tagName == 'parallel_branch') {
        return [{'label': 'Alternative',
         'function_call': func,
         'menu_icon': elements.alternative.illustrator.svg,
         'params': [adaptor.description.elements.alternative, node]}];
      }
      return childs;
    }, //}}}
    'adaptor' : {//{{{
      'mousedown': function (node, e) {
        events.mousedown(node,e,true, false);
      },
      'click': events.click,
      'dblclick': events.dblclick,
      'mouseover': events.mouseover,
      'mouseout': events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.critical = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
      'endnodes' : 'aggregate',
      'closeblock' : false,
      'border': true,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg': adaptor.theme_dir + 'symbols/critical.svg'
    },//}}}
    'description': '<critical sid="section" xmlns="http://cpee.org/ns/description/1.0"/>',
    'permissible_children': function(node) { //{{{
      var func = null;
      if(node.get(0).tagName == 'critical') { func = adaptor.description.insert_first_into }
      else { func = adaptor.description.insert_after }
      return [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': elements.callmanipulate.illustrator.svg,
         'params': [adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': elements.call.illustrator.svg,
         'params': [adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': elements.manipulate.illustrator.svg,
         'params': [adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': elements.parallel.illustrator.svg,
         'params': [adaptor.description.elements.parallel, node]},
        {'label': 'Choose',
         'function_call': func,
         'menu_icon': elements.choose.illustrator.svg,
         'params': [adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': elements.loop.illustrator.svg,
         'params': [adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': elements.critical.illustrator.svg,
         'params': [adaptor.description.elements.critical, node]},
      ];
    }, //}}}
    'adaptor' : {//{{{
      'mousedown': function (node, e) {
        events.mousedown(node,e,true, true);
      },
      'click': events.click,
      'dblclick': events.dblclick,
      'mouseover': events.mouseover,
      'mouseout': events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.group = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'complex',
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
    'description': '<group xmlns="http://cpee.org/ns/description/1.0"/>',
    'permissible_children': function(node) { //{{{
      var func = null;
      if(node.get(0).tagName == 'group') { func = adaptor.description.insert_first_into }
      else { func = adaptor.description.insert_after }
      return [
      ];
    }, //}}}
    'adaptor' : {//{{{
      'mousedown': function (node, e) {
        events.mousedown(node,e,true, true);
      },
      'click': events.click,
      'dblclick': events.dblclick,
      'mouseover': events.mouseover,
      'mouseout': events.mouseout,
    }//}}}
  };  /*}}}*/
  this.elements.start = this.elements.description = { /*{{{*/
    'illustrator': {//{{{
      'type' : 'description',
      'endnodes' : 'passthrough',
      'closeblock' : false,
      'expansion' : function(node) {
        return 'vertical';
      },
      'col_shift' : function(node) {
        return true;
      },
      'svg': adaptor.theme_dir + 'symbols/start.svg'
    },//}}}
    'description': null,
    'permissible_children': function(node) { //{{{
      var func = null;
      if(node.get(0).tagName == 'description') { func = adaptor.description.insert_first_into }
      else { func = adaptor.description.insert_after }
      return [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': elements.callmanipulate.illustrator.svg,
         'params': [adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': elements.call.illustrator.svg,
         'params': [adaptor.description.elements.call, node]},
        {'label': 'Script Task',
         'function_call': func,
         'menu_icon': elements.manipulate.illustrator.svg,
         'params': [adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': elements.parallel.illustrator.svg,
         'params': [adaptor.description.elements.parallel, node]},
        {'label': 'Choose',
         'function_call': func,
         'menu_icon': elements.choose.illustrator.svg,
         'params': [adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': elements.loop.illustrator.svg,
         'params': [adaptor.description.elements.loop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': elements.critical.illustrator.svg,
         'params': [adaptor.description.elements.critical, node]}
      ];
    }, //}}}
    'adaptor' : {//{{{
      'mousedown': function (node, e) {
        events.mousedown(node,e,true, false);
      },
      'click': events.click,
      'dblclick': events.dblclick,
      'mouseover': events.mouseover,
      'mouseout': events.mouseout,
    }//}}}
  }; /*}}}*/
}
