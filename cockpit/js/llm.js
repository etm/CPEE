var last_generated_model = undefined;
var last_model_before_generation =undefined;

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

function call_llm_service(status_id,prompt_id,llm_id) {
  let input = $(`#${prompt_id}`);
  let text = input[0].innerText;
  let myllm = $(`#${llm_id}`).find(":selected").val();
  if (myllm === undefined){
    myllm = "gemini-2.0-flash";
  }
  const formData = new FormData();
  const blob1 = new Blob([save['dslx']], { type: "text/xml" });
  formData.append("rpst_xml", blob1);
  const blob2 = new Blob([text], { type: "text/plain" });
  formData.append("user_input", blob2);
  const blob3 = new Blob([myllm], { type: "text/plain" });
  formData.append("llm", blob3);

  jQuery.ajax({
    url: '/llm/',
    data: formData,
    cache: false,
    contentType: false,
    processData: false,
    method: 'POST',
    success: function(data){
      last_model_before_generation = save['dslx'];
      last_generated_model = data.output_cpee;
      set_cpee_model(data.output_cpee,["<!-- Input CPEE-Tree -->\n"+data.input_cpee,"# User Input:\n"+data.user_input,"# Used LLM:\n"+data.used_llm,"%% Input Intermediate\n"+data.input_intermediate,"%% Output Intermediate\n"+data.output_intermediate,"<!-- Output CPEE-Tree -->\n"+data.output_cpee]);
      set_success(status_id,data.status);
    },
    error:  function(xhr, status, data) {
      set_error(status_id,xhr.responseJSON.error);
    }
  });

 input.empty();
}

function call_llm_text_service(status_id,prompt_id,llm_id,action) {
  let myllm = $(`#${llm_id}`).find(":selected").val();
  if (myllm === undefined){
    myllm = "gemini-2.0-flash";
  }
  const info = save.attributes_raw.info;
  const formData = new FormData();
  const first = new Blob([save['dslx']], { type: "text/xml" });
  formData.append("rpst_xml", first);
  const second = myllm;
  formData.append("llm", second);

  jQuery.ajax({
    url: '/llm/text/llm/',
    data: formData,
    cache: false,
    contentType: false,
    processData: false,
    method: 'POST',
    success: function(data){
      if (action=="show"){
        add_prompt(prompt_id,data["output_text"]);
      } else if (action=="file") {
        $('#savetext').attr('download', info + '.txt');
        const encodedText = encodeURIComponent(data["output_text"]);
        const dataUri = "data:text/plain;charset=utf-8," + encodedText;
        const link = document.getElementById("savetext");
        link.href = dataUri;
        link.click();
      };
      last_model_before_generation = save['dslx'];
      set_success(status_id,data.status);
    },
    error:  function(xhr, status, data) {
      set_error(status_id,xhr.responseJSON.error);
    }
  });
}

function set_cpee_model(cpee_xml,expositions=[]) {

  const form_data = new FormData();
  const blob = new Blob([cpee_xml], { type: "text/xml" });
  form_data.append("dslx", blob);

  for (const x of expositions) {
    const blobi = new Blob([x], { type: "text/plain" });
    form_data.append("exposition", blobi);
  }

  $.ajax({
    type: "PUT",
    url: url + "/properties/dslx/",
    contentType: false,
    processData: false,
    data: form_data
  });
}

function set_success(status_id,success_text) {
  $(`#${status_id}`).text(success_text);
  $(`#${status_id}`).addClass('success');
}

function set_error(status_id,error_text) {
   $(`#${status_id}`).text(error_text);
   $(`#${status_id}`).addClass('error');
}

function load_last_generated_model() {
  set_cpee_model(last_generated_model === undefined ? save['dslx'] : last_generated_model);
}

function load_last_model_before_generation() {
  set_cpee_model(last_model_before_generation === undefined ? save['dslx'] : last_model_before_generation);
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
      call_llm_service('status',this.id,'llms');
    }
  });
  $(document).on('click','#prompt_submit_button',function(e){
    clean_llm_ui('status');
    call_llm_service('status','prompt','llms');
  });
  $(document).on('click','#generate_itext_button',function(e){
    clean_llm_ui('status');
    call_llm_text_service('status','prompt','llms','file');
  });
  $(document).on('click','#generate_text_button',function(e){
    clean_llm_ui('status');
    call_llm_text_service('status','prompt','llms','show');
  });
  $(document).on('click','#prompt_undo_button',function(e){
    clean_llm_ui('status');
    load_last_model_before_generation();
  });
  $(document).on('click','#prompt_attach_button',function(e){
    document.getElementById('loadtxt').click();
  });
  $("#loadtxt").change(function(e){
    let files = document.getElementById('loadtxt').files;
    load_file_content(files);
  });
  $(document).on('drop','#prompt',function(e){
    e.preventDefault();
    e.stopPropagation();
    load_file_content(e.originalEvent.dataTransfer.files);
  });
});
