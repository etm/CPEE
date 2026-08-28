class LLMUI { //{{{
  constructor() {
    let self = this;
    this.current_bubble = undefined;
    $(document).ready(function() {
      self.has_bubble_ui = typeof set_bubble_ui === 'function';
    });
  }
  init() {
    if (this.has_bubble_ui)  {
      if (typeof($('body').attr('current-document-store')) != "undefined") {
        if (save['documents'] && ('chat_history' in save['documents'].save_object())) {
          let llms = $('#llms');
          do_parameters_get_document_exec('chat_history',10).then(function(history){
            history.forEach(function(entry){
              if (entry.type === 'input') {
                add_bubble_ui('chat bubble input');
                set_bubble_ui(llms,entry.text);
                add_bubble_ui('chat bubble response');
              } else if (entry.type === 'output') {
                set_bubble_ui(llms,entry.text);
              }
            });
          });
        }
      }
    }
  }
  clean() {
    if (this.has_bubble_ui)  { clean_bubble_ui_type(); }
    else { clean_llm_ui(); }
  }
  input(llms,text) {
    if (this.has_bubble_ui) {
      if (typeof($('body').attr('current-document-store')) != "undefined") {
        if (save['documents'] && ('chat_history' in save['documents'].save_object())) {
          do_parameters_save_document_exec('chat_history','text/plain',JSON.stringify({ "type": "input", "text": text }) + "\n",'append');
        } else {
          let surl = do_parameters_save_document_exec('chat_history','text/plain',JSON.stringify({ "type": "input", "text": text }) + "\n",'append');
          $.ajax({
            type: 'PATCH',
            url: url + "/properties/documents/",
            contentType: 'text/xml',
            headers: {
              'Content-ID': 'documents',
              'CPEE-Event-Source': myid
            },
            data: "<documents xmlns='http://cpee.org/ns/properties/2.0'><chat_history>" + surl + "</chat_history></documents>"
          });
        }
      }
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
    if (this.has_bubble_ui)  {
      set_bubble_ui(llms,text,'success');
      if (typeof($('body').attr('current-document-store')) != "undefined") {
        if (save['documents'] && ('chat_history' in save['documents'].save_object())) {
          do_parameters_save_document_exec('chat_history','text/plain',JSON.stringify({ "type": "output", "status": "success", "text": text }) + "\n",'append');
        }
      }
    }
    else { set_success(text); }
  }
  error(llms,text) {
    if (this.has_bubble_ui)  {
      if (typeof($('body').attr('current-document-store')) != "undefined") {
        if (save['documents'] && ('chat_history' in save['documents'].save_object())) {
          do_parameters_save_document_exec('chat_history','text/plain',JSON.stringify({ "type": "output", "status": "error", "text": text }) + "\n",'append');
        }
      }
      set_bubble_ui(llms,text,'error');
    }
    else { set_error(text); }
  }
} //}}}

const ui = new LLMUI();
