function closeIFrame(srch) {
  $('iframe').each(function(i,val){
    if ($(val).attr('src') == 'track.html' + srch) {
      $(val).remove();
    }
  });
}

