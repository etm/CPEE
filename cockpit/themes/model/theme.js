WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    var self = this;
    this.compact = true;
    this.rotated_labels = false;

    this.contextMenuHandling = function(svgid,e,child,sibling) { //{{{
      if (save['state'] != "ready" && save['state'] != "stopped") { return false; }

      var xml_node = self.adaptor.description.get_node_by_svg_id(svgid);
      var group = null;
      var menu = {};

      if (child) {
        group = self.elements[xml_node.get(0).tagName].permissible_children(xml_node,'into');
        if(group.length > 0) {
          menu['Insert into'] = group;
          self.copyOrMove(menu['Insert into'],group,xml_node,self.adaptor.description.insert_first_into);
        }
        if (self.elements[xml_node.get(0).tagName].permissible_children_expert) {
          group = self.elements[xml_node.get(0).tagName].permissible_children_expert(xml_node,'into');
          if(group.length > 0) {
            menu['Insert into (Experts Only!)'] = group;
            self.copyOrMove(menu['Insert into (Experts Only!)'],group,xml_node,self.adaptor.description.insert_first_into);
          }
        }
      }
      if (sibling) {
        group = self.elements[xml_node.parent().get(0).tagName].permissible_children(xml_node,'after');
        if(group.length > 0) {
          menu['Insert after'] = group;
          self.copyOrMove(menu['Insert after'],group,xml_node,self.adaptor.description.insert_after);
        }
        if (self.elements[xml_node.parent().get(0).tagName].permissible_children_expert) {
          group = self.elements[xml_node.parent().get(0).tagName].permissible_children_expert(xml_node,'after');
          if(group.length > 0) {
            menu['Insert after (Experts Only!)'] = group;
            self.copyOrMove(menu['Insert after (Experts Only!)'],group,xml_node,self.adaptor.description.insert_after);
          }
        }
      }

      if(xml_node.get(0).tagName != 'description' && !self.elements[xml_node.get(0).tagName].neverdelete) {
        var icon = self.contextMenuHandling_clean_icon(self.elements[xml_node.get(0).tagName].illustrator.svg);
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
          var icond = self.contextMenuHandling_clean_icon(self.resources['delete']);
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
        var icon = self.contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg);
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

    this.elements.call.illustrator.resolve_symbol = function(node) { //{{{
      if($('> code', node).length > 0) {
        return 'callmanipulate';
      } else {
        return 'call';
      }
    } //}}}
    this.elements.call.permissible_children = function(node,mode) { //{{{
      if(node.children('code').length < 1)
        return [
         {'label': 'Output Transformation',
          'function_call': self.adaptor.description.insert_last_into,
          'menu_icon': self.contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
          'type': undefined,
          'params': [self.adaptor.description.elements.scripts, node]}
        ];
      return [];
    } //}}}

    this.elements.otherwise.permissible_children = function(node,mode) { //{{{
      var func = null;
      var childs = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Task with Output Transformation',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Task',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.terminate.illustrator.svg),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': self.contextMenuHandling_clean_icon(self.elements.critical.illustrator.svg),
           'type': 'critical',
           'params': [self.adaptor.description.elements.critical, node]
        });
      }
      return childs;
    }; //}}}
    this.elements.alternative.permissible_children = function(node,mode) { //{{{
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      if(node.parents('parallel').length > node.parents('parallel_branch').length && node.get(0).tagName == 'alternative') {
        return [{'label': 'Parallel Branch',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.parallel_branch.illustrator.svg),
         'type': 'parallel_branch',
         'params': [self.adaptor.description.elements.parallel_branch, node]}];
      }
      var childs = [
        {'label': 'Task with Output Transformation',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Task',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.terminate.illustrator.svg),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': self.contextMenuHandling_clean_icon(self.elements.critical.illustrator.svg),
           'type': 'critical',
           'params': [self.adaptor.description.elements.critical, node]
        });
      }
      return childs;
    }; //}}}
    this.elements.loop.permissible_children = function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Task with Output Transformation',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Task',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.terminate.illustrator.svg),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': self.contextMenuHandling_clean_icon(self.elements.critical.illustrator.svg),
           'type': 'critical',
           'params': [self.adaptor.description.elements.critical, node]
        });
      }
      if(node.parent('parallel').length > node.parent('parallel_branch').length) {
        childs.push({'label': 'Parallel Branch',
                     'function_call': func,
                     'menu_icon': self.contextMenuHandling_clean_icon(self.elements.parallel_branch.illustrator.svg),
                     'type': 'parallel_branch',
                     'params': [self.adaptor.description.elements.parallel_branch, node]}
                    );
      } else {
        childs.push({'label': 'Parallel',
                     'function_call': func,
                     'menu_icon': self.contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
                     'type': 'parallel',
                     'params': [self.adaptor.description.elements.parallel, node]}
                    );
      }
      return childs;
    }; //}}}
    this.elements.parallel.permissible_children = function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs =  [
        {'label': 'Parallel Branch',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.parallel_branch.illustrator.svg),
         'type': 'parallel_branch',
         'params': [self.adaptor.description.elements.parallel_branch, node]},
      ];
      return childs;
    }; // }}}
    this.elements.parallel.permissible_children_expert = function(node,mode) { //{{{
      var func = null;
      if (mode.match(/into/)) { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs =  [
        {'label': 'Task with Output Transformation',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Task',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.get(0).tagName != 'parallel')
        childs.push({'label': 'Parallel',
           'function_call': self.adaptor.description.insert_last_into,
           'menu_icon': self.contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
           'type': 'parallel',
           'params': [self.adaptor.description.elements.parallel, node]});
      return childs;
    }; //}}}

    this.elements.parallel_branch.permissible_children = function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Task with Output Transformation',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Task',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.terminate.illustrator.svg),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.critical.illustrator.svg),
         'type': 'critical',
         'params': [self.adaptor.description.elements.critical, node]}
      ];
      if(node.parents('choose').length > node.parents('alternative, otherwise').length && node.get(0).tagName == 'parallel_branch') {
        return [{'label': 'Alternative',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.alternative.illustrator.svg),
         'type': 'alternative',
         'params': [self.adaptor.description.elements.alternative, node]}];
      }
      return childs;
    }; //}}}
    this.elements.critical.permissible_children = function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Task with Output Transformation',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Task',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.terminate.illustrator.svg),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': self.contextMenuHandling_clean_icon(self.elements.critical.illustrator.svg),
           'type': 'critical',
           'params': [self.adaptor.description.elements.critical, node]
        });
      }
      return childs;
    }; //}}}

    this.elements.start.illustrator.resolve_symbol = null;
    this.elements.start.description = null;
    this.elements.start.permissible_children = this.elements.description.permissible_children = function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Task with Output Transformation',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Task',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': self.contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': self.contextMenuHandling_clean_icon(self.elements.critical.illustrator.svg),
           'type': 'critical',
           'params': [self.adaptor.description.elements.critical, node]
        });
      }
      return childs;
    }; //}}}
  }
}
