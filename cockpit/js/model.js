$(document).ready(function() {
  $('#model ui-content ui-area > button').click(function(event){
    var but = $(document).find('#model ui-content ui-area:not(.inactive) > div button');
        but.click();
    var inp = $(document).find('#model ui-content ui-area:not(.inactive) > div input');
        $(inp[inp.length-2]).focus();
    var are = $(document).find('#model ui-content ui-area:not(.inactive) > div');
    var tab = $(document).find('#model ui-content ui-area:not(.inactive) > div > div');
        are.animate({ scrollTop: tab.height() }, "slow");
  });
});
