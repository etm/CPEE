$(document).ready(function(){

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
        var svgid    = save['details_target'].svgid;
        var desc     = save['details_target'].model;

        var node = e.originalEvent.node
        var nnew = e.originalEvent.nnew

        if (Array.from($(node).find("sod")).length > Array.from($(nnew).find("sod")).length) {
            Array.from($(node).find("sod")).forEach(function(element) {
              if (!$(nnew).find('sod:contains("'+element.children[0].innerHTML+'")')[0]){
                target = desc.get_node_by_svg_id(element.children[0].innerHTML)
                target.find('sod:contains("'+svgid+'")').remove()
                Array.from($('select[data-relaxngui-path=" > call > bodsod > _sod > sod > id"]')).forEach(function(e1) {
                  if(!$(e1).find('option[value="'+element.children[0].innerHTML+'"]')[0]) {
                    $($.parseHTML('<option value="'+element.children[0].innerHTML+'">'+element.children[0].innerHTML+'</option>')).appendTo(e1)
                    oldValue = $(e1)[0].value
                    $(e1).find('option').sort((a,b) => $(a).text() > $(b).text() ? 1 : -1).detach().appendTo($(e1))
                    $(e1)[0].value = oldValue
                  }
                })
              }
            })
          } else if (Array.from($(node).find("sod")).length < Array.from($(nnew).find("sod")).length){
            Array.from($(nnew).find("sod")).forEach(function(element) {
              if (!$(node).find('sod:contains("'+element.children[0].innerHTML+'")')[0]){
                target = desc.get_node_by_svg_id(element.children[0].innerHTML)
                if (!$(target).find('sod:contains("'+node[0].id+'")')[0]){
                  if (!$(target).find('> bodsod')[0]){
                    $($.parseXML('<bodsod></bodsod>')).find('bodsod').insertAfter($(target).find('> parameters'))
                  }
                  if (!$(target).find('> _sod')[0]){
                    $($.parseXML('<_sod></_sod>')).find('sod').appendTo($(target).find('> bodsod'))
                  }
                  $($.parseXML('<sod><id>'+node[0].id+'</id></sod>')).find('sod').appendTo($(target).find('> bodsod > _sod'))
                  Array.from($('select[data-relaxngui-path=" > call > bodsod > _sod > sod > id"]')).forEach(function(e1) {
                    if(element.children[0].innerHTML != "Choose id" && e1.value != element.children[0].innerHTML) {
                      $(e1).find('option[value="'+element.children[0].innerHTML+'"]').remove()
                    }
                  })
                }
              }
            })
          } else {
            nnewArray = Array.from($(nnew).find("sod")).toSorted((a,b) => a.textContent > b.textContent ? 1:-1)
            nodeArray = Array.from($(node).find("sod")).toSorted((a,b) => a.textContent > b.textContent ? 1:-1)
            for (let i = 0; i < nnewArray.length; i++) {
              if (nnewArray[i].children[0].innerHTML != nodeArray[i].children[0].innerHTML) {
                  desc.get_node_by_svg_id(nodeArray[i].children[0].innerHTML).find('sod:contains("'+svgid+'")').remove()
                  Array.from($('select[data-relaxngui-path=" > call > bodsod > _sod > sod > id"]')).forEach(function(e1) {
                    if(!$(e1).find('option[value="'+nodeArray[i].children[0].innerHTML+'"]')[0]) {
                      $($.parseHTML('<option value="'+nodeArray[i].children[0].innerHTML+'">'+nodeArray[i].children[0].innerHTML+'</option>')).appendTo(e1)
                      oldValue = $(e1)[0].value
                      $(e1).find('option').sort((a,b) => $(a).text() > $(b).text() ? 1 : -1).detach().appendTo($(e1))
                      $(e1)[0].value = oldValue
                    }
                  })
                  target = desc.get_node_by_svg_id(nnewArray[i].children[0].innerHTML)
                  if (!$(target).find('sod:contains("'+node[0].id+'")')[0]){
                    if (!$(target).find('> bodsod')[0]){
                      $($.parseXML('<bodsod></bodsod>')).find('bodsod').insertAfter($(target).find('> parameters'))
                    }
                    if (!$(target).find('> _sod')[0]){
                      $($.parseXML('<_sod></_sod>')).find('sod').appendTo($(target).find('> bodsod'))
                    }
                    $($.parseXML('<sod><id>'+node[0].id+'</id></sod>')).find('sod').appendTo($(target).find('> bodsod > _sod'))
                    Array.from($('select[data-relaxngui-path=" > call > bodsod > _sod > sod > id"]')).forEach(function(e1) {
                      if(nnewArray[i].children[0].innerHTML != "Choose id" && e1.value != nnewArray[i].children[0].innerHTML) {
                        $(e1).find('option[value="'+nnewArray[i].children[0].innerHTML+'"]').remove()
                      }
                    })
                  }
                break
              }
            }
          }
          if (Array.from($(node).find("bod")).length > Array.from($(nnew).find("bod")).length) {
            Array.from($(node).find("bod")).forEach(function(element) {
              if (!$(nnew).find('bod:contains("'+element.children[0].innerHTML+'")')[0]){
                target = desc.get_node_by_svg_id(element.children[0].innerHTML)
                target.find('bod:contains("'+svgid+'")').remove()
                Array.from($('select[data-relaxngui-path=" > call > bodsod > _bod > bod > id"]')).forEach(function(e1) {
                  if(!$(e1).find('option[value="'+element.children[0].innerHTML+'"]')[0]) {
                    $($.parseHTML('<option value="'+element.children[0].innerHTML+'">'+element.children[0].innerHTML+'</option>')).appendTo(e1)
                    oldValue = $(e1)[0].value
                    $(e1).find('option').sort((a,b) => $(a).text() > $(b).text() ? 1 : -1).detach().appendTo($(e1))
                    $(e1)[0].value = oldValue
                  }
                })
                Array.from($(nnew).find("bod")).forEach(function(e) {
                  e = desc.get_node_by_svg_id(e.children[0].innerHTML)
                  e.find('bod:contains("'+element.children[0].innerHTML+'")').remove()
                  target.find('bod:contains("'+e[0].id+'")').remove()
                })
              }
            })
          } else if (Array.from($(node).find("bod")).length < Array.from($(nnew).find("bod")).length){
            Array.from($(nnew).find("bod")).forEach(function(element) {
              if (!$(node).find('bod:contains("'+element.children[0].innerHTML+'")')[0]){
                target = desc.get_node_by_svg_id(element.children[0].innerHTML)
                if (!$(target).find('bod:contains("'+node[0].id+'")')[0]){
                  if (!$(target).find('> bodsod')[0]){
                    $($.parseXML('<bodsod></bodsod>')).find('bodsod').insertAfter($(target).find('> parameters'))
                  }
                  if (!$(target).find('> _bod')[0]){
                    $($.parseXML('<_bod></_bod>')).find('bod').appendTo($(target).find('> bodsod'))
                  }
                  $($.parseXML('<bod><id>'+node[0].id+'</id></bod>')).find('bod').appendTo($(target).find('> bodsod > _bod'))
                  Array.from($('select[data-relaxngui-path=" > call > bodsod > _bod > bod > id"]')).forEach(function(e1) {
                    if(element.children[0].innerHTML != "Choose id" && e1.value != element.children[0].innerHTML) {
                      $(e1).find('option[value="'+element.children[0].innerHTML+'"]').remove()
                    }
                  })
                  Array.from($(node).find('bod')).forEach(function(e) {
                    e = desc.get_node_by_svg_id(e.children[0].innerHTML)
                    if (!e.find('bod:contains("'+element.children[0].innerHTML+'")')[0]) {
                      $($.parseXML('<bod><id>'+element.children[0].innerHTML+'</id></bod>')).find('bod').appendTo($(e).find('> bodsod > _bod'))
                    }
                    if (!target.find('bod:contains("'+e[0].id+'")')[0]) {
                      $($.parseXML('<bod><id>'+e[0].id+'</id></bod>')).find('bod').appendTo($(target).find('> bodsod > _bod'))
                    }
                  })
                }
              }
            })
          } else {
            nnewArray = Array.from($(nnew).find("bod")).toSorted((a,b) => a.textContent > b.textContent ? 1:-1)
            nodeArray = Array.from($(node).find("bod")).toSorted((a,b) => a.textContent > b.textContent ? 1:-1)
            for (let i = 0; i < nnewArray.length; i++) {
              if (nnewArray[i].children[0].innerHTML != nodeArray[i].children[0].innerHTML) {
                  desc.get_node_by_svg_id(nodeArray[i].children[0].innerHTML).find('bod:contains("'+svgid+'")').remove()
                  Array.from($('select[data-relaxngui-path=" > call > bodsod > _bod > bod > id"]')).forEach(function(e1) {
                    if(!$(e1).find('option[value="'+nodeArray[i].children[0].innerHTML+'"]')[0]) {
                      $($.parseHTML('<option value="'+nodeArray[i].children[0].innerHTML+'">'+nodeArray[i].children[0].innerHTML+'</option>')).appendTo(e1)
                      oldValue = $(e1)[0].value
                      $(e1).find('option').sort((a,b) => $(a).text() > $(b).text() ? 1 : -1).detach().appendTo($(e1))
                      $(e1)[0].value = oldValue
                    }
                  })
                  nnewArray.forEach(function(e) {
                    e = desc.get_node_by_svg_id(e.children[0].innerHTML)
                    e.find('bod:contains("'+nodeArray[i].children[0].innerHTML+'")').remove()
                    desc.get_node_by_svg_id(nodeArray[i].children[0].innerHTML).find('bod:contains("'+e[0].id+'")').remove()
                  })
                  target = desc.get_node_by_svg_id(nnewArray[i].children[0].innerHTML)
                  if (!$(target).find('bod:contains("'+node[0].id+'")')[0]){
                    if (!$(target).find('> bodsod')[0]){
                      $($.parseXML('<bodsod></bodsod>')).find('bodsod').insertAfter($(target).find('> parameters'))
                    }
                    if (!$(target).find('> _bod')[0]){
                      $($.parseXML('<_bod></_bod>')).find('bod').appendTo($(target).find('> bodsod'))
                    }
                    $($.parseXML('<bod><id>'+node[0].id+'</id></bod>')).find('bod').appendTo($(target).find('> bodsod > _bod'))
                    Array.from($('select[data-relaxngui-path=" > call > bodsod > _bod > bod > id"]')).forEach(function(e1) {
                      if(nnewArray[i].children[0].innerHTML != "Choose id" && e1.value != nnewArray[i].children[0].innerHTML) {
                        $(e1).find('option[value="'+nnewArray[i].children[0].innerHTML+'"]').remove()
                      }
                    })
                    nnewArray.forEach(function(e) {
                      if (e.children[0].innerHTML != nnewArray[i].children[0].innerHTML) {
                        e = desc.get_node_by_svg_id(e.children[0].innerHTML)
                        if (!e.find('bod:contains("'+nnewArray[i].children[0].innerHTML+'")')[0]) {
                          $($.parseXML('<bod><id>'+nnewArray[i].children[0].innerHTML+'</id></bod>')).find('bod').appendTo($(e).find('> bodsod > _bod'))
                        }
                        if (!target.find('bod:contains("'+e[0].id+'")')[0]) {
                          console.log(e[0].id)
                          $($.parseXML('<bod><id>'+e[0].id+'</id></bod>')).find('bod').appendTo($(target).find('> bodsod > _bod'))
                        }
                      }
                    })
                  }
                break
              }
            }
          }
    })
})