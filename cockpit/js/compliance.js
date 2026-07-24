var latestComplianceResult = null;

$(document).ready(function() { //{{{
  $.ajax({
    type: "GET",
    url: "rngs/requirements.rng",
    dataType: "xml",
    success: function(rng){
      save['requirements'] = new RelaxNGui(rng,$('#dat_requirements'));
      initialize_nl_requirements_from_saved_requirements();
    }
  });

  initialize_nl_requirements_tab();

  function loadComplianceLog(uuid, options) {
    var renderOptions = options || {};
    var baseUrl = 'https://cpee.org/comp-log/';
    var currentUrl = baseUrl + uuid + '.xes.yaml';
    var allUrl    = baseUrl + uuid + '.all.xes.yaml';

    $('#comp-verify-all-log').attr('href', allUrl).show();

    function tryLoad(url, fallback) {
      $.ajax({
        type: 'GET',
        url: url,
        dataType: 'text',
        success: function(yaml) {
          $('#comp-verify-current-log').attr('href', url).text(url.split('/').pop()).show();
          displayComplianceMessages(yaml, renderOptions);
        },
        error: function() {
          if (fallback) {
            tryLoad(fallback, null);
          } else {
            $('#comp-verify_log').html('<p>Could not load compliance log.</p>');
          }
        }
      });
    }

    tryLoad(currentUrl, baseUrl + uuid + '.current.xes.yaml');
  }

  function getCurrentTestsetXml(onSuccess, onError) {
    if (typeof get_testset !== 'function') {
      onError('Could not collect the current testset XML.');
      return;
    }

    var deferred = new $.Deferred();

    deferred.done(function(_name, testset) {
      if (!testset || typeof testset.serializePrettyXML !== 'function') {
        onError('Could not serialize testset XML.');
        return;
      }

      onSuccess(testset.serializePrettyXML());
    });

    deferred.fail(function() {
      onError('Could not load the current testset.');
    });

    get_testset(deferred);
  }

  function extractDescriptionXmlFromTestset(testsetXml) {
    var xmlDoc = $.parseXML(testsetXml);
    var descriptionContainer = xmlDoc.getElementsByTagName('description')[0];

    if (!descriptionContainer) {
      return null;
    }

    var descriptionNode = null;
    for (var i = 0; i < descriptionContainer.childNodes.length; i++) {
      var child = descriptionContainer.childNodes[i];
      if (child.nodeType === 1) {
        descriptionNode = child;
        break;
      }
    }

    if (!descriptionNode) {
      return null;
    }

    return new XMLSerializer().serializeToString(descriptionNode);
  }

  function extractAttributesFromTestset(testsetXml) {
    var attributes = {};
    var xmlDoc = $.parseXML(testsetXml);
    var attributesContainer = xmlDoc.getElementsByTagName('attributes')[0];

    if (!attributesContainer) {
      return attributes;
    }

    for (var i = 0; i < attributesContainer.childNodes.length; i++) {
      var child = attributesContainer.childNodes[i];
      if (child.nodeType !== 1) {
        continue;
      }
      attributes[child.localName || child.nodeName] = (child.textContent || '').trim();
    }

    return attributes;
  }

  function extractInstanceId() {
    var currentInstanceUrl = $('body').attr('current-instance') || '';
    var match = currentInstanceUrl.match(/\/(\d+)\/?$/);
    return match ? parseInt(match[1], 10) : null;
  }

  function buildSubscriptionLikeNotification(testsetXml, uuid) {
    var attributes = extractAttributesFromTestset(testsetXml);
    var descriptionXml = extractDescriptionXmlFromTestset(testsetXml);

    if (!descriptionXml) {
      throw new Error('Could not extract description XML from testset.');
    }

    var instanceId = extractInstanceId();

    return {
      cpee: $('body').attr('current-base') || '',
      'instance-url': $('body').attr('current-instance') || '',
      instance: instanceId,
      topic: 'description',
      type: 'event',
      name: 'change',
      timestamp: new Date().toISOString(),
      content: {
        attributes: attributes,
        description: descriptionXml,
        testset: testsetXml,
      },
      'instance-uuid': uuid,
      'instance-name': (attributes.info || 'semantic-verify'),
    };
  }

  $("#verify").click(function(){
    var uuid = save.attributes_raw && save.attributes_raw.uuid;
    if (!uuid) {
      $('#comp-verify_log').html('<p>No instance loaded.</p>');
      return;
    }

    loadComplianceLog(uuid);
  });

  $("#semantic_verify").click(function(){
    var uuid = save.attributes_raw && save.attributes_raw.uuid;
    if (!uuid) {
      $('#comp-verify_log').html('<p>No instance loaded.</p>');
      return;
    }

    $('#comp-verify_log').html('<p>Preparing semantic verification payload...</p>');

    getCurrentTestsetXml(
      function(testsetXml) {
        $('#comp-verify_log').html('<p>Running semantic verification...</p>');

        var notification;
        try {
          notification = buildSubscriptionLikeNotification(testsetXml, uuid);
        } catch (error) {
          $('#comp-verify_log').html('<p>' + escapeHtml(error.message || 'Failed to build semantic verification payload.') + '</p>');
          return;
        }

        var formData = new FormData();
        formData.append('notification', JSON.stringify(notification));
        formData.append('type', 'event');
        formData.append('topic', 'description');
        formData.append('event', 'change');

        $.ajax({
          method: 'POST',
          type: 'POST',
          url: 'https://power.bpm.cit.tum.de/compliance/SubscriberSemantic',
          data: formData,
          processData: false,
          contentType: false,
          dataType: 'text',
          success: function(_response, _textStatus, xhr) {
            if (xhr && xhr.status === 200) {
              loadComplianceLog(uuid, { semantic: true });
              return;
            }

            var body = xhr && xhr.responseText ? xhr.responseText : 'Semantic verification returned an unexpected response.';
            $('#comp-verify_log').html('<pre>' + escapeHtml(body) + '</pre>');
          },
          error: function(xhr) {
            var body = xhr && xhr.responseText ? xhr.responseText : 'Semantic verification failed.';
            $('#comp-verify_log').html('<pre>' + escapeHtml(body) + '</pre>');
          }
        });
      },
      function(message) {
        $('#comp-verify_log').html('<p>' + escapeHtml(message) + '</p>');
      }
    );
  });

  $("#identify-violations").click(function(){
    var uuid = save.attributes_raw && save.attributes_raw.uuid;
    if (!uuid) {
      $('#comp-repair_log').html('<p>No instance loaded.</p>');
      return;
    }

    $('#comp-repair_log').html('<p>Loading compliance log...</p>');

    var baseUrl = 'https://cpee.org/comp-log/';
    var currentUrl = baseUrl + uuid + '.xes.yaml';

    function tryLoad(url, fallback) {
      $.ajax({
        type: 'GET',
        url: url,
        dataType: 'text',
        success: function(yaml) {
          var formData = new FormData();
          var fileName = uuid + '.xes.yaml';
          formData.append(
            'file',
            new Blob([yaml], { type: 'text/yaml' }),
            fileName
          );

          $('#comp-repair_log').html('<p>Identifying violations...</p>');

          $.ajax({
            type: 'POST',
            url: 'https://power.bpm.cit.tum.de/comprepair/violations',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function(result) {
              latestComplianceResult = result;
              renderViolationMessages(result);
            },
            error: function(xhr) {
              var detail = xhr && xhr.responseText ? xhr.responseText : 'Unknown error';
              $('#comp-repair_log').html('<p>Violation identification failed: ' + $('<span>').text(detail).html() + '</p>');
            }
          });
        },
        error: function() {
          if (fallback) {
            tryLoad(fallback, null);
          } else {
            $('#comp-repair_log').html('<p>Could not load compliance log.</p>');
          }
        }
      });
    }

    tryLoad(currentUrl, baseUrl + uuid + '.current.xes.yaml');
  });

  $("#repair-violations").click(function(){
    var uuid = save.attributes_raw && save.attributes_raw.uuid;
    if (!uuid) {
      $('#comp-repair_log').html('<p>No instance loaded.</p>');
      return;
    }

    if (!latestComplianceResult) {
      $('#comp-repair_log').html('<p>No compliance result available. Run Identify Violations first.</p>');
      return;
    }

    var originalPstXml = getCurrentProcessXml();
    if (!originalPstXml) {
      $('#comp-repair_log').html('<p>Could not extract the current process XML.</p>');
      return;
    }

    var formData = new FormData();
    formData.append(
      'original_pst',
      new Blob([originalPstXml], { type: 'application/xml' }),
      'original_pst.xml'
    );
    formData.append(
      'compliance_result',
      new Blob([JSON.stringify(latestComplianceResult)], { type: 'application/json' }),
      'compliance_result.json'
    );

    $('#comp-repair_log').html('<p>Repairing violations...</p>');

    $.ajax({
      type: 'POST',
      url: 'https://power.bpm.cit.tum.de/comprepair/repair_full',
      data: formData,
      processData: false,
      contentType: false,
      dataType: 'json',
      success: function(result) {
        if (hasResolutionStrategies(result)) {
          renderResolutionStrategies(result);
          return;
        }

        var pretty = JSON.stringify(result, null, 2);
        $('#comp-repair_log').html('<pre>' + escapeHtml(pretty) + '</pre>');
      },
      error: function(xhr) {
        var detail = xhr && xhr.responseText ? xhr.responseText : 'Unknown error';
        $('#comp-repair_log').html('<p>Repair failed: ' + escapeHtml(detail) + '</p>');
      }
    });
  });

  document.addEventListener('attributes:changed', function (e) {
    let req = $X("<requirements xmlns='http://cpee.org/ns/properties/2.0'/>");
    let reqs;
    let regex = /\"\s*=>\s*"/g
    if (save.attributes_raw.requirements.match(regex)) {
      reqs = save.attributes_raw.requirements.replace(regex,"\":\"");
    } else {
      reqs = save.attributes_raw.requirements;
    }
    reqj = JSON.parse(reqs);
    for (let key in reqj) {
      let ele = $X("<" + key + " xmlns='http://cpee.org/ns/properties/2.0'/>");
          ele.text(reqj[key]);
      req.append(ele);
    }
    save['requirements'].content(req);
    sync_nl_rows_to_requirement_keys(reqj);

    let nlReqj = parse_saved_object(save.attributes_raw['NL-requirements']);
    sync_nl_rows_to_requirement_keys(nlReqj);
    apply_nl_requirements_values(nlReqj);
  });

  var timer;
  // when input in one of the inputs, save
  $(document).on('input','#dat_requirements input',function(event){
    clearTimeout(timer);
    timer = setTimeout(function(){ do_requirements_save(event); }, 5000);
  });
  $(document).on('relaxngui_remove', '#dat_requirements', function(event){
    clearTimeout(timer);
    sync_nl_rows_to_requirement_keys(read_requirements_object(), true);
    do_nl_requirements_save(event);
    do_requirements_save(event);
  });
  $(document).on('relaxngui_move', '#dat_requirements', function(event){
    clearTimeout(timer);
    do_requirements_save(event);
  });
  $(document).on('relaxngui_change', '#dat_requirements', function(event){
    clearTimeout(timer);
    do_requirements_save(event);
  });

  var nlTimer;
  $(document).on('input', '#dat_nlrequirements .nlreq-text', function(event){
    clearTimeout(nlTimer);
    nlTimer = setTimeout(function(){ do_nl_requirements_save(event); }, 2000);
  });
}); //}}}

