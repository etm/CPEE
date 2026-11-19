var latestComplianceResult = null;
var requirements_state = { requirements: null, nl: null };

$(document).ready(function() { //{{{
  $.ajax({
    type: "GET",
    url: "rngs/requirements.rng",
    dataType: "xml",
    success: function(rng){
      save['requirements'] = new RelaxNGui(rng,$('#dat_requirements'));
      load_requirements();
    }
  });
  $.ajax({
    type: "GET",
    url: "rngs/nlrequirements.rng",
    dataType: "xml",
    success: function(rng){
      save['nlrequirements'] = new RelaxNGui(rng,$('#dat_nlrequirements'));
      load_requirements();
    }
  });

  function loadComplianceLog(uuid, options) {
    var renderOptions = options || {};
    var baseUrl = 'https://cpee.org/comp-log/';
    var currentUrl = baseUrl + uuid + '.xes.yaml';
    var allUrl    = baseUrl + uuid + '.all.xes.yaml';

    $('#comp-verify-all-log').attr('href', allUrl);
    $('#areacomp .yourlog').show();
    $('#areacomp .yourlog [style]').show();

    function tryLoad(url, fallback) {
      $.ajax({
        type: 'GET',
        url: url,
        dataType: 'text',
        success: function(yaml) {
          $('#comp-verify-current-log').attr('href', url).text(url.split('/').pop()).show();
          displayComplianceMessages(yaml, renderOptions);
          if (typeof renderOptions.onLoaded === 'function') {
            renderOptions.onLoaded({ yaml: yaml, url: url });
          }
        },
        error: function() {
          if (fallback) {
            tryLoad(fallback, null);
          } else {
            $('#comp_log').html('Could not load compliance log.');
            if (typeof renderOptions.onError === 'function') {
              renderOptions.onError('Could not load compliance log.');
            }
          }
        }
      });
    }

    tryLoad(currentUrl, baseUrl + uuid + '.current.xes.yaml');
  }

  function extractLatestLogTimestamp(yamlText) {
    if (typeof yamlText !== 'string' || !yamlText.trim()) {
      return null;
    }

    // Match ISO timestamps such as 2026-07-28T10:11:12Z or with timezone offsets.
    var matches = yamlText.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/g);
    if (!matches || matches.length === 0) {
      return null;
    }

    var latest = null;
    for (var i = 0; i < matches.length; i++) {
      var ts = Date.parse(matches[i]);
      if (!isNaN(ts) && (latest == null || ts > latest)) {
        latest = ts;
      }
    }

    return latest;
  }

  function isLogOlderThanSeconds(yamlText, seconds) {
    var latestTimestamp = extractLatestLogTimestamp(yamlText);
    if (latestTimestamp == null) {
      return false;
    }

    var ageMs = Date.now() - latestTimestamp;
    return ageMs > (seconds * 1000);
  }

  function triggerComplianceSubscriber(uuid, onSuccess, onError) {
    getCurrentTestsetXml(
      function(testsetXml) {
        var notification;
        try {
          notification = buildSubscriptionLikeNotification(testsetXml, uuid);
        } catch (error) {
          onError(error.message || 'Failed to build compliance notification payload.');
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
          url: 'https://power.bpm.cit.tum.de/compliance/Subscriber',
          data: formData,
          processData: false,
          contentType: false,
          dataType: 'text',
          success: function(_response, _textStatus, xhr) {
            if (xhr && xhr.status === 200) {
              onSuccess();
              return;
            }

            var body = xhr && xhr.responseText ? xhr.responseText : 'Compliance verify returned an unexpected response.';
            onError(body);
          },
          error: function(xhr) {
            var body = xhr && xhr.responseText ? xhr.responseText : 'Compliance verify failed.';
            onError(body);
          }
        });
      },
      function(message) {
        onError(message);
      }
    );
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
    var descriptionContainer = xmlDoc.getElementsByTagName('dslx')[0] || xmlDoc.getElementsByTagName('description')[0];

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
      $('#comp_log').html('No instance loaded.');
      return;
    }

    $('#comp_log').html('Loading compliance log...');

    loadComplianceLog(uuid, {
      onLoaded: function(result) {
        if (!result || !result.yaml) {
          return;
        }

        if (!isLogOlderThanSeconds(result.yaml, 60)) {
          return;
        }

        $('#comp_log').html('Last log is older than 60 seconds. Requesting fresh verification...');
        triggerComplianceSubscriber(
          uuid,
          function() {
            loadComplianceLog(uuid);
          },
          function(message) {
            $('#comp_log').html('<pre>' + escapeHtml(message || 'Failed to request fresh verification.') + '</pre>');
          }
        );
      }
    });
  });

  $("#semantic_verify").click(function(){
    var uuid = save.attributes_raw && save.attributes_raw.uuid;
    if (!uuid) {
      $('#comp_log').html('No instance loaded.');
      return;
    }

    $('#comp_log').html('Preparing semantic verification payload...');

    getCurrentTestsetXml(
      function(testsetXml) {
        $('#comp_log').html('Running semantic verification...');

        var notification;
        try {
          notification = buildSubscriptionLikeNotification(testsetXml, uuid);
        } catch (error) {
          $('#comp_log').html(escapeHtml(error.message || 'Failed to build semantic verification payload.'));
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
            $('#comp_log').html('<pre>' + escapeHtml(body) + '</pre>');
          },
          error: function(xhr) {
            var body = xhr && xhr.responseText ? xhr.responseText : 'Semantic verification failed.';
            $('#comp_log').html('<pre>' + escapeHtml(body) + '</pre>');
          }
        });
      },
      function(message) {
        $('#comp_log').html(escapeHtml(message));
      }
    );
  });

  $("#identify-violations").click(function(){
    var uuid = save.attributes_raw && save.attributes_raw.uuid;
    if (!uuid) {
      $('#comp_log').html('No instance loaded.');
      return;
    }

    $('#comp_log').html('Loading compliance log...');

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

          $('#comp_log').html('Identifying violations...');

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
              $('#comp_log').html('Violation identification failed: ' + detail);
            }
          });
        },
        error: function() {
          if (fallback) {
            tryLoad(fallback, null);
          } else {
            $('#comp_log').html('Could not load compliance log.');
          }
        }
      });
    }

    tryLoad(currentUrl, baseUrl + uuid + '.current.xes.yaml');
  });

  $("#repair-violations").click(function(){
    var uuid = save.attributes_raw && save.attributes_raw.uuid;
    if (!uuid) {
      $('#comp_log').html('No instance loaded.');
      return;
    }

    if (!latestComplianceResult) {
      $('#comp_log').html('No compliance result available. Run Identify Violations first.');
      return;
    }

    var originalPstXml = getCurrentProcessXml();
    if (!originalPstXml) {
      $('#comp_log').html('Could not extract the current process XML.');
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

    $('#comp_log').html('Repairing violations...');

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
        $('#comp_log').html('<pre>' + escapeHtml(pretty) + '</pre>');
      },
      error: function(xhr) {
        var detail = xhr && xhr.responseText ? xhr.responseText : 'Unknown error';
        $('#comp_log').html('Repair failed: ' + escapeHtml(detail));
      }
    });
  });

  document.addEventListener('attributes:changed', function() {
    load_requirements();
  });

  $(document).on('relaxngui_remove', '#dat_requirements', function() {
    prune_nl_requirements();
  });
}); //}}}

