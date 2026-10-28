WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    this.compact = true;
    this.rotated_labels = false;
    this.lr = true;
    this.wellformed_pre_test = true;
    this.elements.loop.illustrator.resolve_symbol = function(node) {
      return 'loop_tail'; // pre_test loops look like post_test loops, but reversed
    };
    this.elements.parallel_branch.illustrator.resolve_symbol = function(node,shift) {
      if(shift == true) {
        return adaptor.illustrator.inverted ? 'parallel_branch_event_rev' : 'parallel_branch_event'; // reversed: the flow goes from event_start up to the end circle
      } else {
        return 'parallel_branch_normal';
      }
    };
    this.elements.parallel_branch_event_rev = {
      'parent': 'parallel_branch_event',
      'illustrator': {
        'closing_symbol': 'event_start',
        'svg': adaptor.theme_dir + 'symbols/parallel_branch_event_rev.svg'
      }
    };
    this.elements.event_start = {
      'parent': 'event_end',
      'illustrator': {
        'svg': adaptor.theme_dir + 'symbols/event_start.svg'
      }
    };
  }
}
