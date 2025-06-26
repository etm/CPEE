function clean_llm_ui(status_id) {
  status_div = $(`#${status_id}`);
  status_div.empty();
  status_div.removeClass('error').removeClass('success');
  return
}

function add_prompt(prompt_id,content) {
  let input = $(`#${prompt_id}`);
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(input[0]);
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand('insertText', false, content);
  return ;
}

function call_llm_service(status_id,prompt_id) {
  let input = $(`#${prompt_id}`);
  let text = input[0].innerText;

  const formData = new FormData();
  const blob1 = new Blob([save['dslx']], { type: "text/xml" });
  formData.append("rpst_xml", blob1);
  const blob2 = new Blob([text], { type: "text/plain" });
  formData.append("user_input", blob2);
  const blob3 = new Blob(['gemini-2.0-flash'], { type: "text/plain" });
  formData.append("llm", blob3);

  jQuery.ajax({
    url: '/llm/',
    data: formData,
    cache: false,
    contentType: false,
    processData: false,
    method: 'POST',
    success: function(data){
      $.ajax({
        type: "PUT",
        url: url + "/properties/description/",
        contentType: 'text/xml',
        headers: { 'Content-ID': 'description' },
        data: data.output_cpee
      });
      $(`#${status_id}`).text(data.status);
      $(`#${status_id}`).addClass('success');
    },
    error:  function(xhr, status, data) {
      $(`#${status_id}`).text(xhr.responseJSON.error);
      $(`#${status_id}`).addClass('error');
    }
  });

 input.empty();
}

function load_file_content(files) {
  if (typeof window.FileReader !== 'function') {
    console.log('FileReader not yet supported');
    return;
  }
  var reader = new FileReader();
  reader.onload = function(){
    clean_llm_ui('status');
    add_prompt('prompt',reader.result);
  }
  reader.onerror = function(){ console.log("reader error"); }
  reader.onabort = function(){ console.log("reader abort"); }
  reader.readAsText(files[0]);
}


$(document).ready(function() {
  $(document).on('keydown','#prompt',function(e){
    clean_llm_ui('status');
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      call_llm_service('status',this.id);
    }
  });
  $(document).on('click','#prompt_submit_button',function(e) {
    clean_llm_ui('status');
    call_llm_service('status','prompt');
  });
  $('#prompt').on('drop',function(e) {
    e.preventDefault();
    e.stopPropagation();
    load_file_content(e.originalEvent.dataTransfer.files);
  });
});
