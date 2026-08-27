function clean_llm_ui() { //{{{
  let status = $('#status');
  status.empty();
  status.removeClass('error').removeClass('success');
  status.removeClass('error').removeClass('error');
  status.removeClass('error').removeClass('loading');
} //}}}

function querying_llm_ui(llms,what) { //{{{
  let status = $('#status');
  let myllm = llms.find(":selected").val();
  if (myllm === undefined){ myllm = default_llm; }
  status.addClass('loading');
  if (what.match(/Agent/)) {
    what += ' (' + myllm + ')';
  }
  status.text(what);
} //}}}

function set_success(success_text) { //{{{
  let status = $('#status');
  status.text(success_text);
  status.addClass('success');
  status.removeClass('loading');
  status.removeClass('error');
} //}}}

function set_error(error_text) { //{{{
  let status = $('#status');
  status.text(error_text);
  status.addClass('error');
  status.removeClass('success');
  status.removeClass('loading');
} //}}}
