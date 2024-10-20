WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    var self = this;
    this.striped = true;
    this.elements.choose.illustrator.label = null;
    this.elements.alternative.illustrator.label = null;
    this.elements.loop_finish.illustrator.label = null;
    this.elements.loop_head.illustrator.label = null;
  }
}
