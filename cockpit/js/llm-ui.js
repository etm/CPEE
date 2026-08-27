class LLMUI { //{{{
  constructor() {
    let self = this;
    this.current_bubble = undefined;
    $(document).ready(function() {
      self.has_bubble_ui = typeof set_bubble_ui === 'function';
    });
  }
  clean() {
    if (this.has_bubble_ui)  { clean_bubble_ui_type(); }
    else { clean_llm_ui(); }
  }
  input(llms,text) {
    if (this.has_bubble_ui)  {
      add_bubble_ui('chat bubble input');
      set_bubble_ui(llms,text);
      add_bubble_ui('chat bubble response');
    }
  }
  querying(llms,what) {
    what = 'Agent ' + what;
    if (this.has_bubble_ui)  { set_bubble_ui(llms,what,'loading'); }
    else { querying_llm_ui(llms,what); }
  }
  success(llms,text) {
    if (this.has_bubble_ui)  { set_bubble_ui(llms,text,'success'); }
    else { set_success(text); }
  }
  error(llms,text) {
    if (this.has_bubble_ui)  { set_bubble_ui(llms,text,'error'); }
    else { set_error(text); }
  }
} //}}}

const ui = new LLMUI();