function initialize_nl_requirements_tab() { //{{{
  $('#nlreq_add').on('click', function() {
    add_nl_requirement_row();
    do_nl_requirements_save();
  });

  $(document).on('click', '.nlreq-extract', function() {
    var row = $(this).closest('.nlreq-row');
    var requirementId = row.attr('data-requirement-id');
    var naturalText = row.find('.nlreq-text').val().trim();
    var status = row.find('.nlreq-status');
    var button = $(this);

    if (!naturalText) {
      status.text('Enter text').removeClass('ok').addClass('error');
      return;
    }
    if (!save['requirements']) {
      status.text('Not ready').removeClass('ok').addClass('error');
      return;
    }

    status.text('Extracting...').removeClass('ok error');
    button.prop('disabled', true);

    extract_ast_from_natural_language(
      naturalText,
      function(ast) {
        upsert_requirement_ast(requirementId, ast);
        do_nl_requirements_save();
        status.text('Added').removeClass('error').addClass('ok');
        button.prop('disabled', false);
      },
      function(message) {
        status.text(message || 'Failed').removeClass('ok').addClass('error');
        button.prop('disabled', false);
      }
    );
  });

  if ($('#dat_nlrequirements .nlreq-row').length === 0) {
    add_nl_requirement_row();
  }
} //}}}

