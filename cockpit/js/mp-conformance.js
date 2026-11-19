function mp_conformance_editor(name, item) { //{{{
  let state = null;
  let timer;

  let load = function() {
    if (!save[name] || !save['attributes_raw']) {
      return;
    }
    let raw = save['attributes_raw'][name] || '';
    if (raw === state) {
      return;
    }
    state = raw;

    let entries = [];
    if (raw !== '') {
      try {
        entries = [].concat(JSON.parse(raw)[item] || []);
      } catch (e) {
        console.error(name + ' is not valid JSON:', e.message);
      }
    }
    let root = $X('<' + name + ' xmlns="http://cpee.org/ns/properties/2.0"/>');
    entries.forEach(function(entry) {
      let node = $X('<' + item + ' xmlns="http://cpee.org/ns/properties/2.0"/>');
      Object.entries(entry).forEach(function([key, value]) {
        let ele = $X('<' + key + ' xmlns="http://cpee.org/ns/properties/2.0"/>');
        ele.text(value);
        node.append(ele);
      });
      root.append(node);
    });
    save[name].content(root);
  };

  let store = function() {
    clearTimeout(timer);
    if (!save[name] || !save['attributes']) {
      return;
    }
    let json = save[name].save_json();
    if (json === state) {
      return;
    }
    let att = save['attributes'].save();
    let attributes = $(' > attributes', att);
    if (attributes.length === 0) {
      return;
    }
    let node = attributes.children(name);
    if (node.length === 0) {
      node = $X('<' + name + ' xmlns="http://cpee.org/ns/properties/2.0"/>');
      attributes.append(node);
    }
    node.text(json);
    state = json;
    save['attributes_raw'][name] = json;
    save['attributes'].content(att);
    do_parameters_save_part('attributes', $(att).serializePrettyXML());
  };

  $.ajax({
    type: "GET",
    url: "rngs/" + name + ".rng",
    dataType: "xml",
    success: function(rng) {
      save[name] = new RelaxNGui(rng, $('#dat_' + name));
      load();
    }
  });
  document.addEventListener('attributes:changed', load);
  $(document).on('input', '#dat_' + name + ' input', function() {
    clearTimeout(timer);
    timer = setTimeout(store, 5000);
  });
  $(document).on('relaxngui_remove relaxngui_move', '#dat_' + name, function() {
    store();
  });
} //}}}

$(document).ready(function() { //{{{
  mp_conformance_editor('intervals', 'interval');
  mp_conformance_editor('rules', 'rule');
}); //}}}
