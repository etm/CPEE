WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    delete(this.elements.choose.illustrator.closing_symbol);
    this.elements.parallel_branch.illustrator.resolve_symbol = function(node,shift) {
      if(shift == true) {
        return 'parallel_branch_compact';
      } else {
        return 'parallel_branch_normal';
      }
    }
  }
}
