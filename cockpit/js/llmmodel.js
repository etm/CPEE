function llmmodel_is_form_element(el) { //{{{
  if (!el || el === document.body || el === document.documentElement) { return false; }
  return $(el).is('input, textarea, select, button, [contenteditable]:not([contenteditable=false])') || el.isContentEditable;
} //}}}

function llmmodel_focus_end(el) { //{{{
  el.focus();
  let range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  let sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
} //}}}

$(document).ready(function() { //{{{
  document.addEventListener('click',function(e){
    if (e.button != 0 || e.ctrlKey || e.metaKey || e.shiftKey) { return; }
    if ($(e.target).closest('#graphgrid [element-id]').length > 0) {
      uidash_activate_tab('#tabnodedetails');
    }
  },true);

  document.addEventListener('keydown',function(e){
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) { return; }
    if (e.key.length != 1) { return; }
    if (llmmodel_is_form_element(document.activeElement)) { return; }
    if ($('div.contextmenu:visible, div.menu:visible').length > 0) { return; }
    uidash_activate_tab('#tabchat');
    llmmodel_focus_end($('#prompt')[0]);
  },true);
}); //}}}
