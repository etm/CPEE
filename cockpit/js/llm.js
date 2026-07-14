var last_generated_model = undefined;
var last_model_before_generation =undefined;
var default_llm = "gemini-2.5-flash-lite";

function clean_llm_ui(status) { //{{{
  status.empty();
  status.removeClass('error').removeClass('success');
  status.removeClass('error').removeClass('error');
  status.removeClass('error').removeClass('loading');
} //}}}

function querying_llm_ui(status,llm,what) { //{{{
  let myllm = llm.find(":selected").val();
  if (myllm === undefined){ myllm = default_llm; }
  status.addClass('loading');
  status.text('Agent ' + what + ' (' + myllm + ')');
} //}}}

function add_prompt(input,content) { //{{{
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(input[0]);
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand('insertText', false, content);
} //}}}

function call_llm_service_model(dslx,input,llm,prompt_type) { //{{{
  const formData = new FormData();
  const blob1 = new Blob([dslx], { type: "text/xml" });
  formData.append("rpst_xml", blob1);
  const blob2 = new Blob([input], { type: "text/plain" });
  formData.append("user_input", blob2);
  const blob3 = new Blob([llm], { type: "text/plain" });
  formData.append("llm", blob3);
  const blob4 = new Blob([prompt_type], { type: "text/plain" });
  formData.append("prompt_type", blob4);
  if (prompt_type == 'adapt_endpoints') {
    const blob5 = new Blob([save['endpoints'].save_text()], { type: "text/xml" });
    formData.append("endpoints", blob5);
  }

  let def = new $.Deferred();

  jQuery.ajax({
    url: $('body').attr('current-llm-service'),
    data: formData,
    cache: false,
    contentType: false,
    processData: false,
    method: 'POST',
    success: function(data){
      def.resolve(data);
    },
    error:  function(xhr, status, data) {
      def.reject(xhr);
    }
  });

  return def.promise();
} //}}}
function call_llm_service_dataflow(model,llm) { //{{{
  const formData = new FormData();
  const blob1 = new Blob([model], { type: "text/xml" });
  formData.append("rpst_xml", blob1);
  const blob2 = new Blob([llm], { type: "text/plain" });
  formData.append("llm", blob2);

  let def = new $.Deferred();

  jQuery.ajax({
    url: $('body').attr('current-llm-service') + '/dataflow/',
    data: formData,
    cache: false,
    contentType: false,
    processData: false,
    method: 'POST',
    success: function(data){
      def.resolve(data);
    },
    error:  function(xhr, status, data) {
      def.reject(xhr);
    }
  });

  return def.promise();
} //}}}
function call_llm_service_validation(model,llm) { //{{{
  const formData = new FormData();
  const blob1 = new Blob([model], { type: "text/xml" });
  formData.append("rpst_xml", blob1);
  const blob2 = new Blob([llm], { type: "text/plain" });
  formData.append("llm", blob2);

  let def = new $.Deferred();

  jQuery.ajax({
    url: $('body').attr('current-llm-service') + '/validate/xml/',
    data: formData,
    cache: false,
    contentType: false,
    processData: false,
    method: 'POST',
    success: function(data){
      def.resolve(data);
    },
    error:  function(xhr, status, data) {
      def.reject(xhr);
    }
  });

  return def.promise();
} //}}}

function call_llm_text_service(status,prompt,llms,action) { //{{{
  let myllm = llms.find(":selected").val();
  if (myllm === undefined){ myllm = default_llm; }
  const info = save.attributes_raw.info;
  const formData = new FormData();
  const first = new Blob([save['dslx']], { type: "text/xml" });
  formData.append("rpst_xml", first);
  const second = myllm;
  formData.append("llm", second);

  jQuery.ajax({
    url: $('body').attr('current-llm-service') + '/text/llm/',
    data: formData,
    cache: false,
    contentType: false,
    processData: false,
    method: 'POST',
    success: function(data){
      if (action=="show"){
        add_prompt(prompt,data["output_text"]);
      } else if (action=="file") {
        $('#savetext').attr('download', info + '.txt');
        const encodedText = encodeURIComponent(data["output_text"]);
        const dataUri = "data:text/plain;charset=utf-8," + encodedText;
        const link = document.getElementById("savetext");
        link.href = dataUri;
        link.click();
      };
      last_model_before_generation = save['dslx'];
      set_success(status,data.status);
    },
    error:  function(xhr, stat, data) {
      set_error(status,xhr.responseJSON.error);
    }
  });
} //}}}