function initialize_nl_requirements_from_saved_requirements() { //{{{
  if (!save['requirements']) {
    return;
  }
  var reqObject = read_requirements_object();
  sync_nl_rows_to_requirement_keys(reqObject);
} //}}}

function add_nl_requirement_row(requirementId, textValue) { //{{{
  var rid = requirementId || next_requirement_id();
  if ($('#dat_nlrequirements .nlreq-row[data-requirement-id="' + rid + '"]').length > 0) {
    return;
  }

  var row = $('<div class="nlreq-row"></div>').attr('data-requirement-id', rid);
  row.append('<button type="button" class="nlreq-extract">Extract</button>');
  row.append($('<span class="nlreq-id"></span>').text(rid));
  row.append(
    $('<input type="text" class="nlreq-text" placeholder="Write natural-language requirement"/>')
      .val(textValue || '')
  );
  row.append('<span class="nlreq-status"></span>');
  $('#dat_nlrequirements').append(row);
} //}}}

function sync_nl_rows_to_requirement_keys(requirementsObject, pruneMissing) { //{{{
  if (!requirementsObject || typeof requirementsObject !== 'object') {
    return;
  }

  var keys = Object.keys(requirementsObject);

  if (pruneMissing) {
    $('#dat_nlrequirements .nlreq-row').each(function() {
      var rid = $(this).attr('data-requirement-id');
      if (rid && keys.indexOf(rid) === -1) {
        $(this).remove();
      }
    });
  }

  keys.forEach(function(key) {
    if ($('#dat_nlrequirements .nlreq-row[data-requirement-id="' + key + '"]').length === 0) {
      add_nl_requirement_row(key, '');
    }
  });
} //}}}