function read_requirements(editor) { //{{{
  return editor ? parse_saved_object(editor.save_json()) : {};
} //}}}

function requirements_xml(rootName, reqObject) { //{{{
  let req = $X("<" + rootName + " xmlns='http://cpee.org/ns/properties/2.0'/>");
  Object.keys(reqObject).forEach(function(key) {
    let ele = $X("<" + key + " xmlns='http://cpee.org/ns/properties/2.0'/>");
    ele.text(reqObject[key]);
    req.append(ele);
  });
  return req;
} //}}}

function load_requirements() { //{{{
  if (!save['requirements'] || !save['nlrequirements'] || !save['attributes_raw']) {
    return;
  }
  let raw = save['attributes_raw'].requirements || '';
  let nlraw = save['attributes_raw']['NL-requirements'] || '';
  if (raw === requirements_state.requirements && nlraw === requirements_state.nl) {
    return;
  }
  requirements_state.requirements = raw;
  requirements_state.nl = nlraw;

  let req = parse_saved_object(raw);
  let nl = parse_saved_object(nlraw);
  Object.keys(req).forEach(function(key) {
    if (!(key in nl)) {
      nl[key] = '';
    }
  });
  save['requirements'].content(requirements_xml('requirements', req));
  save['nlrequirements'].content(requirements_xml('nlrequirements', nl));
} //}}}