function set_cpee_model(cpee_xml,expositions=[]) { //{{{
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
} //}}}

function set_success(status,success_text) { //{{{
  status.text(success_text);
  status.addClass('success');
  status.removeClass('loading');
  status.removeClass('error');
} //}}}

function set_error(status,error_text) { //{{{
  status.text(error_text);
  status.addClass('error');
  status.removeClass('success');
  status.removeClass('loading');
} //}}}

function empty_model(){ //{{{
  set_cpee_model('<description xmlns="http://cpee.org/ns/description/1.0" xmlns:a="http://cpee.org/ns/annotation/1.0"/>',["Reset Context!"]);
  $('#dat_details').empty();
} //}}}
function load_last_generated_model() { //{{{
  set_cpee_model(last_generated_model === undefined ? save['dslx'] : last_generated_model);
} //}}}
function load_last_generated_model() { //{{{
  set_cpee_model(last_generated_model === undefined ? save['dslx'] : last_generated_model);
} //}}}

function load_last_model_before_generation() { //{{{
  set_cpee_model(last_model_before_generation === undefined ? save['dslx'] : last_model_before_generation);
} //}}}

function load_file_content(files) { //{{{
  if (typeof window.FileReader !== 'function') {
    console.log('FileReader not yet supported');
    return;
  }
  var reader = new FileReader();
  reader.onload = function(){
    clean_llm_ui($('#status'));
    add_prompt('prompt',reader.result);
  }
  reader.onerror = function(){ console.log("reader error"); }
  reader.onabort = function(){ console.log("reader abort"); }
  reader.readAsText(files[0]);
} //}}}

function create(status,prompt,llms,generation,mode) {
  clean_llm_ui(status);

  // Imagine I want to implement a smart home system to control the lights in
  // the dining room.  Depending on the current lighting conditions, the
  // system would automatically adjust the brightness—either increasing or
  // reducing it as needed—and turn the lights off completely at night.

  let input = prompt.text(); prompt.empty();
  let myllm = llms.find(":selected").val();
  let prompt_type = mode.find(":selected").val();
  let gen = generation.find(":selected").val();
  if (myllm === undefined){ myllm = default_llm; }

  if ($X(save['dslx']).get(0).childElementCount == 0) {
    prompt_type = 'generate_' + prompt_type;
  } else {
    prompt_type = 'adapt_' + prompt_type;
    // always use adapt_endpoints when in dataflow mode
    if (gen == 'dataflow') { prompt_type = 'adapt_endpoints'; }
  }

  querying_llm_ui(status,llms,'creates model');
  call_llm_service_model(save['dslx'],input,myllm,prompt_type).done((data) => {
    let expositions = ["<!-- Input CPEE-Tree -->\n"+data.input_cpee,"# User Input:\n"+data.user_input,"# Used LLM:\n"+data.used_llm,"%% Input Intermediate\n"+data.input_intermediate,"%% Output Intermediate\n"+data.output_intermediate,"<!-- Output CPEE-Tree -->\n"+data.output_cpee];
    if (prompt_type == 'adapt_endpoints') {
      let testset = $X(data.output_cpee);
      let model = $('> dslx > description',testset);
      let endpoints = $('> endpoints',testset);
      $.ajax({
        type: "PATCH",
        url: url + "/properties/endpoints/",
        contentType: 'text/xml',
        headers: {
          'Content-ID': 'endpoints',
          'CPEE-Event-Source': myid
        },
        data: endpoints.serializePrettyXML()
      });

      last_model_before_generation = save['dslx'];
      last_generated_model = model.serializePrettyXML();
      set_cpee_model(model.serializePrettyXML(),expositions);
      set_success(status,data.status);
    } else {
      if (gen == "dataflow") {
        querying_llm_ui(status,llms,'selects endpoints and calculates dataflow');
        call_llm_service_dataflow($X(data.output_cpee).serializePrettyXML(),myllm).done((data) => {
          let url = $('body').attr('current-instance');
          $.ajax({
            type: "PATCH",
            url: url + "/properties/endpoints/",
            contentType: 'text/xml',
            headers: {
              'Content-ID': 'endpoints',
              'CPEE-Event-Source': myid
            },
            data: data.endpoints
          });

          querying_llm_ui(status,llms,'validates dataflow');
          expositions.push("# Dataflow:\n"+data.dataflow);
          call_llm_service_validation($X(data.output_cpee).serializePrettyXML(),myllm).done((data) => {
            // for undo button
            last_model_before_generation = save['dslx'];
            last_generated_model = data.output_cpee;
            set_cpee_model($X(data.output_cpee).serializePrettyXML(),expositions);
            set_success(status,data.status);
          });

        })
        .fail((xhr) => {
          set_error(status,xhr.responseJSON.error);
        });
      } else if (gen == "model") {
        last_model_before_generation = save['dslx'];
        last_generated_model = data.output_cpee;
        set_cpee_model(data.output_cpee,expositions);
        set_success(status,data.status);
      } else {
        set_success(status,"Successfully done nothing");
      }
    }
  })
  .fail((xhr) => {
    set_error(status,xhr.responseJSON.error);
  });
}

