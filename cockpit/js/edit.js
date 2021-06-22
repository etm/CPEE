document.addEventListener('graph:changed', function (e) {
  $("button[name=save]").prop("disabled",false);
}, false);
document.addEventListener('parameters:changed', function (e) {
  $("button[name=save]").prop("disabled",false);
}, false);
document.addEventListener('modifiers:changed', function (e) {
  $("button[name=save]").prop("disabled",false);
}, false);

function leading_zeros(dt) {
  return (dt < 10 ? '0' : '') + dt;
}

$(document).ready(function() {
  $("button[name=save]").click(function(){
    var def = new $.Deferred();
    def.done(function(name,testset) {
      $.ajax({
        url: $('body').attr('current-save') + ($('body').attr('current-save-dir') ? ($('body').attr('current-save-dir') + '/').replace(/\/+/,'/') : '') + name + '.xml',
        type: 'PUT',
        contentType: 'application/xml',
        data: testset.serializePrettyXML(),
        headers: { 'Content-ID': 'content' },
        success: function() {
          $("button[name=save]").prop("disabled",true);
          $("#lastsavedline").removeClass('hidden');
          var dt = new Date();
          var time = leading_zeros(dt.getHours()) + ":" + leading_zeros(dt.getMinutes()) + ":" + leading_zeros(dt.getSeconds());
          $("#lastsaved").text(time);
        },
        error: function() {
          alert('File was moved or deleted. Save testset to disk.');
        }
      });
    });
    get_testset(def);
  });
});
