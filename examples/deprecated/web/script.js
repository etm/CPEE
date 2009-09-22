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
        $('txt_description').hide();
        $('desc_readonly').className = 'unhidden';
        $('img_arrow_pos1').hide();
        $('img_arrow_pos2').hide();
        $('img_arrow_pos3').hide();
        $('state').innerHTML = 'running';
        setTimeout('$(\'img_arrow_pos1\').show();', 1000);
        setTimeout('$(\'img_arrow_pos1\').hide();', 4000);
        setTimeout('$(\'img_arrow_pos2\').show();', 4000);
        setTimeout('$(\'img_arrow_pos2\').hide();', 7000);
        setTimeout('$(\'img_arrow_pos3\').show();', 7000);
        setTimeout('$(\'img_arrow_pos3\').hide();', 10000);
        setTimeout('$(\'state\').innerHTML = \'ready\';', 10000);
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
        $('txt_description').show();
        $('desc_readonly').className = 'hidden';
        $('state').innerHTML = 'stopped';
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