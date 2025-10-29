WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    this.compact = true;
    this.rotated_labels = false;
    this.elements.call.illustrator.label = function(node) { //{{{
      return [ { column: 'Label', value: $('> label',$(node).children('parameters')).text().replace(/^['"]/,'').replace(/['"]$/,'') + ' (' + $(node).attr('id') + ')' } ];
    }; //}}}
    this.elements.stop.illustrator.label = function(node) { //{{{
      return [ { column: 'Label', value: $('> label',$(node).children('parameters')).text().replace(/^['"]/,'').replace(/['"]$/,'') + ' (' + $(node).attr('id') + ')' } ];
    }; //}}}
    this.elements.wait_for_signal.illustrator.label = function(node) { //{{{
      return [ { column: 'Label', value: $('> label',$(node).children('parameters')).text().replace(/^['"]/,'').replace(/['"]$/,'') + ' (' + $(node).attr('id') + ')' } ];
    }; //}}}
  }
}
