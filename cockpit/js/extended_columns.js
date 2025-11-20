function show_dataflow_label(x,y,deg,text) {
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

  let top = y-shift-top_y;
  if (top < 0) top = 0;
  $(clone).css('left',x-top_x);
  $(clone).css('top',top);

  $(clone).attr('height',shift + shift_plus + 2);
  $(clone).attr('width',neigh + 2);
  $('g',clone).attr('transform',$('g',clone).attr('transform').replace(/%%1/, shift + 1).replace(/%%2/, deg));
  $('rect',clone).attr('width',width);
}

function show_dataflow_row_label(data) {
  let pos = data.getBoundingClientRect();
  let pos_top = $('#graphgrid').parent()[0].getBoundingClientRect();
  let pos_y;
  let text = $('text',data).text();
  if (pos.y < (pos_top.y + 10)) {
    pos_y = pos_top.y + 10;
  } else {
    pos_y = pos.y;
  }
  show_dataflow_label(pos.x + 12, pos_y, 60, text);
}

function draw_extended_columns(graphrealization,max,labels,dimensions,striped) {
  // labels
  graphrealization.illustrator.svg.container.css('grid-row', '1/span ' + (max.row + 2));
  if (striped == true) {
    if (!graphrealization.illustrator.svg.label_container.hasClass('striped')) {
      graphrealization.illustrator.svg.label_container.addClass('striped');
    }
  } else {
    graphrealization.illustrator.svg.label_container.removeClass('striped');
  }

  $('.labelsrow, .graphlast').remove();
  let tcolumns = [];
  let tcolumntype = {};
  let tcolumncount = {}

  const mapPoints = new Map();
  const tcolumnsvgs = {};
  const iconsize = 10;
  const space = 5;

  for (val of labels) {
    if (val.label != "") {
      for (col of val.label) {
        if (!tcolumns.includes(col.column)) {
          tcolumns.push(col.column);
          tcolumncount[col.column] = 0;
          tcolumnsvgs[col.column] = {};
        }
        if (tcolumntype[col.column] == undefined && col.type != undefined) {
          tcolumntype[col.column] = col.type;
        }
        if (col.value != undefined) {
          let pos = dimensions.height_shift/2 + dimensions.height * (val.row - 1) + (dimensions.height / 2);
          let firstpos = dimensions.height_shift/2 + (dimensions.height / 2);

          if (col.type == "resource") {
            for (const [k, v] of Object.entries(col.value)) {
              var p = { AR: v };
              if (!mapPoints.has(k)) {
                p.y0 = p.y0 == undefined ? pos : p.y0;
                p.ymax = (p.ymax == undefined) ? p.y0 : p.ymax;
              } else {
                p.y0 = mapPoints.get(k).y0;
                p.ymax = mapPoints.get(k).ymax;
              }
              mapPoints.set(k, p);
            }

            let tsvg = $X('<g xmlns="http://www.w3.org/2000/svg" class="resource-row" element-row="' + (val.row-1) + '"></g>');

            var cx = space;
            var count = 0;
            for (const [k, p] of mapPoints) {
              let firstAssignFlag = false;
              p.x = cx;

              // Including Triangle
              if (k in col.value) {   // Define points for a triangle pointing to the right
                let inner;

                if (p.AR == "Read") {
                  inner = $X('<polygon xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" points="' + (p.x) + ',' + pos + ' ' + (p.x + iconsize) + ',' + (pos + iconsize/2) + ' ' + (p.x + iconsize) + ',' + (pos - iconsize/2) + '" class="resource-point read"></polygon>');
                  if (pos == p.y0) { firstAssignFlag = true; }
                } else if (p.AR == "Assign") {    // Define points for a triangle pointing to the left
                  inner = $X('<polygon xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" points="' + (p.x + iconsize) + ',' + pos + ' ' + (p.x) + ',' + (pos + iconsize/2) + ' ' + (p.x) + ',' + (pos - iconsize/2) + '" class="resource-point write"></polygon>');
                } else if (p.AR == "AssignRead") {
                  inner = $X('<circle xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" cx="' + (p.x + iconsize/2) + '" cy="' + pos + '" r="' + (iconsize / 2) + '" class="resource-point both"></circle>');
                } else if (p.AR == "ReadAssign") {
                  inner = $X('<circle xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" cx="' + (p.x + iconsize/2) + '" cy="' + pos + '" r="' + (iconsize / 2) + '" class="resource-point both"></circle>');
                  if (pos == p.y0) { firstAssignFlag = true; }
                }

                // extend the bars
                if (pos > p.ymax) {
                  p.ymax = pos;
                }

                inner.append($X('<text xmlns="http://www.w3.org/2000/svg"></text>').text(k));
                tsvg.append(inner);
              }

              if (firstAssignFlag) {
                // Additional logic and construction of another polygon for orange triangle pointing left in row 0
                p.y0 -= (val.row-1) * dimensions.height;
                if (tcolumnsvgs[col.column][1] == undefined) {
                  tcolumnsvgs[col.column][1] = $X('<g xmlns="http://www.w3.org/2000/svg" class="resource-row" element-row="' + 0 + '"></g>');
                }
                tcolumnsvgs[col.column][1].append($X('<polygon xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" points="' + (p.x + iconsize) + ',' + firstpos + ' ' + (p.x) + ',' + (firstpos + iconsize/2) + ' ' + (p.x) + ',' + (firstpos - iconsize/2) + '" class="resource-point write"></polygon>').append($X('<text xmlns="http://www.w3.org/2000/svg"></text>').text(k)));
              }
              cx += iconsize + space;
              count += 1;
            }

            if (tsvg.children().length > 0) {
              tcolumnsvgs[col.column][val.row] = tsvg;
            }
          } else {
            tsvg = $X('<text class="label" element-id="' + val.element_id + '" x="' + space + '" y="' + (dimensions.height * val.row - dimensions.height_shift) + '" xmlns="http://www.w3.org/2000/svg"></text>')
            tsvg.text(col.value);
            tsvg.mouseover(function(ev){ manifestation.events.mouseover($(ev.currentTarget).attr('element-id')); });
            tsvg.mouseout(function(ev){ manifestation.events.mouseout($(ev.currentTarget).attr('element-id')); });
            tsvg.click(function(ev){ manifestation.events.click($(ev.currentTarget).attr('element-id'),ev); });
            tcolumnsvgs[col.column][val.row] = tsvg;
          }

          tcolumncount[col.column] += 1;
        }
      };
    }
  };

  graphrealization.illustrator.svg.label_container.css({
    'grid-template-rows': (dimensions.height_shift/2) + 'px repeat(' + max.row + ', 1fr) ' + (dimensions.height_shift/2) + 'px',
    'grid-template-columns': 'max-content' + (tcolumns.length > 0 ? ' repeat(' + tcolumns.length.toString() + ',max-content)' : '') + ' auto'
  });

  tcolumns.forEach(h => {
    if (Object.keys(tcolumnsvgs[h]).length > 0) {
      const svgcolumn = $X('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:x="http://www.w3.org/1999/xlink" class="labelsrow"></svg>');
      const svgback = $X('<g xmlns="http://www.w3.org/2000/svg"></g>');
      const svgfront = $X('<g xmlns="http://www.w3.org/2000/svg"></g>');
      let xwidth = 0;
      svgcolumn.append(svgback);
      svgcolumn.append(svgfront);
      svgcolumn.css('grid-row', '1/span ' + (max.row + 2))
      svgcolumn.css('grid-column', tcolumns.indexOf(tcolumns.first) + 2);
      svgcolumn.attr('height', graphrealization.illustrator.svg.container.attr('height'));
      graphrealization.illustrator.svg.label_container.append(svgcolumn);

      for (var i = 0; i < max.row; i++) {
        let node = svgfront.append($(tcolumnsvgs[h][i+1]));
        if (xwidth < node[0].getBBox().width) { xwidth = node[0].getBBox().width; }
      }
      xwidth = xwidth + 2 * space;
      if (striped == true) {
        for (var i = 0; i < max.row; i++) {
          svgback.append($X('<rect xmlns="http://www.w3.org/2000/svg" element-row="' + i + '" class="stripe ' +  (i % 2 == 0 ? 'even' : 'odd') + '" x="0" y="' + (dimensions.height * i + dimensions.height_shift/2) + '" width="' + (xwidth + 1) + '" height="' + dimensions.height + '"></rect>'));
          svgback.append($X('<rect xmlns="http://www.w3.org/2000/svg" element-row="' + i + '" class="border" x="0" y="' + (dimensions.height * i + dimensions.height_shift/2) + '" height="' + dimensions.height + '" width="1"></rect>'));
        }
      }
      if (tcolumntype[h] == 'resource' || tcolumntype[h] == 'bodsod') {
        let count = 0;
        for (const [k, p] of mapPoints) {
          svgback.append($X('<line xmlns="http://www.w3.org/2000/svg" resource-column="' + count + '" x1="' + (p.x + iconsize/2) + '" y1="' + p.y0 + '" x2="' + (p.x + iconsize/2) + '" y2="' + (p.ymax + 0.01) + '" class="' + tcolumntype[h] + '-column" stroke-width="' + iconsize + '"><text>' + k + '</text></line>'));
          count += 1;
        }
      }

      $('.resource-label').hide();  // Speech Bubble hide by default

      svgcolumn.attr('width', xwidth);
    }
  });

  return tcolumns.length;
}

$(document).ready(function() {
  var current_label;
  var clicked_label;
  $('#graphgrid').on('mouseout','svg .resource-column, svg .resource-point',(data)=>{
    if (clicked_label != current_label) {
      $('.displaylabel').remove();
      clicked_label = undefined;
      current_label = undefined;
    }
  });
  $('#graphcolumn').scroll((data)=>{
    if (current_label != undefined) {
      $('.displaylabel').remove();
      show_dataflow_row_label(current_label);
    }
  });
  $('#graphgrid').on('click','svg .resource-column',(data)=>{
    show_dataflow_row_label(data.target);
    current_label = data.target;
    clicked_label = data.target;
  });
  $('#graphgrid').on('mouseover','svg .resource-column',(data)=>{
    show_dataflow_row_label(data.target);
    current_label = data.target;
  });
  $('#graphgrid').on('mouseover','svg .resource-point',(ev)=>{
    let rc = $(ev.target).attr('resource-column');
    let data = $('.resource-column[resource-column=' + rc + ']')[0];
    show_dataflow_row_label(data);
    current_label = data;
    // let pos = data.target.getBoundingClientRect();
    // let text = $('text',data.target).text();
    // show_dataflow_label(pos.x + 12, pos.y + 5, 60, text);
  });
});
