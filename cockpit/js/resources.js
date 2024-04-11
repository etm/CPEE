$(document).ready(function() {
  $('.resource-label').on('mouseover',()=>{
    $('.resource-label').hide(); // Speech Bubble hide when over
  });
  $('#graphgrid').on('mouseover','svg line.resource-line, svg g polygon.resource-point',(data)=>{
    const left = $('.resource-label').offset().left;
    const pos = $(data.target).offset().left - 11;
    if ($('.resource-label').is(":hidden") || left != pos) {
      let labeltext = $('text',data.currentTarget).text();
      $('.resource-label').text(labeltext);
      $('.resource-label').css('left', pos);
      $('.resource-label').css('top', data.originalEvent.clientY - 50);
      $('.resource-label').show();
    }
  });
});
