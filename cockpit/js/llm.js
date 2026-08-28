var last_model_before_generation =undefined;
var default_llm = "gemini-2.5-flash-lite";

function xhr_error(xhr) { //{{{
  if (xhr.responseJSON && xhr.responseJSON.error) {
    return xhr.responseJSON.error;
  }
  if (xhr.responseText) {
    return 'LLM Service not reachable (request status ' + xhr.status + ')!'
  }
  return xhr.statusText;
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

function call_llm_text_service(prompt,llms,action) { //{{{
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
      ui.success(llms,data.status);
    },
    error:  function(xhr, stat, data) {
      ui.error(llms,xhr_error(xhr));
    }
  });
} //}}}

function diff_summary_rec(el, nodes) { //{{{
  function hash_str(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36);
  }

  function serialize_clean(node) {
    let clone = node.cloneNode(true);
    (function strip(n){
      for (let i = n.childNodes.length - 1; i >= 0; i--) {
        let c = n.childNodes[i];
        if (c.nodeType === 3 && /^\s*$/.test(c.nodeValue)) { n.removeChild(c); }
        else if (c.nodeType === 1) { strip(c); }
      }
    })(clone);
    return new XMLSerializer().serializeToString(clone);
  }

  $(el).children().each(function(){
    let child = this;
    let id = child.getAttribute('id');
    let eid = child.getAttribute('eid');
    if (id !== null) {
      let fields = {};
      for (let i = 0; i < child.attributes.length; i++) {
        fields[child.attributes[i].name] = child.attributes[i].value;
      }
      $(child).children().each(function(){
        let name = this.localName || this.nodeName;
        if (name === 'parameters') {
          $(this).children().each(function(){
            let pname = this.localName || this.nodeName;
            fields[pname] = serialize_clean(this);
          });
        } else {
          fields[name] = serialize_clean(this);
        }
      });
      nodes.push({ id: id, type: 'task', fingerprint: hash_str(serialize_clean(child)), fields: fields });
    } else if (eid !== null) {
      let fields = {};
      for (let i = 0; i < child.attributes.length; i++) {
        fields[child.attributes[i].name] = child.attributes[i].value;
      }
      let attr_parts = Object.keys(fields).sort().map(function(k){ return k + '=' + fields[k]; });
      let child_parts = [];
      $(child).children().each(function(){
        let name = this.localName || this.nodeName;
        if (name.charAt(0) === '_') {
          let serialized = serialize_clean(this);
          fields[name] = serialized;
          child_parts.push(serialized);
        }
      });
      let branch_names = ['parallel_branch','alternative','otherwise'];
      let tag_name = child.localName || child.nodeName;
      let type = branch_names.indexOf(tag_name) !== -1 ? 'branch' : 'gateway';
      nodes.push({ id: eid, type: type, fingerprint: hash_str(attr_parts.concat(child_parts).join('|')), fields: fields });
    }
    diff_summary_rec(child, nodes);
  });
} //}}}
function diff_summary(model_old, model_new) { //{{{
  // depth_first traverse both model_old and model_new:
  // all elements with an attribute @id are tasks
  // all elements with an attribute @eid are a gateway, except parallel_branch, alternative and otherwise elements, which are a branch
  // these are the ones included in the list that results from traversal
  // while traversing:
  // for any element that has an @id calculate a fingerprint that contains the whole content
  // for any element that has an @eid calculate a fingerprint for all its attributes and direct children elements whos name starts with a _

  // after traversal: compare the old_nodes with the new_nodes list by their ids and types (task, gateway)
  // if nodes are in the old_nodes but not in the new_nodes they have been deleted
  // if nodes are in the new_nodes but not in the old_nodes they have been added
  // if nodes of the old_nodes are in a new position in the new_nodes they have been moved
  // if the fingerprint of nodes is not identical, their parameters have been changed
  // if the fingerprint of nodes is not identical, investigate which children or attributes of the nodes have differnt text content

  // collect all the changes

  // if more that 3 nodes are affected by any change summarize, combining types that share the same operation: "7 tasks, 3 gateways, and 2 branches have been added, 1 task has been changed"
  // if 3 or less nodes are affected name them "Tasks a3, a2 and a1 have been moved. Parameters of node a1 have been changed."
  // More examples: Task a1 had the attribute "color" changed.
  // More examples: Task a1 had its "color" changed.
  // More examples: Task a1 had its "parameters" changed.

  // the function returns the textual summary of the differences.

  function to_root(model) {
    if (typeof model === 'string') { return $X(model).get(0); }
    if (model && model.jquery) { return model.get(0); }
    return model;
  }

  let old_nodes = [];
  let new_nodes = [];
  diff_summary_rec(to_root(model_old), old_nodes);
  diff_summary_rec(to_root(model_new), new_nodes);

  let old_index = {};
  old_nodes.forEach(function(n,i){ old_index[n.type + ':' + n.id] = { pos: i, node: n }; });
  let new_index = {};
  new_nodes.forEach(function(n,i){ new_index[n.type + ':' + n.id] = { pos: i, node: n }; });

  let added = [];
  let deleted = [];
  let moved = [];
  let changed = [];

  old_nodes.forEach(function(n){
    if (!(n.type + ':' + n.id in new_index)) { deleted.push({ id: n.id, type: n.type }); }
  });
  new_nodes.forEach(function(n){
    if (!(n.type + ':' + n.id in old_index)) { added.push({ id: n.id, type: n.type }); }
  });

  let common_old_order = old_nodes.filter(function(n){ return (n.type + ':' + n.id) in new_index; }).map(function(n){ return n.type + ':' + n.id; });
  let common_new_order = new_nodes.filter(function(n){ return (n.type + ':' + n.id) in old_index; }).map(function(n){ return n.type + ':' + n.id; });
  let new_pos_of = {};
  common_new_order.forEach(function(key,i){ new_pos_of[key] = i; });

  // longest increasing subsequence of new-positions (in old order): the nodes that
  // stay in relative order across both versions, i.e. did NOT move. Everything else
  // did move. This avoids flagging every node between an actually-moved node's old
  // and new position as "moved" too.
  let seq = common_old_order.map(function(key){ return new_pos_of[key]; });
  let dp = new Array(seq.length).fill(1);
  let prev = new Array(seq.length).fill(-1);
  let best = -1;
  for (let i = 0; i < seq.length; i++) {
    for (let j = 0; j < i; j++) {
      if (seq[j] < seq[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        prev[i] = j;
      }
    }
    if (best === -1 || dp[i] > dp[best]) { best = i; }
  }
  let in_lis = new Array(seq.length).fill(false);
  for (let k = best; k !== -1; k = prev[k]) { in_lis[k] = true; }

  common_old_order.forEach(function(key,i){
    let old_entry = old_index[key];
    let new_entry = new_index[key];
    let id = old_entry.node.id;
    let type = old_entry.node.type;
    if (!in_lis[i]) { moved.push({ id: id, type: type }); }
    if (old_entry.node.fingerprint !== new_entry.node.fingerprint) {
      let old_fields = old_entry.node.fields;
      let new_fields = new_entry.node.fields;
      let field_names = Array.from(new Set(Object.keys(old_fields).concat(Object.keys(new_fields))));
      let diff_fields = field_names.filter(function(f){ return old_fields[f] !== new_fields[f]; });
      changed.push({ id: id, type: type, fields: diff_fields });
    }
  });

  function join_names(names) {
    if (names.length <= 1) { return names.join(''); }
    if (names.length === 2) { return names[0] + ' and ' + names[1]; }
    return names.slice(0,-1).join(', ') + ' and ' + names[names.length-1];
  }

  function type_word(type, count) {
    if (type === 'task') { return count === 1 ? 'task' : 'tasks'; }
    if (type === 'branch') { return count === 1 ? 'branch' : 'branches'; }
    return count === 1 ? 'gateway' : 'gateways';
  }

  let affected = new Set(added.concat(deleted,moved,changed).map(function(e){ return e.type + ':' + e.id; }));
  if (affected.size === 0) {
    return "No changes to the model have been made.";
  }

  const categories = ['added','deleted','moved','changed'];
  const lists = { added: added, deleted: deleted, moved: moved, changed: changed };

  if (affected.size > 3) {
    const action = { added: 'been added', deleted: 'been deleted', moved: 'been moved', changed: 'been changed' };
    function join_oxford(items) {
      if (items.length <= 1) { return items.join(''); }
      if (items.length === 2) { return items[0] + ' and ' + items[1]; }
      return items.slice(0,-1).join(', ') + ', and ' + items[items.length-1];
    }
    let parts = [];
    categories.forEach(function(c){
      let type_counts = ['task','gateway','branch'].map(function(t){
        return { type: t, count: lists[c].filter(function(e){ return e.type === t; }).length };
      }).filter(function(tc){ return tc.count > 0; });
      if (type_counts.length === 0) { return; }
      let pieces = type_counts.map(function(tc){ return tc.count + ' ' + type_word(tc.type, tc.count); });
      let total = type_counts.reduce(function(sum,tc){ return sum + tc.count; }, 0);
      let verb = total === 1 ? 'has' : 'have';
      parts.push(join_oxford(pieces) + ' ' + verb + ' ' + action[c]);
    });
    let text = parts.join(', ') + '.';
    return text.charAt(0).toUpperCase() + text.slice(1);
  } else {
    let sentences = [];
    const action = { added: 'added', deleted: 'deleted', moved: 'moved' };
    categories.forEach(function(c){
      if (c === 'changed') { return; }
      ['task','gateway','branch'].forEach(function(t){
        let entries = lists[c].filter(function(e){ return e.type === t; });
        if (entries.length === 0) { return; }
        let names = join_names(entries.map(function(e){ return e.id; }));
        let subj = type_word(t, entries.length);
        subj = subj.charAt(0).toUpperCase() + subj.slice(1) + ' ';
        let verb = entries.length === 1 ? ' has been ' : ' have been ';
        sentences.push(subj + names + verb + action[c] + '.');
      });
    });
    lists.changed.forEach(function(e){
      let subj = e.type === 'task' ? 'Task ' : (e.type === 'branch' ? 'Branch ' : 'Gateway ');
      let field_text;
      if (e.fields.length === 0) {
        field_text = 'parameters';
      } else if (e.fields.length === 1) {
        field_text = e.fields[0];
      } else {
        field_text = join_names(e.fields);
      }
      sentences.push(subj + e.id + ' had its "' + field_text + '" changed.');
    });
    return sentences.join(' ');
  }
} //}}}

function set_cpee_model(cpee_xml,expositions=[]) { //{{{
  let root = $X(cpee_xml).get(0);
  if (root.childElementCount === 0) {
    root.textContent = '';
    cpee_xml = new XMLSerializer().serializeToString(root);
  }

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

function empty_model(){ //{{{
  set_cpee_model('<description xmlns="http://cpee.org/ns/description/1.0" xmlns:a="http://cpee.org/ns/annotation/1.0"/>',["Reset Context!"]);
  $('#dat_details').empty();
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
    ui.clean();
    add_prompt('prompt',reader.result);
  }
  reader.onerror = function(){ console.log("reader error"); }
  reader.onabort = function(){ console.log("reader abort"); }
  reader.readAsText(files[0]);
} //}}}

function create(prompt,llms,generation,mode) {
  ui.clean();

  // Imagine I want to implement a smart home system to control the lights in
  // the dining room.  Depending on the current lighting conditions, the
  // system would automatically adjust the brightness—either increasing or
  // reducing it as needed—and turn the lights off completely at night.

  let input = prompt.text(); prompt.empty();
  ui.input(llms,input);
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

  ui.querying(llms,'creates model');
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
      set_cpee_model(model.serializePrettyXML(),expositions);

      ui.success(llms,diff_summary(last_model_before_generation,model));
    } else {
      if (gen == "dataflow") {
        ui.querying(llms,'selects endpoints and calculates dataflow');
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

          ui.querying(llms,'validates dataflow');
          expositions.push("# Dataflow:\n"+data.dataflow);
          call_llm_service_validation($X(data.output_cpee).serializePrettyXML(),myllm).done((data) => {
            // for undo button
            last_model_before_generation = save['dslx'];
            set_cpee_model($X(data.output_cpee).serializePrettyXML(),expositions);
            ui.success(llms,diff_summary(last_model_before_generation,data.output_cpee));
          });

        })
        .fail((xhr) => {
          ui.error(llms,xhr_error(xhr));
        });
      } else if (gen == "model") {
        last_model_before_generation = save['dslx'];
        set_cpee_model(data.output_cpee,expositions);
        ui.success(llms,diff_summary(last_model_before_generation,data.output_cpee));
      } else {
        ui.success(llms,"Successfully done nothing");
      }
    }
  })
  .fail((xhr) => {
    ui.error(llms,xhr_error(xhr));
  });
}