function next_requirement_id() { //{{{
  var maxId = 0;
  $('#dat_nlrequirements .nlreq-row').each(function() {
    var rid = $(this).attr('data-requirement-id') || '';
    var m = rid.match(/^R(\d+)$/);
    if (m) {
      maxId = Math.max(maxId, parseInt(m[1], 10));
    }
  });

  var currentReqs = read_requirements_object();
  Object.keys(currentReqs).forEach(function(key) {
    var m = key.match(/^R(\d+)$/);
    if (m) {
      maxId = Math.max(maxId, parseInt(m[1], 10));
    }
  });

  return 'R' + (maxId + 1);
} //}}}

function upsert_requirement_ast(requirementId, astText) { //{{{
  var reqObject = read_requirements_object();
  reqObject[requirementId] = astText;
  write_requirements_object(reqObject);
} //}}}

function read_requirements_object() { //{{{
  if (!save['requirements']) {
    return {};
  }

  var raw = save['requirements'].save_json();
  if (raw == null || raw === '') {
    return {};
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }
  if (typeof raw === 'object') {
    return raw;
  }
  return {};
} //}}}

function parse_saved_object(raw) { //{{{
  if (raw == null || raw === '') {
    return {};
  }
  if (typeof raw === 'object') {
    return raw;
  }
  if (typeof raw === 'string') {
    var normalized = raw;
    if (/\"\s*=>\s*"/g.test(normalized)) {
      normalized = normalized.replace(/\"\s*=>\s*"/g, '\":\"');
    }
    try {
      return JSON.parse(normalized);
    } catch (e) {
      return {};
    }
  }
  return {};
} //}}}

function apply_nl_requirements_values(nlReqObject) { //{{{
  if (!nlReqObject || typeof nlReqObject !== 'object') {
    return;
  }

  Object.keys(nlReqObject).forEach(function(key) {
    var row = $('#dat_nlrequirements .nlreq-row[data-requirement-id="' + key + '"]');
    if (row.length > 0) {
      row.find('.nlreq-text').val(nlReqObject[key] || '');
    }
  });
} //}}}

