WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    this.compact = true;
    this.rotated_labels = false;
    this.lr = true;
    this.wellformed_pre_test = true;
    this.elements.loop.illustrator.resolve_symbol = function(node) {
      return $(node).attr('mode') == 'pre_test' ? 'loop_tail_pre' : 'loop_tail'; // pre_test loops look like post_test loops, but reversed
    };
    const condition = this.elements.loop_finish.illustrator.label;
    this.elements.loop_tail.illustrator.label = condition; // post_test: the condition at the starting gateway only makes room for the arrow, it is shown at the closing gateway
    this.elements.loop_tail.illustrator.hidelabel = true;
    this.elements.loop_finish.illustrator.label = null;
    this.elements.loop_finish.illustrator.mark_position = 'right'; // post_test: the condition is also left of the closing gateway
    this.elements.loop_tail_pre = {
      'parent': 'loop_tail',
      'illustrator': {
        'label': function(node) { return null; }, // not null, that would be inherited from loop_tail
        'closing_symbol': 'loop_finish_pre'
      }
    };
    this.elements.loop_finish_pre = {
      'parent': 'loop_finish',
      'illustrator': {
        'label': condition,
        'mark_position': 'left', // otherwise inherited from loop_finish
        'svg': adaptor.theme_dir + 'symbols/loop_end_pre.svg' // the condition below the gateway
      }
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
