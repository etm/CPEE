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

function show_row_label(data) {
  let pos = data.getBoundingClientRect();
  let pos_top = $('#graphcolumn')[0].getBoundingClientRect();
  let pos_y;
  let text = $('text',data).text();
  if (pos.y < (pos_top.y + 10)) {
    pos_y = pos_top.y + 10;
  } else {
    pos_y = pos.y;
  }
  show_label(pos.x + 12, pos_y, 60, text);
}


$(document).ready(function(){

    var current_label;
    $('#graphgrid').on('mouseout','svg .bodsod-column, svg .bodsod-point',(data)=>{
      $('.displaylabel').remove();
      current_label = undefined;
    });
    $('#graphcolumn').scroll((data)=>{
      if (current_label != undefined) {
        $('.displaylabel').remove();
        show_row_label(current_label);
      }
    });
    $('#graphgrid').on('mouseover','svg .bodsod-column',(data)=>{
      show_row_label(data.target);
      current_label = data.target;
    });
    $('#graphgrid').on('mouseover','svg .bodsod-point',(ev)=>{
      let rc = $(ev.target).attr('bodsod-column');
      let data = $('.bodsod-column[bodsod-column=' + rc + ']')[0];
      show_row_label(data);
      current_label = data;
      // let pos = data.target.getBoundingClientRect();
      // let text = $('text',data.target).text();
      // show_label(pos.x + 12, pos.y + 5, 60, text);
    });

    $(document).on('click', 'div[data-relaxngui-path=" > description > _concerns[data-main]"] > button:contains("Create Concern")',function(e){
      existing_ids = Array.from($(e.currentTarget.parentNode).find('input[data-relaxngui-path=" > description > _concerns > concern[id]"]'))
      current_input = existing_ids.pop()
      
      currentId = 1

      while ($(existing_ids).filter('input').filter(function() {return $(this).val() == 'c'+currentId})[0]) {
        currentId++
      }

      $(current_input).val('c'+currentId)

    })

    $(document).on('node:updated',function(e){

        var svgid    = e.originalEvent.svgid;
        var desc     = e.originalEvent.desc;
        var node = e.originalEvent.node
        var nnew = e.originalEvent.nnew

        if (node[0].nodeName == "call") {
          if (Array.from($(node).find("concern")).length > Array.from($(nnew).find("concern")).length) {
            Array.from($(node).find("concern")).forEach(function(element) {
              if (!$(nnew).find('concern:contains("'+element.children[0].innerHTML+'")')[0]){
                Array.from($('select[data-relaxngui-path=" > call > parameters > arguments > _concerns > concern > id"]')).forEach(function(e1) {
                  if(!$(e1).find('option[value="'+element.children[0].innerHTML+'"]')[0]) {
                    $($.parseHTML('<option value="'+element.children[0].innerHTML+'">'+element.children[0].innerHTML+'</option>')).appendTo(e1)
                    oldValue = $(e1)[0].value
                    $(e1).find('option').sort((a,b) => $(a).text() > $(b).text() ? 1 : -1).detach().appendTo($(e1))
                    $(e1)[0].value = oldValue
                  }
                })
              }
            })
          } else if (Array.from($(node).find("concern")).length < Array.from($(nnew).find("concern")).length){
            Array.from($(nnew).find("concern")).forEach(function(element) {
              if (!$(node).find('concern:contains("'+element.children[0].innerHTML+'")')[0]){
                Array.from($('select[data-relaxngui-path=" > call > parameters > arguments > _concerns > concern > id"]')).forEach(function(e1) {
                  if(element.children[0].innerHTML != "Choose id" && e1.value != element.children[0].innerHTML) {
                    $(e1).find('option[value="'+element.children[0].innerHTML+'"]').remove()
                  }
                })
              }
            })
          } else {
            nnewArray = Array.from($(nnew).find("concern")).toSorted((a,b) => a.textContent > b.textContent ? 1:-1)
            nodeArray = Array.from($(node).find("concern")).toSorted((a,b) => a.textContent > b.textContent ? 1:-1)
            for (let i = 0; i < nnewArray.length; i++) {
              if (nnewArray[i].children[0].innerHTML != nodeArray[i].children[0].innerHTML) {
                  Array.from($('select[data-relaxngui-path=" > call > parameters > arguments > _concerns > concern > id"]')).forEach(function(e1) {
                    if(!$(e1).find('option[value="'+nodeArray[i].children[0].innerHTML+'"]')[0]) {
                      $($.parseHTML('<option value="'+nodeArray[i].children[0].innerHTML+'">'+nodeArray[i].children[0].innerHTML+'</option>')).appendTo(e1)
                      oldValue = $(e1)[0].value
                      $(e1).find('option').sort((a,b) => $(a).text() > $(b).text() ? 1 : -1).detach().appendTo($(e1))
                      $(e1)[0].value = oldValue
                    }
                  })
                  
                  Array.from($('select[data-relaxngui-path=" > call > parameters > arguments > _concerns > concern > id"]')).forEach(function(e1) {
                    if(nnewArray[i].children[0].innerHTML != "Choose id" && e1.value != nnewArray[i].children[0].innerHTML) {
                      $(e1).find('option[value="'+nnewArray[i].children[0].innerHTML+'"]').remove()
                    }
                  })
                break
              }
            }
          }
        } else if (node[0].nodeName == 'description') {
          if (Array.from($(node).find("> _concerns > concern")).length > Array.from($(nnew).find("> _concerns > concern")).length) {
            Array.from($(node).find("> _concerns > concern")).forEach(function(element) {
              if (!$(nnew).find('> _concerns > concern[id="'+element.id+'"]')[0]) {
                $($(nnew)[0].ownerDocument).find('call concern:contains("'+element.id+'")').remove()
              }
            })
          }
        }
    })
})

