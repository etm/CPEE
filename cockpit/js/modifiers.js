var modifiers_changed = new Event("modifiers:changed", {"bubbles":true, "cancelable":false});

$(document).ready(function() {
  var timer;

  $(document).on('input','#modifiers div.additional input, #modifiers div.additional textarea, #modifiers div.additional [contenteditable]',function(e){
    clearTimeout(timer);
    timer = setTimeout(function(){ do_mod_save(e.target) }, 5000);
  });
  $(document).on('change','#modifiers div.additional select',function(e){
    clearTimeout(timer);
    do_mod_save(e.target);
  });
  $(document).on('blur','#modifiers div.additional input, #modifiers div.additional textarea, #modifiers div.additional [contenteditable]',function(e){
    clearTimeout(timer);
    do_mod_save(e.target);
  });
  $(document).on('keypress','#modifiers div.additional input',function(e){
    if (e.keyCode == 13) {
      clearTimeout(timer);
      do_mod_save(e.target);
    }
  });
  $(document).on('keypress','#modifiers div.additional [contenteditable]',function(e){
    if (e.keyCode == 13) {
      document.execCommand('insertText', false, '\n');
      return false;
    }
  });
  $(document).on('relaxngui_remove', '#modifiers div.additional', function(e){
    clearTimeout(timer);
    do_mod_save(e.target);
  });
  $(document).on('relaxngui_move', '#modifiers div.additional', function(e){
    clearTimeout(timer);
    do_mod_save(e.target);
  });
});

function do_mod_save(target) {
  let div = $(target).parents('div[data-resource]');
  let top = div.attr('data-resource');
  let doc = save['modifiers_additional'][top].save();
  let rep = $('body').attr('current-resources');
  let now = $('div.select select',div).val();

  var tset = $X('<testset xmlns="http://cpee.org/ns/properties/2.0"/>');
      tset.append(doc.documentElement);

  set_testset(tset,false);
  document.dispatchEvent(modifiers_changed);
}

async function modifiers_display() {
  let promises = [];
  let rep = $('body').attr('current-resources');
  $('#modifiers > div').remove();

  promises.push(
    $.ajax({
      url: rep + 'modifiers/'
    }).then(async function(res) {
      let ipromises = [];
      $('resource',res).each(function(_,r) {
        ipromises.push(
          $.ajax({
            url: rep + 'modifiers/' + $(r).text()
          }).then(async function(ses){
            let clone = document.importNode(document.querySelector('#modifiers template').content,true);
            let t = $(r).text();
            $('> div',clone).attr('data-resource',t);
            $('div.title *',clone).text(decodeURIComponent(t).replace(/^\d*_?/,''));

            let cpromises = [];
            $('resource',ses).each(function(_,s) {
              let opt = $('<option value=""/>');
              opt.text(decodeURIComponent($(s).text()).replace(/^\d*_?/,''));
              opt.attr('value',$(s).text());
              $('div.select select',clone).append(opt);

              cpromises.push(
                $.ajax({
                  url: rep + 'modifiers/' + $(r).text() + '/' + $(s).text() + '/condition.json'
                }).then(function(tes){
                  save['modifiers'][$(r).text() + '/' + $(s).text()] = tes;
                })
              );

            });
            $(clone).insertBefore($('#modifiers template'));

            await Promise.all(cpromises);
          })
        );
      });
      await Promise.all(ipromises);
    })
  );
  await Promise.all(promises);
}

function modifiers_display_ui(url,top,it,notchanged) {
  if (notchanged) {
    if (save['modifiers_additional'][top]) {
      let attr = save['attributes'].save();
      save['modifiers_additional'][top].content(attr);
    }
  } else {
    $('#modifiers div[data-resource]').each(function(_,r){
      if ($(r).attr('data-resource') == top) {
        $('div.additional',r).empty();
      }
    });
    $.ajax({
      url: url + top + '/' + it + '/ui.rng',
      success: function(rng) {
        $('#modifiers div[data-resource]').each(function(_,r){
          if ($(r).attr('data-resource') == top) {
            save['modifiers_additional'][top] = new RelaxNGui(rng, $('div.additional',r));
            let attr = save['attributes'].save();
            save['modifiers_additional'][top].content(attr);
          }
        });
      },
      error: function() {}
    });
  }
}

function modifiers_select() {
  let atts = {}
  let attr = save['attributes'].save();
  let rep = $('body').attr('current-resources');
  $('> attributes > *',attr).each(function(_,s){
    atts[s.nodeName] = $(s).text();
  });
  $('#modifiers div[data-resource]').each(function(_,r){
    $('select option',r).each(function(_,s){
      let where = $(r).attr('data-resource') + '/' + $(s).attr('value');
      let cond = save['modifiers'][where];
      let success = true;
      for (x in cond) {
        if (cond[x] != atts[x]) { success = false; }
      }
      if (success) {
        let top = $(r).attr('data-resource');
        let it = $(s).attr('value');
        $('select',r).val(it);
        modifiers_display_ui(rep + 'modifiers/',top,it,save['modifiers_active'][top] == it);
        save['modifiers_active'][top] = it;
      }
    });
  });
}

function modifiers_update_patch(url,top,now) {
  $.ajax({
    url: url + top + '/' + now + '/patch.xml',
    success: function(res) {
      set_testset(res,false);
      document.dispatchEvent(modifiers_changed);
    }
  });
}
function modifiers_update_unpatch(url,top,last,now) {
  $.ajax({
    url: url + top + '/' + last + '/unpatch.xml',
    success: function(res) {
      set_testset(res,false).then(function() {
        modifiers_update_patch(url,top,now);
      });
    },
    error: function() {
      modifiers_update_patch(url,top,now);
    }
  });
}

function modifiers_update(e) {
  let rep = $('body').attr('current-resources');
  let top = $(e.target).parents('div[data-resource]').attr('data-resource');
  let last = save['modifiers_active'][top];
  let now = $(e.target).val();

  if (last) {
    modifiers_update_unpatch(rep + 'modifiers/',top,last,now);
  } else {
    modifiers_update_patch(rep + 'modifiers/',top,now);
  }
}
