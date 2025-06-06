function clean_llm_ui(status_id) {
  status_div = $(`#${status_id}`);
  status_div.empty();
  status_div.removeClass('error').removeClass('success');
  return
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

$(document).ready(function() {
  $(document).on('keydown','#prompt',function(e){
    clean_llm_ui('status');
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      call_llm_service('status',this.id);
    }
  });
  $(document).on('click','#prompt_submit_button',function(e){
    clean_llm_ui('status');
    call_llm_service('status','prompt');
  });
});
