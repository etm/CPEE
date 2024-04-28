function show_label(x,y,deg,text) {
  const degrees_to_radians = deg => (deg * Math.PI) / 180.0;

  let clone = $('svg',document.querySelector('#label').content.cloneNode(true));
  $('text',clone).text(text);
  let n = $('body').append(clone);
  let dim = $('text',clone)[0].getBBox();
  let height = $('rect',clone).attr('height');
  let width = dim.width + dim.x;
  let shift = (width + 10) * Math.sin(degrees_to_radians(deg));
  let shift_plus = height * Math.sin(degrees_to_radians(90-deg));
  let neigh = (width + 10) * Math.cos(degrees_to_radians(deg)) + height * Math.cos(degrees_to_radians(90-deg));

  let top_y = 23 * Math.cos(degrees_to_radians(deg));
  let top_x = 23 * Math.sin(degrees_to_radians(deg));

  $(clone).css('left',x-top_x);
  $(clone).css('top',y-shift-top_y);

  $(clone).attr('height',shift + shift_plus + 2);
  $(clone).attr('width',neigh + 2);
  $('g',clone).attr('transform',$('g',clone).attr('transform').replace(/%%1/, shift + 1).replace(/%%2/, deg));
  $('rect',clone).attr('width',width);
}

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
