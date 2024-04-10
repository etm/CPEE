WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    var self = this;

    var contextMenuHandling = function(svgid,e,child,sibling) { //{{{
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
              let svgids = [];
              $(nodes).each(function(key,node){
                svgids.push($(node).attr('svg-id'));
              });
              svgids.sort((a,b) => {
                if (a > b) { return -1; }
                else if (a < b) { return 1; }
                else { return 0; }
              });
              svgids.forEach(svgid => {
                var target = self.adaptor.description.get_node_by_svg_id(svgid);
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
          'label': 'Remove Output Transformation',
          'function_call': self.adaptor.description.remove,
          'menu_icon': icon,
          'type': undefined,
          'params': ['> code', xml_node]
        });
      }
      new CustomMenu(e).contextmenu(menu);
    } //}}}

    this.elements.call = { /*{{{*/
      'type': 'primitive',
      'illustrator': {//{{{
        'endnodes': 'this',
        'label': function(node){
          var ret;
          if ($('> url',$(node).children('parameters').children('arguments')).length > 0) {
            ret = [ { column: 'Label', value: $('> label',$(node).children('parameters')).text().replace(/^['"]/,'').replace(/['"]$/,'') + ' <a target="_blank" href="' + $('> url',$(node).children('parameters').children('arguments')).text() + '/open"></a>' } ];
          } else {
            ret = [ { column: 'Label', value: $('> label',$(node).children('parameters')).text().replace(/^['"]/,'').replace(/['"]$/,'') } ];
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
           {'label': 'Output Transformation',
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
    this.elements.otherwise = { /*{{{*/
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
          {'label': 'Task with Output Transformation',
           'function_call': func,
           'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
           'type': 'callmanipulate',
           'params': [self.adaptor.description.elements.callmanipulate, node]},
          {'label': 'Task',
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
          var ret = [ { column: 'Label', value: $(node).attr('condition') } ];
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
          {'label': 'Task with Output Transformation',
           'function_call': func,
           'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
           'type': 'callmanipulate',
           'params': [self.adaptor.description.elements.callmanipulate, node]},
          {'label': 'Task',
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
          {'label': 'Task with Output Transformation',
           'function_call': func,
           'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
           'type': 'callmanipulate',
           'params': [self.adaptor.description.elements.callmanipulate, node]},
          {'label': 'Task',
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
          {'label': 'Task with Output Transformation',
           'function_call': func,
           'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
           'type': 'callmanipulate',
           'params': [self.adaptor.description.elements.callmanipulate, node]},
          {'label': 'Task',
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
          {'label': 'Task with Output Transformation',
           'function_call': func,
           'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
           'type': 'callmanipulate',
           'params': [self.adaptor.description.elements.callmanipulate, node]},
          {'label': 'Task',
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
          {'label': 'Task with Output Transformation',
           'function_call': func,
           'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
           'type': 'callmanipulate',
           'params': [self.adaptor.description.elements.callmanipulate, node]},
          {'label': 'Task',
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
    this.elements.start = this.elements.description = { /*{{{*/
      'type': 'description',
      'illustrator': {//{{{
        'endnodes': 'passthrough',
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
          {'label': 'Task with Output Transformation',
           'function_call': func,
           'menu_icon': self.elements.callmanipulate.illustrator.svg.clone(),
           'type': 'callmanipulate',
           'params': [self.adaptor.description.elements.callmanipulate, node]},
          {'label': 'Task',
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
  }
}
