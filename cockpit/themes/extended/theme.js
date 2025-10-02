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
      var ret = [ { column: 'ID', value: $(node).attr('id') } ];
      if (lab && lab != '') {
        ret.unshift( { column: 'Label', value: lab } );
      }
      return ret;
    }; //}}}
    this.elements.stop.illustrator.label = function(node) { //{{{
      return [ { column: 'ID', value: $(node).attr('id') } ];
    }; //}}}
    this.elements.wait_for_signal.illustrator.label = function(node) { //{{{
      return [ { column: 'ID', value: $(node).attr('id') } ];
    }; //}}}
    this.elements.loop_finish.illustrator.label = function(node) { //{{{
      var avg = $('> _probability_avg',$(node).children('_probability')).text();
      var lab = $(node).attr('condition');
      var ret = [ ];
      if (lab != '') {
        ret.unshift( { column: 'Label', value: lab } );
      }
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
      var lab = $(node).attr('condition');
      var ret = [ ];
      if (lab != '') {
        ret.unshift( { column: 'Label', value: lab } );
      }
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
      var lab = $(node).attr('condition');
      var ret = [ ];
      if (lab != '') {
        ret.unshift( { column: 'Label', value: lab } );
      }
      if (avg != '') {
        ret.push({ column: 'Average', value: avg + 'ｘ' });
      }
      return ret;
    }; //}}}
  }
}
