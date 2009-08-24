var start = false;
function togglestartstop() {

    if (!start) {
        $('btn_startstop').value = 'Stop';
        start = true;
        $('frm_userinterface').disable();
        $('btn_addcontext').disabled = true;
        $('btn_addendpoint').disabled = true;
        $('btn_apply').disabled = true;
        // Start the WEE
    }
    else
    {
        $('btn_startstop').value = 'Start';
        start = false;
        $('frm_userinterface').enable();
        $('btn_addcontext').disabled = false;
        $('btn_addendpoint').disabled = false;
        $('btn_apply').disabled = false;
        // Stop the WEE
    }
}

function apply() {
    // Apply changes to the WEE
    alert('Apply');
}

function unhide(divID) {
  var item = document.getElementById(divID);
  if (item) {
    item.className=(item.className=='hidden')?'unhidden':'hidden';
  }
}