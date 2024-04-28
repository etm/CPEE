$(document).ready(function() {
  $('#graphgrid').on('mouseout','svg line.resource-line, svg g polygon.resource-point',(data)=>{
    $('.displaylabel').remove();
  });
  $('#graphgrid').on('mouseover','svg line.resource-line',(data)=>{
    let pos = data.target.getBoundingClientRect();
    let pos_top = $('#graphcolumn')[0].getBoundingClientRect();
    let pos_y;
    let text = $('text',data.target).text();
    if (pos.y < pos_top.y) {
      pos_y = pos_top.y + 10;
    } else {
      pos_y = pos.y;
    }
    show_label(pos.x + 12, pos_y, 60, text);
  });
  $('#graphgrid').on('mouseover','svg g polygon.resource-point',(data)=>{
    let pos = data.target.getBoundingClientRect();
    let text = $('text',data.target).text();
    show_label(pos.x + 12, pos.y + 5, 60, text);
  });
});
