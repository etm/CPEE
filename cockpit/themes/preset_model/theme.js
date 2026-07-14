WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    var self = this;
    this.compact = true;
    this.rotated_labels = false;

    this.strings.scripts = 'Output Handling';

    this.elements.call.illustrator.resolve_symbol = function(node) { //{{{
      if($('> documentation > out', node).length > 0) {
        return 'callmanipulate';
      } else {
        return 'call';
      }
    } //}}}
    this.elements.call.permissible_children = function(node,mode) { //{{{
      if($('> documentation > out', node).length < 1) {
        return [
          {
            'label': 'Output Transformation',
            'function_call': self.adaptor.description.insert_last_into,
            'menu_icon': self.contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg),
            'type': undefined,
            'params': [self.adaptor.description.elements.scripts, $('> documentation', node)]
          }
        ];
      } else {
        return [];
      }
    } //}}}
    this.elements.call.removable_children = function(node) { //{{{
      if($('> documentation > out', node).length > 0) {
        var icon = self.contextMenuHandling_clean_icon(self.elements.callmanipulate.illustrator.svg);
        icon.find('.part-extra .colorstyle').css('fill','var(--wfadaptor-important');
        return [
          {
            'label': 'Remove ' + self.strings.scripts,
            'function_call': self.adaptor.description.remove,
            'menu_icon': icon,
            'type': undefined,
            'params': ['> documentation > out ', node]
          }
        ];
      } else {
        return [];
      }
    } //}}}
  }
}
