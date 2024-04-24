/*
  This file is part of RelaxNGui.

  RelaxNGui is free software: you can redistribute it and/or modify it under
  the terms of the GNU General Public License as published by the Free Software
  Foundation, either version 3 of the License, or (at your option) any later
  version.

  RelaxNGui is distributed in the hope that it will be useful, but WITHOUT ANY
  WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
  A PARTICULAR PURPOSE. See the GNU General Public License for more details.

  You should have received a copy of the GNU General Public License along with
  RelaxNGui (file COPYING in the main directory).  If not, see
  <http://www.gnu.org/licenses/>.
*/

var RelaxNGui = function(rng,target,ceval,ignore=false) {
  if (!(rng instanceof XMLDocument)) { // rng has to be XMLDocument //{{{
    rng = $XR($(rng).serializeXML());
  } //}}}

  var lenextract = function(tag, lencount) { //{{{
    $.each(tag.attributes,function(k,v){
      if ((v.localName == 'label') && (v.namespaceURI == 'http://rngui.org')) { lencount = v.nodeValue.length > lencount ? v.nodeValue.length : lencount; }
    });
    return lencount;
  }; //}}}

  var labextract = function(type,tag) { //{{{
    var ret = { 'type': type, 'wrap': false, 'readonly': false, 'label': '', default: '' };
    $.each(tag.attributes,function(k,v){
      if ((v.localName == 'label') && (v.namespaceURI == 'http://rngui.org')) { ret['label'] = v.nodeValue; }
      if ((v.localName == 'readonly') && (v.namespaceURI == 'http://rngui.org')) { ret['readonly'] = v.nodeValue == 'true' ? true : false; }
      if ((v.localName == 'wrap') && (v.namespaceURI == 'http://rngui.org')) { ret['wrap'] = v.nodeValue == 'true' ? true : false; }
    });
    $.each(tag.children,function(k,v){
      if ((v.localName == 'param') && (v.namespaceURI == 'http://relaxng.org/ns/structure/1.0')) {
        $.each(v.attributes,function(l,w){
          if ((w.localName == 'name') && (w.nodeValue == 'minInclusive')) {
            ret['min'] = v.lastChild.nodeValue;
          }
          if ((w.localName == 'name') && (w.nodeValue == 'maxInclusive')) {
            ret['max'] = v.lastChild.nodeValue;
          }
        });
      }
    });
    return ret;
  }; //}}}

  var addelements = function(target,container) { //{{{
    var template = target.parent().find('> .relaxngui_template').clone(true,true);
    template.removeClass('relaxngui_template');
    template.find('[data-relaxngui-template]').each(function(j,t){
      $(t).attr('data-relaxngui-template',false);
    });
    template.find('.relaxngui_template [data-relaxngui-template]').each(function(j,t){
      $(t).attr('data-relaxngui-template',true);
    });
    template.addClass('relaxngui_dyn');
    template.on('click', '> *:first-child', function(ev){ delelements($(ev.target)); });

    if (container.find('> .relaxngui_dyn').length % 2 == 1) {
      var evens = template.find('.even');
      var odds = template.find('.odd');
      evens.each(function(k,v){
        $(v).removeClass('even');
        $(v).addClass('odd');
      });
      odds.each(function(k,v){
        $(v).removeClass('odd');
        $(v).addClass('even');
      });
    }

    container.append(template);
  }; //}}}

  var delelements = function(target) { //{{{
    var it = target.parent();
    var par = target.parent().parent();
    it.remove();
    par.trigger('relaxngui_remove');
  }; //}}}

  var recshow_header = function(tag,ret,level){ //{{{
    var header;
    var fold;
    $.each(tag.attributes,function(k,v){
      if ((v.localName == 'header') && (v.namespaceURI == 'http://rngui.org')) { header = v.nodeValue; }
      if ((v.localName == 'fold') && (v.namespaceURI == 'http://rngui.org')) { fold = v.nodeValue; }
    });
    if (header) {
      if (fold != undefined) {
        var xxx = $("<div data-relaxngui-level='" + level + "' class='relaxngui_header fold'>" + header + "</div>");
            xxx.prepend($("<span class='relaxngui_fold'></span>"));
        ret.append(xxx);
        if (fold == 'closed' || fold == 'closed_conditional') {
          ret.addClass('closed');
        }
        if (fold == 'closed_conditional') {
          ret.addClass(fold);
        }
      } else {
        ret.append($("<div data-relaxngui-level='" + level + "' class='relaxngui_header'>" + header + "</div>"));
      }
    }
    return fold;
  } //}}}

  var recshow_single = function(tag,ret,template,path,lencount,optional){ //{{{
    var node = $('<div class="relaxngui_row"/>');
    var name;
    var label;
    var labeltype;
    var second = {};
    var datalist = [];
    var defaul = '';
    var hint = '';
    var retcount = 0;
    $.each(tag.attributes,function(k,v){
      if ((v.localName == 'label')     && (v.namespaceURI == 'http://rngui.org')) { label  = v.nodeValue; }
      if ((v.localName == 'date')      && (v.namespaceURI == 'http://rngui.org')) { label  = v.nodeValue; }
      if ((v.localName == 'labeltype') && (v.namespaceURI == 'http://rngui.org')) { labeltype  = v.nodeValue; }
      if ((v.localName == 'default')   && (v.namespaceURI == 'http://rngui.org')) { defaul = v.nodeValue; }
      if ((v.localName == 'hint')      && (v.namespaceURI == 'http://rngui.org')) { hint   = v.nodeValue; }
      if  (v.localName == 'name')                                                 { name   = v.nodeValue.replace(/:/,'\\:'); }
    });

    $.each($(tag).children('data[type=string]'), function(k,v) { second = labextract('string',v); });
    $.each($(tag).children('data[type=integer]'), function(k,v) { second = labextract('integer',v); });
    $.each($(tag).children('data[type=nonNegativeInteger]'), function(k,v) { second = labextract('nonNegativeInteger',v); });
    $.each($(tag).children('data[type=positiveInteger]'), function(k,v) { second = labextract('positiveInteger',v); });
    $.each($(tag).children('data[type=float]'), function(k,v) { second = labextract('float',v); });
    $.each($(tag).children('data[type=date]'), function(k,v) { second = labextract('date',v); });
    $.each($(tag).children('text'), function(k,v) { second = labextract('text',v); });
    $.each($(tag).find('choice > value'), function(k,v) {
      second = labextract('datalist',$(v).parent()[0]);
      datalist.push([v.textContent,$(v).attr('id') ? $(v).attr('id') : v.textContent]);
    });
    if (name && label) {
      node.append($("<label class='relaxngui_cell" + (optional && defaul == '' ? " optional": "") + "' style='min-width: " + (lencount+1) + "ex' for=''>" + label + "</label><span class='relaxngui_cell'>⇒</span>"));
    } else if (name) {
      // a tag without information is ignored
      node.addClass('relaxngui_hidden');
    } else if (label) {
      if (labeltype == 'xml') {
        node.append($("<input data-relaxngui-template='" + template + "' data-relaxngui-parent='" + path + "' data-relaxngui-path='" + path + " > *[data-name]' class='relaxngui_cell' type='text' pattern='^[a-zA-Z_][a-zA-Z0-9_-]*$' id='' placeholder='" + label + "'></input><span class='relaxngui_cell'>⇒</span>"));
      } else {
        node.append($("<input data-relaxngui-template='" + template + "' data-relaxngui-parent='" + path + "' data-relaxngui-path='" + path + " > *[data-name]' class='relaxngui_cell' type='text' pattern='^[a-z_][a-zA-Z0-9_]*$' id='' placeholder='" + label + "'></input><span class='relaxngui_cell'>⇒</span>"));
      }
    }

    var tpath = ((typeof name === 'undefined') ? path + ' > *' : (tag.localName == 'element' ? path + ' > ' + name : path + '[' + name + ']'));
    if (label) {
      if (defaul && typeof defaul == 'string' && defaul.match(/^javascript:/)) {
        defaul = defaul.replace(/^javascript:/,'');
        defaul = ceval ? ceval(defaul) : eval(defaul);
      }
      var os = (optional ? " onkeyup='var sl = $(this).siblings(\"label\"); if ($(this).get_val() == \"\") { if (!sl.hasClass(\"optional\")) { sl.addClass(\"optional\") } } else { sl.removeClass(\"optional\") }' data-optional='true'" : " data-optional='false'");
      if (second.readonly)
        node.append($("<input      " + (defaul && typeof defaul == 'string' ? 'value="' + defaul + '"' : '') + " data-relaxngui-template='" + template + "' data-relaxngui-parent='" + path + "' data-relaxngui-path='" + tpath + "' class='relaxngui_cell' type='text'              id='' readonly='readonly'" + os + "></input>"));
      else {
        if (second.type == 'string') {
          node.append($("<input    " + (defaul && typeof defaul == 'string' ? 'value="' + defaul + '"' : '') + " data-relaxngui-template='" + template + "' data-relaxngui-parent='" + path + "' data-relaxngui-path='" + tpath + "' class='relaxngui_cell' type='text'              id='' placeholder='" + second.label + "'" + os + "></input>"));
        } else if (second.type == 'integer') {
          node.append($("<input    " + (defaul && typeof defaul == 'string' ? 'value="' + defaul + '"' : '') + " data-relaxngui-template='" + template + "' data-relaxngui-parent='" + path + "' data-relaxngui-path='" + tpath + "' class='relaxngui_cell' type='number'            id='' placeholder='" + second.label + "'" + (second.min != undefined ? (" min='" + second.min + "'") : '') + (second.max != undefined ? (" max='" + second.max + "'") : '') + os + "></input>"));
        } else if (second.type == 'positiveInteger') {
          if (second.min == undefined) second.min = 1;
          node.append($("<input    " + (defaul && typeof defaul == 'string' ? 'value="' + defaul + '"' : '') + " data-relaxngui-template='" + template + "' data-relaxngui-parent='" + path + "' data-relaxngui-path='" + tpath + "' class='relaxngui_cell' type='number'            id='' placeholder='" + second.label + "'" + (second.min != undefined ? (" min='" + second.min + "'") : '') + (second.max != undefined ? (" max='" + second.max + "'") : '') + os + "></input>"));
        } else if (second.type == 'nonNegativeInteger') {
          if (second.min == undefined) second.min = 0;
          node.append($("<input    " + (defaul && typeof defaul == 'string' ? 'value="' + defaul + '"' : '') + " data-relaxngui-template='" + template + "' data-relaxngui-parent='" + path + "' data-relaxngui-path='" + tpath + "' class='relaxngui_cell' type='number'            id='' placeholder='" + second.label + "'" + (second.min != undefined ? (" min='" + second.min + "'") : '') + (second.max != undefined ? (" max='" + second.max + "'") : '') + os + "></input>"));
        } else if (second.type == 'date') {
          node.append($("<input    " + (defaul && typeof defaul == 'string' ? 'value="' + defaul + '"' : '') + " data-relaxngui-template='" + template + "' data-relaxngui-parent='" + path + "' data-relaxngui-path='" + tpath + "' class='relaxngui_cell' type='date'              id='' placeholder='" + second.label + "'" + os + "></input>"));
        } else if (second.type == 'float') {
          node.append($("<input    " + (defaul && typeof defaul == 'string' ? 'value="' + defaul + '"' : '') + " data-relaxngui-template='" + template + "' data-relaxngui-parent='" + path + "' data-relaxngui-path='" + tpath + "' class='relaxngui_cell' type='number' step='any' id='' placeholder='" + second.label + "'" + (second.min != undefined ? (" min='" + second.min + "'") : '') + (second.max != undefined ? (" max='" + second.max + "'") : '') + os + "></input>"));
        } else if (second.type == 'text') {
          node.append($("<div contenteditable='true' data-relaxngui-wrap='" + second.wrap + "' " + (defaul && typeof defaul == 'string' ? 'value="' + defaul + '"' : '') + " data-relaxngui-template='" + template + "' data-relaxngui-parent='" + path + "' data-relaxngui-path='" + tpath + "' class='relaxngui_cell'               id='' placeholder='" + second.label + "'" + os + "></div>"));
        } else if (second.type == 'datalist') {
          var tnode = $("<select   " + (defaul && typeof defaul == 'string' ? 'value="' + defaul + '"' : '') + " data-relaxngui-template='" + template + "' data-relaxngui-parent='" + path + "' data-relaxngui-path='" + tpath + "' class='relaxngui_cell'               id='' size='1'" + os + "></select>");
          $.each(datalist,function(didx,dname){
            if (dname[1] == defaul)
              tnode.append('<option value="' + dname[1] + '" selected="selected">' + dname[0] + '</value>');
            else
              tnode.append('<option value="' + dname[1] + '">' + dname[0] + '</value>');
          });
          node.append(tnode);
        }
      }
      ret.append(node);
      retcount += 1;
    } else {
      if (tag.localName != 'element') { // its an attribute, simulate its empty-ness
        node.attr('data-relaxngui-template',template);
        node.attr('data-relaxngui-parent',path);
        node.attr('data-relaxngui-path',tpath);
        ret.append(node);
        retcount += 1;
      }
    }
    if (hint) {
      var n  = $('<div class="relaxngui_hint"/>');
      var s1 = $('<em>Hint: </em>');
      var s2 = $('<span/>');
          s2.text(hint);

      n.append(s1);
      n.append(s2);
      ret.append(n);
      retcount += 1;
    }
    return retcount;
  } //}}}

  var recshow = function(elements,template,path,attr) { //{{{
    // delete all elements with relaxngui:ignore
    if (attr.ignore) {
      var tele = $.grep(elements,function(tagv){
        var include = true;
        $.each(tagv.attributes,function(k,v){
          if ((v.localName == 'ignore') && (v.namespaceURI == 'http://rngui.org')) {
            include = false;
          }
        });
        return include;
      });
      elements = $(tele);
    }

    var ret = $('<div/>');

    var lencount = 0;
    $.each(elements,function(k,v){
      var tag = $(v)[0];
      if ((tag.localName == 'element') && (tag.namespaceURI == 'http://relaxng.org/ns/structure/1.0')) {
        $(tag).children('attribute').each(function(l,w){
          lencount = lenextract($(w)[0],lencount);
        });
        lencount = lenextract(tag,lencount);
      }
    });
    $.each(elements,function(k,v){
      if (attr.mode == 'even') { attr.mode = 'odd' }
      else { attr.mode = 'even'; }

      var tag = $(v)[0];
      if ((tag.localName == 'element') && (tag.namespaceURI == 'http://relaxng.org/ns/structure/1.0')) {
        var xxx;
        if (template) {
          var yyy = $('<div class="relaxngui_table ' + attr.mode + '" data-relaxngui-template="true" data-relaxngui-parent="' + path + '" data-relaxngui-path="' + (path == '' ? ' > '  + (typeof elements.attr('name') === 'undefined' ? '*' : elements.attr('name')) : path + ' > ' + (typeof $(tag).attr('name') === 'undefined' ? '*' : $(tag).attr('name'))) + '[data-main]">');
          xxx = $('<div class="relaxngui_template"><span>✖</span></div>');
          xxx.append(yyy);
          ret.append(xxx);
          xxx = yyy;
        } else {
          xxx = $('<div class="relaxngui_table ' + attr.mode + '" data-relaxngui-template="false" data-relaxngui-parent="' + path + '" data-relaxngui-path="' + (path == '' ? ' > '  + elements.attr('name') : path + ' > ' + $(tag).attr('name')) + '[data-main]">');
          ret.append(xxx);
        }

        recshow_header(tag,xxx,attr.level);
        var rcount = 0;
        $(tag).children('attribute').each(function(l,w){
          var ttag = $(w)[0];
          rcount += recshow_single(ttag,xxx,template,path + ' > ' + $(tag).attr('name'),lencount,attr.optional ? true : false);
        });
        rcount += recshow_single(tag,xxx,template,path,lencount,attr.optional ? true : false);

        var sub;
        if (sub = recshow($(tag).children('element, zeroOrMore, optional, choice'),false,path + ' > ' + $(tag).attr('name'),{ ignore: attr.ignore, mode: (attr.mode == 'even' && rcount % 2 == 0 ? 'odd' : 'even' ), level: attr.level + 1 })) {
          var inode = xxx.append(sub);
          if (template) {
            inode.find('[data-relaxngui-template]').each(function(j,t){
              $(t).attr('data-relaxngui-template',true);
            });
          }
        }
      } else if ((tag.localName == 'zeroOrMore') && (tag.namespaceURI == 'http://relaxng.org/ns/structure/1.0')) {
        var label;
        $.each(tag.attributes,function(k,v){
          if ((v.localName == 'label') && (v.namespaceURI == 'http://rngui.org')) { label = v.nodeValue; }
        });
        var but = $('<button class="relaxngui_control">' + label + '</button>');
            but.on('click',function(ev){ addelements($(ev.target),$(ev.target).parent()); });

        ret.append(recshow($(tag).children(),true,path,{ ignore: attr.ignore, mode: attr.mode, level: attr.level }));
        ret.append(but);
      } else if ((tag.localName == 'optional') && (tag.namespaceURI == 'http://relaxng.org/ns/structure/1.0')) {
        ret.append(recshow($(tag).children('element, zeroOrMore'),false,path,{ ignore: attr.ignore, mode: (attr.mode == 'even' ? 'odd' : 'even'), optional: true, level: attr.level + 1 }));
      } else if ((tag.localName == 'choice') && (tag.namespaceURI == 'http://relaxng.org/ns/structure/1.0')) {
        if (!($(tag).children()[0].localName == 'value' && $(tag).children()[0].namespaceURI)) {
          $.each($(tag).children(),function(j,u){
            var label;
            $.each(u.attributes,function(k,v){
              if ((v.localName == 'label') && (v.namespaceURI == 'http://rngui.org')) { label = v.nodeValue; }
            });
            var but = $('<button class="relaxngui_control">' + label + '</button>');
                but.on('click',function(ev){ addelements($(ev.target),$(ev.target).parent().parent()); });
            var col = $('<span></span');
            col.append(recshow($(u).children(),true,path,{ ignore: attr.ignore, mode: attr.mode }));
            col.append(but);
            ret.append(col);
          });
        }
      }
    });
    return ret.children().length > 0 ? ret.children() : undefined;
  }; //}}}

  var serializeXML = function (xml) { //{{{
    var out = '';
    if (typeof XMLSerializer == 'function') {
        var xs = new XMLSerializer();
        $(xml).each(function() {
            out += xs.serializeToString(this);
        });
    } else if (xml && xml.xml != 'undefined') {
        $(xml).each(function() {
            out += this.xml;
        });
    }
    return out;
  }; //}}}
  this.save = function() { //{{{
    var xml;
    var curr;
    var tar = target.find('[data-relaxngui-path]:not([data-relaxngui-template=true])');
    for (var i = 0; i<tar.length;) {
      var path = $(tar[i]).attr('data-relaxngui-path');
      var parent_path = $(tar[i]).attr('data-relaxngui-parent');
      if (i == 0) {
        var par = path.replace(/\[data-main\]/,'').replace(/ > /,'');
        xml = $XR('<' + par + '/>');
      } else {
        var ma = path.match(/([^\s]+)$/)[1];
        var att;
        if (ma.match(/\*\[data-main\]/)) {
          // do nothing. seriously. explicitly.
        } else if (ma.match(/\[data-main\]/)) {
          var par = ma.replace(/\[data-main\]/,'');
          var curr = $($XR('<' + par + '/>').documentElement);
          $(parent_path,xml).last().append(curr);
        } else if (ma.match(/\[data-name\]/)) {
          if ($(tar[i]).get_val()) {
            var nn =  $($XR('<' + $(tar[i]).get_val() + '/>').documentElement).text($(tar[i+1]).get_val());
            $(parent_path,xml).append(nn);
          }
          i+=1;
        } else if (att = ma.match(/\[([^\]]+)\]$/)) {
          att[1] = att[1].replace(/\\/,'');
          $(parent_path + ':last-child',xml).last().attr(att[1],$(tar[i]).get_val());
        } else {
          if ($(tar[i]).attr('data-optional') == 'true' && $(tar[i]).get_val() == '') {
            $(path + ':last-child',xml).last().remove();
          } else {
            $(path + ':last-child',xml).last().text($(tar[i]).get_val())
          }
        }
      }
      i+=1;
    }
    return xml;
  }; //}}}
  this.save_text = function() { //{{{
    return serializeXML(self.save());
  } //}}}

  this.content = function(data) { //{{{
    if (!(data instanceof XMLDocument)) { // data has to be XMLDocument //{{{
      data = $XR($(data).serializeXML());
    } //}}}

    if (data) {
      var x = $(data).serializePrettyXML();
      x = x.replace(/\s+xmlns(:[a-zA-Z0-9]+)?=\"[^\"]+\"/g, "");
      x = x.replace(/<\?[^>]+>/g, "");
      x = x.trim();
      y = $(self.save()).serializePrettyXML();
      if (x != y) {
        target.find('.relaxngui_dyn').remove();
        target.find('[data-relaxngui-path]').each(function(k,pa){
          var path = $(pa).attr('data-relaxngui-path');
          if (!path.match(/data-\w+\]$/)) {
            if ($(pa).attr('data-relaxngui-template') == 'true' && path.match(/\*$/)) {
              $(data).find(path).each(function(index,ele){
                $(target.find('[data-relaxngui-path="' + path + '[data-name]"][data-relaxngui-template="false"]').get(index)).set_val(ele.localName);
                $(target.find('[data-relaxngui-path="' + path + '"][data-relaxngui-template="false"]').get(index)).set_val($(ele).text());
              });
            } else if ($(pa).attr('data-relaxngui-template') == 'true' && !path.match(/\*$/)) {
              $(data).find(path).each(function(index,ele){
                var att;
                var val;
                if (att = path.match(/(.*)\[([^\]]+)\]$/)) {
                  val = $(ele).attr(att[2]);
                } else {
                  val = $(ele).text();
                }
                if (val && val != '') {
                  $(target.find('[data-relaxngui-path="' + path + '"][data-relaxngui-template="false"]').get(index)).set_val(val);
                }
              });
            } else {
              var att;
              var val;
              if (att = path.match(/(.*)\[([^\]]+)\]$/)) {
                val = $(data).find(att[1]).attr(att[2]);
              } else {
                val = $(data).find(path).text();
              }
              if (val && val != '') {
                var t = target.find('[data-relaxngui-path="' + path + '"]');
                t.set_val(val);
                if (t.attr('data-optional') == 'true') {
                  t.siblings('label').removeClass('optional');
                }
              }
            }
          } else {
            console.log('-----');
            console.log(path);
            if ($(pa).attr('data-relaxngui-template') == 'true') {
              var buts;
              var buts1 = target.find('.relaxngui_table[data-relaxngui-template="false"] > .relaxngui_template > [data-relaxngui-path="' + path + '"][data-relaxngui-template="true"]').parent().parent().find('> button');
              var buts2 = target.find('.relaxngui_table[data-relaxngui-template="false"] > span > .relaxngui_template > [data-relaxngui-path="' + path + '"][data-relaxngui-template="true"]').parent().parent().find('> button');
              if (buts1.length > 0) { buts = buts1; }
              if (buts2.length > 0) { buts = buts2; }
              if(!buts){ buts = $(); }
              console.log(buts);
              buts.each(function(_,b) {
                var but = $(b);
                var dpath = path.replace(/\[data-main\]$/,'');
                var par = undefined;
                var ind = -1;
                  console.log('a');

                $(data).find(dpath).each(function(ke,ele){
                  if (par != $(ele).parent()[0]) {
                    ind += 1;
                    par = $(ele).parent()[0];
                  }
                  console.log(but.get(ind));
                  if ($(but.get(ind)).attr('disabled')) {
                    $(but.get(ind)).removeAttr('disabled');
                    but.get(ind).click();
                    $(but.get(ind)).attr('disabled','disabled');
                  } else {
                    but.get(ind).click();
                  }
                });
              });
            }
          }
        });
        self.set_checkpoint();
      }
      target.find('.relaxngui_table.closed_conditional').each(function(k,e) {
        $(e).find('input:not([readonly]), [contenteditable]:not([readonly])').each(function(l,f) {
          if ($(f).get_val() != '') {
            $(e).removeClass('closed');
          }
        });
      });
    }
  }; //}}}

  // stuff to determine if user changed something
  var orig = '';
  this.set_checkpoint = function() { //{{{
    orig = self.save_text();
  } //}}}
  this.has_changed = function() { //{{{
    if (orig != self.save_text()) {
      return true;
    } else {
      return false;
    }
  } //}}}

  target.append(recshow($(rng.documentElement),false,'',{ ignore: ignore, mode: 'even', level: 0}));

  var self = this;

  target.unbind('click.relaxngui');
  target.on('click.relaxngui','.relaxngui_header.fold',function(){
    $(this).parent().toggleClass('closed');
  });
};
