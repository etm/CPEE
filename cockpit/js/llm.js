$(document).ready(function() {
  $(document).on('keypress','#prompt',function(e){
    $('#status').text();
    $('#status').removeClass('error');
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      let input = $(this);
      let text = this.innerText;

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
          $('#status').text(data.status);
        },
        error:  function(xhr, status, data) {
          $('#status').text(xhr.responseJSON.error);
          $('#status').addClass('error');
        }
      });

      input.empty();
    }
  });
});
