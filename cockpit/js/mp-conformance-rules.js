$(document).ready(function() { //{{{
  $.ajax({
    type: "GET",
    url: "rngs/rules.rng",
    dataType: "xml",
    success: function(rng){
      save['rules'] = new RelaxNGui(rng,$('#dat_rules'));
    }
  });
  document.addEventListener('attributes:changed', function (e) {
    let rules = $X("<rules xmlns='http://cpee.org/ns/properties/2.0'/>");
    let rulesr;
    rulesr = save.attributes_raw.rules;
    if (rulesr == "" || rulesr == undefined) {
      return
    } else {
      // In this case we either have a single rule or multiple rules in the attributes
      try {
        rulesj = JSON.parse(rulesr);
      } catch (error) {
        console.error("rules are not a valid JSON:", error.message)
        return
      }
    }
    // Object will contain a filed named rule that contains either a single rule object or an array of rule objects
    rulesj = rulesj["rule"]
    if(rulesj == undefined) {
      console.error("rules json does not have the expected rule key")
      return
    }
    if (!Array.isArray(rulesj)) {
      rulesj = [rulesj];
    }
    // For each rule, create a rule node, in the rule node add the 2 nodes with their respective values
    for (let rulej of rulesj) {
      let rule = $X("<rule xmlns=\"http://cpee.org/ns/properties/2.0'\"/>");
      for(let key in rulej) {
        let ele = $X('<' + key + ' xmlns="http://cpee.org/ns/properties/2.0"/>');
        ele.text(rulej[key]);
        rule.append(ele);
      }
      rules.append(rule);
    }
    save['rules'].content(rules);
  });

  var timer;
  // when input in one of the inputs, save
  $(document).on('input','#dat_rules input',function(event){
    clearTimeout(timer);
    timer = setTimeout(function(){ do_rules_save(event); }, 5000);
  });
  $(document).on('relaxngui_remove', '#dat_rules', function(event){
    clearTimeout(timer);
    do_rules_save(event);
  });
  $(document).on('relaxngui_move', '#dat_rules', function(event){
    clearTimeout(timer);
    do_rules_save(event);
  });
  $(document).on('relaxngui_change', '#dat_rules', function(event){
    clearTimeout(timer);
    do_rules_save(event);
  });
}); //}}}

function do_rules_save(event) { //{{{
  if (save['rules'].has_changed()) {
    save['rules'].set_checkpoint();
    var url = $('body').attr('current-instance');
    let rulesj = save['rules'].save_json();
    let att = save['attributes'].save();
    if ($(' > attributes > rules', att).length == 0) {
      $(' > attributes',att).append($X('<rules xmlns="http://cpee.org/ns/properties/2.0"/>'));
    }
    $(' > attributes > rules', att).text(rulesj);
    do_parameters_save_part('attributes',$(att).serializePrettyXML());
  }
} //}}}