$(document).ready(async function() { //{{{
  let llm_inactive = await $.get('css/llm_inactive.svg', 'xml').then(function(data) { return $(data.documentElement); });
  let llm_active = await $.get('css/llm_active.svg', 'xml').then(function(data) { return $(data.documentElement); });

  let mode_inactive = await $.get('css/mode_inactive.svg', 'xml').then(function(data) { return $(data.documentElement); });
  let mode_active = await $.get('css/mode_active.svg', 'xml').then(function(data) { return $(data.documentElement); });

  $(document).on('keydown','#prompt',function(e){
    clean_llm_ui($('#status'));
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      create($('#status'),$('#prompt'),$('#llms'),$('#generation'),$('#mode'));
    }
  });
  $(document).on('click','#prompt_submit_button',function(e){
    create($('#status'),$('#prompt'),$('#llms'),$('#generation'),$('#mode'));
  });
  $(document).on('click','#prompt_reset_button',function(e){
    clean_llm_ui($('#status'));
    empty_model();
  });
  $(document).on('click','#generate_itext_button',function(e){
    clean_llm_ui($('#status'));
    querying_llm_ui($('#status'),$('#llms'),'thinks');
    call_llm_text_service($('#status'),'prompt','#llms','file');
  });
  $(document).on('click','#generate_text_button',function(e){
    clean_llm_ui($('#status'));
    querying_llm_ui($('#status'),$('#llms'),'thinks');
    call_llm_text_service($('#status'),$('#prompt'),$('#llms'),'show');
  });
  $(document).on('click','#prompt_undo_button',function(e){
    clean_llm_ui($('#status'));
    querying_llm_ui($('#status'),$('#llms'),'thinks');
    load_last_model_before_generation();
  });
  $(document).on('click','#prompt_attach_button',function(e){
    document.getElementById('loadtxt').click();
  });
  $(document).on('click','#prompt_prop_button',function(e){
    var menu = new CustomMenu(e);

    var mode_entries = [];
    $('#mode.active option').each(function(){
      mode_entries.push({
        label: $(this).text(),
        menu_icon: $(this).is(':selected') ? mode_active : mode_inactive,
        function_call: function(val){
          $('#mode').val(val);
          $('#mode option').removeAttr('selected');
          $('#mode option[value="' + val + '"]').attr('selected', 'selected');
        },
        params: [$(this).val()]
      });
    });

    var llm_entries = [];
    $('#llms.active option').each(function(){
      llm_entries.push({
        label: $(this).text(),
        menu_icon: $(this).is(':selected') ? llm_active : llm_inactive,
        function_call: function(val){
          $('#llms').val(val);
          $('#llms option').removeAttr('selected');
          $('#llms option[value="' + val + '"]').attr('selected', 'selected');
        },
        params: [$(this).val()]
      });
    });

    let res = {};
    if (mode_entries.length > 0) {
      res['Models'] = mode_entries;
    }
    if (llm_entries.length > 0) {
      res['LLMs'] = llm_entries;
    }

    menu.contextmenu(res);
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
}); //}}}