function read_nl_requirements_object_from_ui() { //{{{
  var data = {};
  $('#dat_nlrequirements .nlreq-row').each(function() {
    var requirementId = $(this).attr('data-requirement-id');
    if (!requirementId) {
      return;
    }
    var text = $(this).find('.nlreq-text').val();
    data[requirementId] = text == null ? '' : String(text);
  });
  return data;
} //}}}

function write_requirements_object(reqObject) { //{{{
  let req = $X("<requirements xmlns='http://cpee.org/ns/properties/2.0'/>");
  Object.keys(reqObject)
    .sort(sort_requirement_ids)
    .forEach(function(key) {
      let ele = $X("<" + key + " xmlns='http://cpee.org/ns/properties/2.0'/>");
      ele.text(reqObject[key]);
      req.append(ele);
    });
  save['requirements'].content(req);
  do_requirements_save({ target: $('#dat_requirements')[0] });
} //}}}

function sort_requirement_ids(a, b) { //{{{
  var am = String(a).match(/^R(\d+)$/);
  var bm = String(b).match(/^R(\d+)$/);
  if (am && bm) {
    return parseInt(am[1], 10) - parseInt(bm[1], 10);
  }
  return String(a).localeCompare(String(b));
} //}}}

function extract_ast_from_natural_language(naturalText, onSuccess, onError) { //{{{
  var configuredEndpoint = $('body').attr('data-singlerule-endpoint') || '/compextract/singlerule';
  var url = absolute_extract_url(configuredEndpoint);
  var fallbackUrl = absolute_extract_url(configuredEndpoint.replace(/\/?singlerule\/?$/, '/text'));

  var attempts = [
    { url: url, payload: { rule: naturalText } },
    { url: url, payload: { text: naturalText } }
  ];
  if (fallbackUrl !== url) {
    attempts.push({ url: fallbackUrl, payload: { text: naturalText } });
  }

  run_extract_attempt(attempts, 0, onSuccess, onError);
} //}}}

function run_extract_attempt(attempts, index, onSuccess, onError) { //{{{
  if (index >= attempts.length) {
    onError('Extract failed');
    return;
  }

  var attempt = attempts[index];
  $.ajax({
    type: 'POST',
    url: attempt.url,
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify(attempt.payload),
    success: function(response) {
      var ast = parse_extracted_ast(response);
      if (ast) {
        onSuccess(ast);
      } else {
        run_extract_attempt(attempts, index + 1, onSuccess, onError);
      }
    },
    error: function() {
      run_extract_attempt(attempts, index + 1, onSuccess, onError);
    }
  });
} //}}}

function parse_extracted_ast(response) { //{{{
  if (!response) {
    return null;
  }

  if (typeof response.rule === 'string' && response.rule.trim()) {
    return response.rule.trim();
  }

  var payload = response.asts != null ? response.asts : response.ast;
  if (payload == null) {
    return null;
  }

  if (typeof payload === 'string') {
    var trimmed = payload.trim();
    if (!trimmed) {
      return null;
    }
    try {
      var parsed = JSON.parse(trimmed);
      return first_rule_from_payload(parsed) || trimmed;
    } catch (e) {
      return trimmed;
    }
  }

  return first_rule_from_payload(payload);
} //}}}

function first_rule_from_payload(payload) { //{{{
  if (!payload) {
    return null;
  }
  if (typeof payload.rule === 'string' && payload.rule.trim()) {
    return payload.rule.trim();
  }
  if (payload.ast && typeof payload.ast === 'object') {
    var nested = first_rule_from_payload(payload.ast);
    if (nested) {
      return nested;
    }
  }
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return null;
    }
    return typeof payload[0] === 'string' ? payload[0] : JSON.stringify(payload[0]);
  }
  if (payload.rules && Array.isArray(payload.rules) && payload.rules.length > 0) {
    return typeof payload.rules[0] === 'string' ? payload.rules[0] : JSON.stringify(payload.rules[0]);
  }
  if (payload.rules && typeof payload.rules === 'string') {
    return payload.rules;
  }
  if (typeof payload === 'object') {
    return JSON.stringify(payload);
  }
  return null;
} //}}}

