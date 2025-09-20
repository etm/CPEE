WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    var self = this;
    this.striped = true;
    this.elements.call.illustrator.label = function(node) { //{{{
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
    };
    this.elements.manipulate.illustrator.label = function(node) {
      var lab = $(node).attr('label');
      if (lab) {
        return [ { column: 'Label', value: lab.replace(/^['"]/,'').replace(/['"]$/,'') }, { column: 'ID', value: $(node).attr('id') } ];
      }  else {
        return [ { column: 'ID', value: $(node).attr('id') } ];
      }
    }; //}}}
    this.elements.stop.illustrator.label = function(node) { //{{{
      return [ { column: 'ID', value: $(node).attr('id') } ];
    }; //}}}
    this.elements.loop_finish.illustrator.label = function(node) { //{{{
      var avg = $('> _probability_avg',$(node).children('_probability')).text();
      var ret = [ { column: 'Label', value: $(node).attr('condition') } ];
      if (avg != '') {
        ret.push({ column: 'Average', value: avg + 'ｘ' });
      }
      return ret;
    }; //}}}
    this.elements.otherwise.illustrator.label = function(node) { //{{{
      var avg = $('> _probability_avg',$(node).children('_probability')).text();
      return (avg == '' ? [] : [ { column: 'Average', value: avg + '%' } ]);
    }; //}}}
    this.elements.alternative.illustrator.label = function(node) { //{{{
      var avg = $('> _probability_avg',$(node).children('_probability')).text();
      var ret = [ { column: 'Label', value: $(node).attr('condition') } ];
      if (avg != '') {
        ret.push({ column: 'Average', value: avg + '%' });
      }
      return ret;
    };   //}}}
    this.elements.start.illustrator.label = function(node) { //{{{
      return [ { column: 'Label'}, { column: 'ID' }, { column: 'Resource' }, { column: 'RP' }, { column: 'R#' } ];
    }; //}}}
    this.elements.loop_head.illustrator.label = function(node) { //{{{
      var avg = $('> _probability_avg',$(node).children('_probability')).text();
      var ret = [ { column: 'Label', value: $(node).attr('condition') } ];
      if (avg != '') {
        ret.push({ column: 'Average', value: avg + 'ｘ' });
      }
      return ret;
    }; //}}}

    this.elements.otherwise.permissible_children = function(node,mode) { //{{{
      var func = null;
      var childs = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.closed_loop.illustrator.svg),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.terminate.illustrator.svg),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': contextMenuHandling_clean_icon(self.elements.critical.illustrator.svg),
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
         'menu_icon': contextMenuHandling_clean_icon(self.elements.parallel_branch.illustrator.svg),
         'type': 'parallel_branch',
         'params': [self.adaptor.description.elements.parallel_branch, node]}];
      }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.closed_loop.illustrator.svg),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.terminate.illustrator.svg),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': contextMenuHandling_clean_icon(self.elements.critical.illustrator.svg),
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
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.closed_loop.illustrator.svg),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.terminate.illustrator.svg),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': contextMenuHandling_clean_icon(self.elements.critical.illustrator.svg),
           'type': 'critical',
           'params': [self.adaptor.description.elements.critical, node]
        });
      }
      if(node.parent('parallel').length > node.parent('parallel_branch').length) {
        childs.push({'label': 'Parallel Branch',
                     'function_call': func,
                     'menu_icon': contextMenuHandling_clean_icon(self.elements.parallel_branch.illustrator.svg),
                     'type': 'parallel_branch',
                     'params': [self.adaptor.description.elements.parallel_branch, node]}
                    );
      } else {
        childs.push({'label': 'Parallel',
                     'function_call': func,
                     'menu_icon': contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
                     'type': 'parallel',
                     'params': [self.adaptor.description.elements.parallel, node]}
                    );
      }
      return childs;
    }; //}}}
    this.elements.parallel.permissible_children_expert = function(node,mode) { //{{{
      var func = null;
      if (mode.match(/into/)) { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs =  [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.closed_loop.illustrator.svg),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.get(0).tagName != 'parallel')
        childs.push({'label': 'Parallel',
           'function_call': self.adaptor.description.insert_last_into,
           'menu_icon': contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
           'type': 'parallel',
           'params': [self.adaptor.description.elements.parallel, node]});
      return childs;
    }; //}}}
    this.elements.parallel_branch.permissible_children = function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.closed_loop.illustrator.svg),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.terminate.illustrator.svg),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]},
        {'label': 'Critical',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.critical.illustrator.svg),
         'type': 'critical',
         'params': [self.adaptor.description.elements.critical, node]}
      ];
      if(node.parents('choose').length > node.parents('alternative, otherwise').length && node.get(0).tagName == 'parallel_branch') {
        return [{'label': 'Alternative',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.alternative.illustrator.svg),
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
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.closed_loop.illustrator.svg),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Terminate',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.terminate.illustrator.svg),
         'type': 'terminate',
         'params': [self.adaptor.description.elements.terminate, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': contextMenuHandling_clean_icon(self.elements.critical.illustrator.svg),
           'type': 'critical',
           'params': [self.adaptor.description.elements.critical, node]
        });
      }
      return childs;
    }; //}}}
    this.elements.start.permissible_children = function(node,mode) { //{{{
      var func = null;
      if (mode == 'into') { func = self.adaptor.description.insert_first_into }
      else { func = self.adaptor.description.insert_after }
      var childs = [
        {'label': 'Service Call with Scripts',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Closed Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.closed_loop.illustrator.svg),
         'type': 'closed_loop',
         'params': [self.adaptor.description.elements.closed_loop, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
         'type': 'stop',
         'params': [self.adaptor.description.elements.stop, node]}
      ];
      if(node.parent('parallel_branch').length > 0) {
        childs.push({
           'label': 'Critical',
           'function_call': func,
           'menu_icon': contextMenuHandling_clean_icon(self.elements.critical.illustrator.svg),
           'type': 'critical',
           'params': [self.adaptor.description.elements.critical, node]
        });
      }
      return childs;
    }; //}}}

  this.elements.closed_loop_finish = { /*{{{*/
    'parent': 'closed_loop_finish',
    'illustrator': {//{{{
      'endnodes': 'this',
      'closeblock': true,
      'svg': self.adaptor.theme_dir + 'symbols/closed_loop.svg'
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
      ,
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
         'menu_icon': contextMenuHandling_clean_icon(self.elements.closed_loop_measuring.illustrator.svg),
         'type': 'closed_loop_measuring',
         'params': [self.adaptor.description.elements.closed_loop_measuring, node]} ,
        {'label': 'Control',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.closed_loop_control.illustrator.svg),
         'type': 'closed_loop_control',
         'params': [self.adaptor.description.elements.closed_loop_control, node]},
        {'label': 'Cancel',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.closed_loop_cancel.illustrator.svg),
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
         'menu_icon': contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
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
         'menu_icon': contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Control',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.closed_loop_control.illustrator.svg),
         'type': 'closed_loop_control',
         'params': [self.adaptor.description.elements.closed_loop_control, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
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
         'menu_icon': contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
         'type': 'callmanipulate',
         'params': [self.adaptor.description.elements.callmanipulate, node]},
        {'label': 'Service Call',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.call.illustrator.svg),
         'type': 'call',
         'params': [self.adaptor.description.elements.call, node]},
        {'label': 'Script',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.manipulate.illustrator.svg),
         'type': 'manipulate',
         'params': [self.adaptor.description.elements.manipulate, node]},
        {'label': 'Parallel',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.parallel.illustrator.svg),
         'type': 'parallel',
         'params': [self.adaptor.description.elements.parallel, node]},
        {'label': 'Decision',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.choose.illustrator.svg),
         'type': 'choose',
         'params': [self.adaptor.description.elements.choose, node]},
        {'label': 'Loop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.loop.illustrator.svg),
         'type': 'loop',
         'params': [self.adaptor.description.elements.loop, node]},
        {'label': 'Stop',
         'function_call': func,
         'menu_icon': contextMenuHandling_clean_icon(self.elements.stop.illustrator.svg),
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
  }
}
