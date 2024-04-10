WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    var self = this;
    this.striped = true;
    var dataflowExtract = function(subject,mixed,extract) { //{{{
      let dict = {};
      var regassi =      /data\.([a-zA-Z_]+)\s*(=[^=]|\+\=|\-\=|\*\=|\/\=|<<|>>)/g; // we do not have to check for &gt;/&lt; version of stuff as only conditions are in attributes, and conditions can not contain assignments
      var reg_not_assi = /data\.([a-zA-Z_]+)\s*/g;

      $(subject).each(function(_,ele){
        if (item === undefined) { return }
        let item = extract(ele);
        if (mixed && item.length > 0 && item[0].charAt(0) != '!') { return }

        let indices = [];
        for (const match of item.matchAll(regassi)) {
          indices.push(match.index);
          dict[match[1]] = "Assign";
        }
        for (const match of item.matchAll(reg_not_assi)) {
          const arg1 = match[1];
          if (indices.includes(match.index)) { continue; }
          if (dict[arg1] == "Assign" || dict[arg1] == "AssignRead") {
            dict[arg1] = "AssignRead";
          } else {
            dict[arg1] = "Read";
          }
        }
      });
      return dict;
    } //}}}
    this.elements.call.illustrator.label = function(node) { //{{{
      var rep = $('body').attr('current-resources');
      var ep = self.endpoints[$(node).attr('endpoint')];
      var wait = $('_timing_wait',$(node).children('annotations')).text();
      var threshold = $('_timing_threshold',$(node).children('annotations')).text();
      var adur = $('_timing_avg',$(node).children('annotations')).text();
      var lab = $('> label',$(node).children('parameters')).text().replace(/^['"]/,'').replace(/['"]$/,'');
      var ret = [ { column: 'ID', value: $(node).attr('id') } ];

      // For Blue Points
      let dict1 = dataflowExtract($('arguments *',$(node).children('parameters')),true,function(target){ return $(target).text(); });
      let dict2 = dataflowExtract($(node).children('code').children(),false,function(target){ return $(target).text(); });
      let dict = {...dict1,...dict2};
      ret.push({ column: 'Dataflow', value: dict, type: 'resource' });
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

      let dict = dataflowExtract($(node),false,function(target){ return $(target).attr('condition'); });
      ret.push({ column: 'Dataflow', value: dict, type: 'resource' });

      return ret;
    };   //}}}
    this.elements.start.illustrator.label = function(node) { //{{{
      return [ { column: 'ID' }, { column: 'Dataflow', type: 'resource' }, { column: 'Label' }, { column: 'RP' }, { column: 'R#' } ];
    }; //}}}
    this.elements.loop_head.illustrator.label = function(node) { //{{{
      var avg = $('> _probability_avg',$(node).children('_probability')).text();
      var ret = [ { column: 'Label', value: $(node).attr('condition') } ];
      if (avg != '') {
        ret.push({ column: 'Average', value: avg + 'ｘ' });
      }

      let dict = dataflowExtract($(node),false,function(target){ return $(target).attr('condition'); });
      ret.push({ column: 'Dataflow', value: dict, type: 'resource' });

      return ret;
    }; //}}}
  }
}
