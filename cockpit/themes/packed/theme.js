WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    this.compact = true;
    this.rotated_labels = true;
    delete(this.elements.choose.illustrator.closing_symbol);
    this.elements.alternative.illustrator.noindent = true;
    this.elements.parallel_branch.illustrator.noindent = true;
  }
}