function save_requirements() { //{{{
  if (!save['requirements'] || !save['nlrequirements'] || !save['attributes']) {
    return;
  }
  let req = JSON.stringify(read_requirements(save['requirements']));
  let nl = JSON.stringify(read_requirements(save['nlrequirements']));
  if (req === requirements_state.requirements && nl === requirements_state.nl) {
    return;
  }

  let att = save['attributes'].save();
  let attributes = $(' > attributes', att);
  if (attributes.length === 0) {
    return;
  }
  [['requirements', req], ['NL-requirements', nl]].forEach(function([name, value]) {
    let node = attributes.children(name);
    if (node.length === 0) {
      node = $X("<" + name + " xmlns='http://cpee.org/ns/properties/2.0'/>");
      attributes.append(node);
    }
    node.text(value);
    save['attributes_raw'][name] = value;
  });
  requirements_state.requirements = req;
  requirements_state.nl = nl;
  save['attributes'].content(att);
  do_parameters_save_part('attributes', $(att).serializePrettyXML());
} //}}}

function prune_nl_requirements() { //{{{
  let current = read_requirements(save['requirements']);
  let removed = Object.keys(parse_saved_object(requirements_state.requirements)).filter(function(key) {
    return !(key in current);
  });
  if (removed.length === 0) {
    return;
  }
  let nl = read_requirements(save['nlrequirements']);
  removed.forEach(function(key) {
    delete nl[key];
  });
  save['nlrequirements'].content(requirements_xml('nlrequirements', nl));
} //}}}

function extract_single_nl_requirement(entry) { //{{{
  var inputs = entry.find('.relaxngui_row > input.relaxngui_cell');
  var requirementId = inputs.first().val();
  var naturalText = (inputs.last().val() || '').trim();
  var button = entry.children('[data-type=act]');

  if (!naturalText || !save['requirements']) {
    return;
  }

  button.prop('disabled', true);

  extract_ast_from_natural_language(
    naturalText,
    function(ast) {
      let req = read_requirements(save['requirements']);
      req[requirementId] = ast;
      save['requirements'].content(requirements_xml('requirements', req));
      save_requirements();
      button.prop('disabled', false);
    },
    function() {
      button.prop('disabled', false);
    }
  );
} //}}}

function next_requirement_id() { //{{{
  var currentReqs = Object.assign({}, read_requirements(save['nlrequirements']), read_requirements(save['requirements']));
  var used = {};
  Object.keys(currentReqs).forEach(function(key) {
    var m = key.match(/^R(\d+)$/);
    if (m) {
      used[parseInt(m[1], 10)] = true;
    }
  });

  var candidate = 1;
  while (used[candidate]) {
    candidate += 1;
  }

  return 'R' + candidate;
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
    $('#comp_log').html('<div>No messages found.</div>');
    return;
  }

  var html = semanticMode ? '' : '<div>Pre-Tests</div>';
  for (var j = 0; j < messages.length; j++) {
    var msg = messages[j];
    var isHeader = /^Verifying Requirement R/.test(msg) || /^Requirement R/.test(msg);
    var cls = isHeader ? '' : ' class="indent"';
    html += '<div' + cls + '>' + $('<span>').text(msg).html() + '</div>';
  }
  $('#comp_log').html(html);
} //}}}

function renderViolationMessages(result) { //{{{
  var violations = Array.isArray(result && result.violations)
    ? result.violations
    : [];

  var html = '<div>Violations:</div>';

  if (violations.length === 0) {
    html += '<div class="indent">None</div>';
    $('#comp_log').html(html);
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

  $('#comp_log').html(html);
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
    $('#comp_log').html('<pre>' + escapeHtml(pretty) + '</pre>');
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

	if (
	  (status === 'success' || status === 'warning') &&
  	pstXml
	) {
      html += '<div class="indent">PST: ' + buildPstDownloadLink(pstXml, requirementId, i) + '</div>';
    } else {
      html += '<div class="indent error">Error</div>';
    }
  }

  if (html === '') {
    html = '<pre>' + escapeHtml(JSON.stringify(result, null, 2)) + '</pre>';
  }

  $('#comp_log').html(html);
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