$(document).ready(async function() { //{{{
  let llm_inactive = await $.get('css/llm_inactive.svg', 'xml').then(function(data) { return $(data.documentElement); });
  let llm_active = await $.get('css/llm_active.svg', 'xml').then(function(data) { return $(data.documentElement); });

  let mode_inactive = await $.get('css/mode_inactive.svg', 'xml').then(function(data) { return $(data.documentElement); });
  let mode_active = await $.get('css/mode_active.svg', 'xml').then(function(data) { return $(data.documentElement); });

  $(document).on('keydown','#prompt',function(e){
    ui.clean();
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      create($('#prompt'),$('#llms'),$('#generation'),$('#mode'));
    }
  });
  $(document).on('click','#prompt_submit_button',function(e){
    create($('#prompt'),$('#llms'),$('#generation'),$('#mode'));
  });
  $(document).on('click','#prompt_reset_button',function(e){
    ui.clean();
    empty_model();
  });
  $(document).on('click','#generate_itext_button',function(e){
    ui.clean();
    ui.querying($('#llms'),'thinks');
    call_llm_text_service('prompt','#llms','file');
  });
  $(document).on('click','#generate_text_button',function(e){
    ui.clean();
    ui.querying($('#llms'),'thinks');
    call_llm_text_service($('#prompt'),$('#llms'),'show');
  });
  $(document).on('click','#prompt_undo_button',function(e){
    ui.clean();
    ui.querying($('#llms'),'thinks');
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
