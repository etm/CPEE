WFAdaptorManifestation = class extends WFAdaptorManifestationBase {
  constructor(adaptor) {
    super(adaptor);
    this.compact = true;
    this.rotated_labels = true;
    delete(this.elements.choose.illustrator.closing_symbol);
    this.elements.alternative.illustrator.noindent = true;
    this.elements.parallel_branch.illustrator.noindent = true;
    this.elements.loop_head.illustrator.rotatelabels = false;
    this.elements.loop_tail.illustrator.rotatelabels = false;
    this.elements.loop_finish.illustrator.rotatelabels = false;
    this.elements.call.illustrator.rotatelabels = false;
    this.elements.call_sensor.illustrator.rotatelabels = false;
    this.elements.manipulate.illustrator.rotatelabels = false;
    this.elements.callmanipulate.illustrator.rotatelabels = false;
    this.elements.callmanipulate_sensor.illustrator.rotatelabels = false;
  }
}
