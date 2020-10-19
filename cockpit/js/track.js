function closeIFrame(srch) {
  var count = 0;
  $('iframe').each(function(i,val){
    if ($(val).attr('src') == 'track.html' + srch) {
      $(val).remove();
    }
    count += 1;
  });
  if (count == 1) {
    $('#graphcolumn').removeClass('resize');
  }
}

$(document).ready(function() {
  $("a[name=glob_unshow]").click(e => {
    parent.closeIFrame(window.location.search);
  });
});
