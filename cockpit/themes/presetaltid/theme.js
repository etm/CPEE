WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    this.compact = true;
    this.rotated_labels = false;
    this.elements.call.illustrator.label = function(node) { //{{{
      return [ { column: 'Label', value: $('> label',$(node).children('parameters')).text().replace(/^['"]/,'').replace(/['"]$/,'') + ' (' + $(node).attr('a:alt_id') + ')' } ];
    }; //}}}
    this.elements.call.illustrator.info = function(node) { //{{{
      return { 'element-endpoint': $(node).attr('endpoint'), 'element-alt_id': $(node).attr('a:alt_id')  };
    }; //}}}
    this.elements.callmanipulate.illustrator.label = function(node) { //{{{
      return [ { column: 'Label', value: $('> label',$(node).children('parameters')).text().replace(/^['"]/,'').replace(/['"]$/,'') + ' (' + $(node).attr('a:alt_id') + ')' } ];
    }; //}}}
    this.elements.callmanipulate.illustrator.info = function(node) { //{{{
      return { 'element-endpoint': $(node).attr('endpoint'), 'element-alt_id': $(node).attr('a:alt_id')  };
    }; //}}}
    this.elements.stop.illustrator.label = function(node) { //{{{
      return [ { column: 'Label', value: $('> label',$(node).children('parameters')).text().replace(/^['"]/,'').replace(/['"]$/,'') + ' (' + $(node).attr('a:alt_id') + ')' } ];
    }; //}}}
    this.elements.stop.illustrator.info = function(node) { //{{{
      return { 'element-alt_id': $(node).attr('a:alt_id')  };
    }; //}}}
    this.elements.wait_for_signal.illustrator.label = function(node) { //{{{
      return [ { column: 'Label', value: $('> label',$(node).children('parameters')).text().replace(/^['"]/,'').replace(/['"]$/,'') + ' (' + $(node).attr('a:alt_id') + ')' } ];
    }; //}}}
    this.elements.wait_for_signal.illustrator.info = function(node) { //{{{
      return { 'element-alt_id': $(node).attr('a:alt_id')  };
    }; //}}}
    this.elements.choose.illustrator.info = function(node) { //{{{
      return { 'element-alt_id': $(node).attr('a:alt_id')  };
    }; //}}}
    this.elements.loop.illustrator.info = function(node) { //{{{
      return { 'element-alt_id': $(node).attr('a:alt_id')  };
    }; //}}}
    this.elements.parallel.illustrator.info = function(node) { //{{{
      return { 'element-alt_id': $(node).attr('a:alt_id')  };
    }; //}}}
  }
}
