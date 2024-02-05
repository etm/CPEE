$(document).ready(function(){

    $(document).on('click', 'div[data-relaxngui-path=" > description > _concerns[data-main]"] > button:contains("Create Concern")',function(e){
      existing_ids = Array.from($(e.currentTarget.parentNode).find('input[data-relaxngui-path=" > description > _concerns > concern[id]"]'))
      current_input = existing_ids.pop()
      
      currentId = 1

      while ($(existing_ids).filter('input').filter(function() {return $(this).val() == 'c'+currentId})[0]) {
        currentId++
      }

      $(current_input).val('c'+currentId)

    })

    $(document).on('node:deleted',function(e){
      var node = e.originalEvent.node
      var description = e.originalEvent.description

      Array.from($(node).find("sod")).forEach(function(element) {
          target = description.get_node_by_svg_id(element.children[0].innerHTML)
          target.find('sod:contains("'+node[0].id+'")').remove()
      })

      Array.from($(node).find("bod")).forEach(function(element) {
          target = description.get_node_by_svg_id(element.children[0].innerHTML)
          target.find('bod:contains("'+node[0].id+'")').remove()
      })

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
                Array.from($('select[data-relaxngui-path=" > call > _concerns > concern > id"]')).forEach(function(e1) {
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
                Array.from($('select[data-relaxngui-path=" > call > _concerns > concern > id"]')).forEach(function(e1) {
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
                  Array.from($('select[data-relaxngui-path=" > call > _concerns > concern > id"]')).forEach(function(e1) {
                    if(!$(e1).find('option[value="'+nodeArray[i].children[0].innerHTML+'"]')[0]) {
                      $($.parseHTML('<option value="'+nodeArray[i].children[0].innerHTML+'">'+nodeArray[i].children[0].innerHTML+'</option>')).appendTo(e1)
                      oldValue = $(e1)[0].value
                      $(e1).find('option').sort((a,b) => $(a).text() > $(b).text() ? 1 : -1).detach().appendTo($(e1))
                      $(e1)[0].value = oldValue
                    }
                  })
                  
                  Array.from($('select[data-relaxngui-path=" > call > _concerns > concern > id"]')).forEach(function(e1) {
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