function absolute_extract_url(endpoint) { //{{{
  if (/^https?:\/\//.test(endpoint)) {
    return endpoint;
  }
  if (endpoint.charAt(0) !== '/') {
    endpoint = '/' + endpoint;
  }
  return window.location.origin + endpoint;
} //}}}

function displayComplianceMessages(yaml, options) { //{{{
  var renderOptions = options || {};
  var semanticMode = !!renderOptions.semantic;
  var messages = [];
  var parts = yaml.split(/\n---\s*\n/);

  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (!part.match(/^event:/m)) continue;

    // No /m flag: $ matches end-of-string only, preventing premature match on
    // the first line of a multi-line YAML single-quoted scalar.
    var m = part.match(/\n  data:\s*([\s\S]*?)(?=\n  [a-zA-Z]|\s*$)/);
    if (!m) continue;

    var val = m[1].trim();
    if (!val) continue;

    // Remove surrounding YAML flow-scalar single quotes and unescape ''
    if (val.charAt(0) === "'" && val.charAt(val.length - 1) === "'") {
      val = val.slice(1, -1).replace(/''/g, "'");
    }
    // Collapse multi-line continuation whitespace (incl. column-0 continuations)
    val = val.replace(/\n[ \t]*/g, ' ').trim();

    messages.push(val);
  }

  if (semanticMode) {
    var firstRequirementIndex = -1;
    for (var k = 0; k < messages.length; k++) {
      if (/^Verifying Requirement R/.test(messages[k])) {
        firstRequirementIndex = k;
        break;
      }
    }

    if (firstRequirementIndex >= 0) {
      messages = messages.slice(firstRequirementIndex);
    }
  }

  if (messages.length === 0) {
    $('#comp-verify_log').html('<div>No messages found.</div>');
    return;
  }

  var html = semanticMode ? '' : '<div>Pre-Tests</div>';
  for (var j = 0; j < messages.length; j++) {
    var msg = messages[j];
    var isHeader = /^Verifying Requirement R/.test(msg) || /^Requirement R/.test(msg);
    var cls = isHeader ? '' : ' class="indent"';
    html += '<div' + cls + '>' + $('<span>').text(msg).html() + '</div>';
  }
  $('#comp-verify_log').html(html);
} //}}}

function renderViolationMessages(result) { //{{{
  var violations = Array.isArray(result && result.violations)
    ? result.violations
    : [];

  var html = '<div>Violations:</div>';

  if (violations.length === 0) {
    html += '<div class="indent">None</div>';
    $('#comp-repair_log').html(html);
    return;
  }

  for (var i = 0; i < violations.length; i++) {
    var violation = violations[i] || {};
    var requirementId = violation.requirement_id || 'unknown';

    html += '<div class="indent">' + escapeHtml(requirementId) + '</div>';

    var evidenceList = Array.isArray(violation.evidence)
      ? violation.evidence
      : [];

    for (var j = 0; j < evidenceList.length; j++) {
      html += '<div class="indent indent-level-2">'
        + escapeHtml(String(evidenceList[j]))
        + '</div>';
    }
  }

  $('#comp-repair_log').html(html);
} //}}}

function hasResolutionStrategies(result) { //{{{
  return !!(
    result
    && Array.isArray(result.resolution_strategies)
  );
} //}}}

