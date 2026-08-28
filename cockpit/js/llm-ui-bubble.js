function clean_bubble_ui_type(type) { //{{{
  let status = $('#' + ui.current_bubble);
  if (type == 'loading') {
    status.removeClass('success');
    status.removeClass('error');
  } else if (type == 'success') {
    status.removeClass('loading');
    status.removeClass('error');
  } else if (type == 'error') {
    status.removeClass('success');
    status.removeClass('loading');
  } else {
    status.removeClass('success');
    status.removeClass('error');
    status.removeClass('loading');
  }
} //}}}
function set_bubble_ui(llms,what,type='') { //{{{
  let status = $('#' + ui.current_bubble);
  clean_bubble_ui_type(type);
  status.addClass(type);
  if (what.match(/Agent/)) {
    let myllm = llms.find(":selected").val();
    if (myllm === undefined){ myllm = default_llm; }
    what += ' (' + myllm + ')';
  }
  status.text(what);
  status[0].parentElement.scrollTo({ top: status[0].parentElement.scrollHeight, behavior: 'smooth' });
} //}}}
function add_bubble_ui(type) { //{{{
  let id = Math.random().toString(36).substring(2, 10);
  $('<div></div>').attr('id',id).addClass(type).appendTo('#status');
  ui.current_bubble = id;
  return id;
} //}}}
