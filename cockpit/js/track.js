function closeIFrame(srch) {
  $('iframe').each(function(i,val){
    if ($(val).attr('src') == 'track.html' + srch) {
      $(val).remove();
    }
  });
}

$(document).ready(function() {
  $("a[name=glob_unshow]").click(e => {
    parent.closeIFrame(window.location.search);
  });
});