function renderResolutionStrategies(result) { //{{{
  var strategies = result.resolution_strategies;

  if (!Array.isArray(strategies)) {
    var pretty = JSON.stringify(result, null, 2);
    $('#comp-repair_log').html('<pre>' + escapeHtml(pretty) + '</pre>');
    return;
  }

  var html = '';

  for (var i = 0; i < strategies.length; i++) {
    var strategy = strategies[i] || {};
    var requirementId = strategy.requirement_id || 'unknown';
    var changeDescription = strategy.change_description || strategy.resolution_strategy || 'N/A';
    var riskValue = extractRiskValue(strategy.change_risk);
    var status = typeof strategy.status === 'string' ? strategy.status.toLowerCase() : '';
    var pstXml = typeof strategy.pst_xml === 'string' ? strategy.pst_xml : '';

    html += '<div>Resolution ' + escapeHtml(requirementId) + ':</div>';
    html += '<div class="indent">Repair Action: ' + escapeHtml(changeDescription) + '</div>';
    html += '<div class="indent">Risk: ' + escapeHtml(riskValue) + '</div>';

    if (status === 'success' && pstXml) {
      html += '<div class="indent">PST: ' + buildPstDownloadLink(pstXml, requirementId, i) + '</div>';
    } else {
      html += '<div class="indent error">Error</div>';
    }
  }

  if (html === '') {
    html = '<pre>' + escapeHtml(JSON.stringify(result, null, 2)) + '</pre>';
  }

  $('#comp-repair_log').html(html);
} //}}}

function extractRiskValue(changeRisk) { //{{{
  if (changeRisk && typeof changeRisk === 'object') {
    if (typeof changeRisk.value === 'string' && changeRisk.value.trim()) {
      return changeRisk.value.trim();
    }
  }

  if (typeof changeRisk === 'string' && changeRisk.trim()) {
    return changeRisk.trim();
  }

  return 'N/A';
} //}}}

function buildPstDownloadLink(pstXml, requirementId, index) { //{{{
  var blob = new Blob([pstXml], { type: 'application/xml' });
  var url = URL.createObjectURL(blob);
  var fileName = 'resolution_' + requirementId + '_' + index + '.xml';
  return '<a href="' + escapeHtml(url) + '" download="' + escapeHtml(fileName) + '">Download the PST</a>';
} //}}}

function escapeHtml(value) { //{{{
  return $('<span>').text(value == null ? '' : String(value)).html();
} //}}}

function getCurrentProcessXml() { //{{{
  if (
    save['graph_adaptor']
    && typeof save['graph_adaptor'].get_description === 'function'
  ) {
    return save['graph_adaptor'].get_description();
  }

  if (
    save['graph']
    && typeof save['graph'].serializePrettyXML === 'function'
  ) {
    return save['graph'].serializePrettyXML();
  }

  return null;
} //}}}

function do_requirements_save(event) { //{{{
  if (save['requirements'].has_changed()) {
    save['requirements'].set_checkpoint();
    var url = $('body').attr('current-instance');
    let reqj = save['requirements'].save_json();
    let att = save['attributes'].save();
    let attributesNode = $(' > attributes', att);
    if (attributesNode.length === 0) {
      return;
    }
    let requirementsNode = attributesNode.children('requirements');
    if (requirementsNode.length === 0) {
      requirementsNode = $X("<requirements xmlns='http://cpee.org/ns/properties/2.0'/>");
      attributesNode.append(requirementsNode);
    }
    requirementsNode.text(reqj);
    do_parameters_save_part('attributes',$(att).serializePrettyXML());
  }
} //}}}

function do_nl_requirements_save(event) { //{{{
  if (!save['attributes']) {
    return;
  }

  // Keep regular requirements in sync when NL requirements are persisted.
  if (save['requirements']) {
    do_requirements_save({ target: $('#dat_requirements')[0] });
  }

  let nlReqj = JSON.stringify(read_nl_requirements_object_from_ui());
  let att = save['attributes'].save();
  let attributesNode = $(' > attributes', att);
  if (attributesNode.length === 0) {
    return;
  }

  let nlReqNode = attributesNode.children('NL-requirements');
  if (nlReqNode.length === 0) {
    nlReqNode = $X("<NL-requirements xmlns='http://cpee.org/ns/properties/2.0'/>");
    attributesNode.append(nlReqNode);
  }

  if (save['requirements']) {
    let reqj = save['requirements'].save_json();
    let requirementsNode = attributesNode.children('requirements');
    if (requirementsNode.length === 0) {
      requirementsNode = $X("<requirements xmlns='http://cpee.org/ns/properties/2.0'/>");
      attributesNode.append(requirementsNode);
    }
    requirementsNode.text(reqj);
  }

  nlReqNode.text(nlReqj);
  do_parameters_save_part('attributes',$(att).serializePrettyXML());
} //}}}
