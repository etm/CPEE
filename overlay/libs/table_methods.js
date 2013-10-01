//<![CDATA[

$.fn.serializeXML = function () {
    var out = '';
    if (typeof XMLSerializer == 'function') {
        var xs = new XMLSerializer();
        this.each(function() {
            out += xs.serializeToString(this);
        });
    } else if (this[0] && this[0].xml != 'undefined') {
        this.each(function() {
            out += this.xml;
        });
    }
    return out;
};

$.fn.serializePrettyXML = function () {
  var par = new DOMParser();
  var xsl = par.parseFromString("<xsl:stylesheet version=\"1.0\" xmlns:xsl=\"http://www.w3.org/1999/XSL/Transform\"> <xsl:output method=\"xml\"/> <xsl:param name=\"indent-increment\" select=\"'   '\" /> <xsl:template match=\"*\"> <xsl:param name=\"indent\" select=\"'&#xA;'\"/> <xsl:value-of select=\"$indent\"/> <xsl:copy> <xsl:copy-of select=\"@*\" /> <xsl:apply-templates> <xsl:with-param name=\"indent\" select=\"concat($indent, $indent-increment)\"/> </xsl:apply-templates> <xsl:value-of select=\"$indent\"/> </xsl:copy> </xsl:template> <xsl:template match=\"comment()|processing-instruction()\"> <xsl:copy /> </xsl:template> <!-- WARNING: this is dangerous. Handle with care --> <xsl:template match=\"text()[normalize-space(.)='']\"/> </xsl:stylesheet>",'text/xml');
  var piece = this[0]; 

  if (document.implementation && document.implementation.createDocument) {
    xsltProcessor=new XSLTProcessor();
    xsltProcessor.importStylesheet(xsl);
    resultDocument = xsltProcessor.transformToFragment(piece,document);
    return $(resultDocument).serializeXML().replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};

function test(uri) {
  $.ajax({
    url: uri,
    type: 'DELETE',
    error: function(){
      window.location.reload();
    },
    success: function(){
      window.location.reload();
    }
  });
}
function rathalos(){
  var chi = $("#ul_id").children();
  chi.each(function(){
    $(this).children('#delete_button').click(function(){
      test($(this).attr('value'));
    });
  });
  var doc_table = $('#test_id');
  var table_end_temp = "</tbody></table><br />";
  // Not the most beatiful strings anymore.
  $.ajax({
    url: "?riddl-resource-description",
    dataType: 'xml',
    success: function(data){
      var rc = $(data).find('resource');
      var rc_chi = rc.children();
      var cook = new Object;
      cook.zahl = 1;
      rc_chi.each(function(){
        var maybe_doc = (this.children);
        var ns_uri = this.namespaceURI;
        if(ns_uri!="http://riddl.org/ns/description/1.0")
          return true;
        var tr_yn=1;
        var naga_siren = new Object;
        naga_siren.tstring = 
          "<table class='operation'>"+
            "<tbody>" +
              "<tr>" +
                "<td class='name'>" +
                  "Method" +
                "</td>" + 
                "<td>" +
                  "<strong>" +
                    "%METHOD%" +
                  "</strong>" +
                "</td>" +
              "</tr>" +
              "%DOCUMENTATION%" +
              "<tr>" +
                "<td rowspan=\"%IROWSPAN%\" class='name'>" +
                  "<table>" +
                    "<tr>" +
                      "<td>" +
                        "Inputparameter(s)" +
                      "</td>" +
                    "</tr>" +
                    "<tr>" +
                      "<td>" +
                        "(%MSG_NAME%)" +
                      "</td>" +
                    "</tr>" +
                  "</table>" +
                "</td>";
        naga_siren.spanne = 0;
        var converter = new Showdown.converter();
        if(maybe_doc.length>0){
          naga_siren.tstring = naga_siren.tstring.replace(/%DOCUMENTATION%/,"<tr><td class='name'>Dokumentation</td><td>"+converter.makeHtml($(maybe_doc.item(0)).text())+"</td></tr>"); 
      //    console.log(converter.makeHtml(maybe_doc.item(0).innerHTML));
          }
        else
          naga_siren.tstring = naga_siren.tstring.replace(/%DOCUMENTATION%/,"");
        var msg_name = $(this).attr('in');
        var msg_search = "message[name='"+msg_name+"']";
        var method_name = $(this).prop('tagName');
        var templat = "";
        if($(data).find(msg_search).children().length >0){
          $(data).find(msg_search).children().each(function(){
              var spacing = 0;
              naga_siren = timbersaw($(this),spacing,naga_siren,tr_yn,cook);
              tr_yn = 0;
          });
        }
        else{
          naga_siren.tstring = naga_siren.tstring + "<td>*</td></tr>"
          naga_siren.spanne++;
        }
        var tr_yn = 1;
        naga_siren.tstring += 
          "<tr>"+
          "<td rowspan=\"%OROWSPAN%\" class='name'>" +
            "<table>" +
              "<tr>" +
                "<td>" +
                  "Output" +
                "</td>" +
              "</tr>" +
              "<tr>" +
                "<td >" +
                  "(%OMSG_ID%)" +
                "</td>"+
              "</tr>" +
            "</table>" +
          "</td>";
        naga_siren.isp = naga_siren.spanne;
        naga_siren.tstring = naga_siren.tstring.replace(/%IROWSPAN%/,naga_siren.isp);
        naga_siren.tstring = naga_siren.tstring.replace(/%METHOD%/,$(this).prop('tagName'));
        naga_siren.tstring = naga_siren.tstring.replace(/%MSG_NAME%/,msg_name);
        msg_name = $(this).attr('out');
        msg_search = "message[name='"+msg_name+"']";
        var templat = "";
        naga_siren.tstring =  naga_siren.tstring.replace(/%OMSG_ID%/,msg_name);
        if($(data).find(msg_search).children().length>0){
          $(data).find(msg_search).children().each(function(){
              var spacing = 0;
              naga_siren = timbersaw($(this),spacing,naga_siren,tr_yn,cook);
              tr_yn = 0;
          });
        } else {
          naga_siren.tstring = naga_siren.tstring + "<td>&#8709 </td></tr>";
          naga_siren.spanne++;
        }
        naga_siren.tstring = naga_siren.tstring.replace(/%OROWSPAN%/,(naga_siren.spanne-naga_siren.isp));
        naga_siren.tstring = naga_siren.tstring.replace(/%ROWSPAN%/g,naga_siren.spanne);
        naga_siren.tstring = naga_siren.tstring+table_end_temp;
        doc_table.append(naga_siren.tstring);
      });
    }  
  });
  $('#gramma_cont').on("click",function(){
    $(this).toggle();
  });
}

function timbersaw(knoten,spacing,naga_siren,tr_yn,cook){
  var tag_n = knoten.prop('tagName');
  naga_siren.spanne++;
  switch(tag_n) {
    case "parameter":
      naga_siren.tstring=naga_siren.tstring+params(knoten,spacing,tr_yn,naga_siren,cook);
      tr_yn = 0;
      break;
    case "header":
      naga_siren.tstring += header(knoten,spacing,tr_yn,cook);
      tr_yn=0;
      break;
    default:
      var temp = naga_siren.tstring;
      naga_siren=options(knoten,spacing,tr_yn,naga_siren,cook);
      naga_siren.tstring = temp + naga_siren.tstring;
      tr_yn = 0;
      break;
  }
  return naga_siren;
}

function header(knoten,spacing,tr_yn,cook){
  var templat = "";
  if (tr_yn !=1) 
    templat = "<tr>";
  templat += "<td style='white-space:nowrap; padding-left: " + spacing +"ex'>"+
    "<table>" + 
      "<tr><td>Header:</td><td>%H_NAME%</td></tr>" +
      "<tr><td><em>Fixed:</em></td><td>%H_FIXED%</td></tr>" +
    "</table>" +
  "</td></tr>";
  templat = templat.replace(/%H_NAME%/,knoten.attr('name'));
  templat = templat.replace(/%H_FIXED%/,knoten.attr('fixed'));
  return templat;
}

function params(knoten,spacing,tr_yn,naga_siren,cook){
  var templat = "";
  if (tr_yn != 1)
    templat = "<tr>";
  templat += "<td style='padding-left: " + spacing +"ex'>" +
    "<table>" +
      "<tr><td>Parametername:</td><td>%PARAMETERNAME%</td></tr>" +
      "<tr><td>Parameter%MIME%type:</td><td>%PARATYPE%</td></tr>" +
      "<tr><td>Parameterpattern:</td><td>%PATTERN%</td></tr>";
  templat = templat.replace(/%PARAMETERNAME%/,knoten.attr('name'));
  if(typeof knoten.attr('type') == "undefined"){
    templat = templat.replace(/%PARATYPE%/,knoten.attr('mimetype'));
    templat = templat.replace(/%MIME%/,"mime");
  } else {
    templat = templat.replace(/%PARATYPE%/,knoten.attr('type'));
    templat = templat.replace(/%MIME%/,"");
  }
  if(typeof knoten.attr('handler') != "undefined")
    templat += "<tr><td>Handler:</td><td>" + knoten.attr('handler') + "</td></tr>";
  if(knoten.children().length >0) {
    knoten.children().each(function(){
      var knoten_chil = this;
      var tn_name =  $(this).prop('tagName');
      if(this.namespaceURI=="http://cpee.org/ns/documentation"){
        var converter = new Showdown.converter();
        templat += "<tr><td>Dokumentation</td><td>" + converter.makeHtml($(knoten_chil).text()) + "</td></tr>";
      }
      switch(tn_name) {
        case "param":
          templat = templat.replace(/%PATTERN%/,$(knoten_chil).text());
          break;
        case "grammar":
          var location = window.location.href;
          var gc_name= location+cook.zahl;
          cook.zahl++;
          var help = checkGrammarCookie(gc_name);
          templat += "<tr><td rowspan='%GROWSPAN%'>Restriction</td>";
          var gspan = 1;
          templat = grammar_f(knoten,templat,0);
          templat = templat.replace(/%GROWSPAN%/,gspan);
          templat = templat.replace(/%PATTERN%/,"*");
          break;
        default:
          break;
      }
    });
  }
    templat = templat.replace(/%PATTERN%/g,"*");
    templat +=  "</table>" +
      "</td></tr>";
    return templat;
  }
  
  function grammar_f(knoten,templat,spacing){
    knoten.children().each(function(){
      var solo = this;
      if(this.namespaceURI!="http://cpee.org/ns/documentation"){
        templat += 
        "<td>" +
          "<div id='gramma_pa' style='vertical-align: top;'>" +
            "<div id='gramma_butt' style='display: none; vertical-align: top;'>" + 
              "▽&nbsp;" + 
            "</div>" +
            "<div id='gramma_cont' style='display: inline-block;'>" + 
              "<pre>" +
                $(solo).serializePrettyXML() +
              "</pre>"+
            "</div>" +
            "<div id='gramma_bluff' style='display: none;'>" +
              "Click on the arrow" + 
            "</div>" +
          "</div>" +
        "</td>";
      }
    });
    templat+="</tr>";
    return templat;
  }

  function options(knoten,spacing,tr_yn,naga_siren,cook){
    var templat = new Object;
    templat.spanne=naga_siren.spanne;
    templat.isp = naga_siren.isp;
    if(tr_yn!=1){
      templat.tstring = "<tr><td style='white-space:nowrap; padding-left: " + spacing +"ex'><em>%OPTION%</em></td></tr>";
    } else {
      templat.tstring = "<td style='white-space:nowrap; padding-left: " + spacing +"ex'><em>%OPTION%</em></td></tr>";
    }
    spacing = spacing + 2 ;
    templat.tstring = templat.tstring.replace(/%OPTION%/,knoten.prop('tagName'));
    knoten.children().each(function(){
      templat = timbersaw($(this),spacing,templat,tr_yn,cook); 
    });
    return templat;
  }
function setGrammarCookie(gc_name,value){
  document.cookie=gc_name + "=" + value;
}

function checkGrammarCookie(gc_name){
  var anzeigen = getGrammarCookie(gc_name);
  if(anzeigen!=null && anzeigen!="" && anzeigen!="false")
    return 1;
  else 
    return 0;
}
function getGrammarCookie(gc_name){
  var gc_value = document.cookie;
  var gc_start = gc_value.indexOf(" " + gc_name + "=");
  if (gc_start == -1){
    gc_start = gc_value.indexOf(gc_name + "=");
  }
  if (gc_start == -1){
    gc_value = 0;
  } else  {
    gc_start = gc_value.indexOf("=",gc_start)+1;
    var gc_end = gc_value.indexOf(";",gc_start);
    if(gc_end==-1)
      gc_end = gc_value.length;
      gc_value = unescape(gc_value.substring(gc_start,gc_end));
  }
  return gc_value;
}
function changeGrammarCookie(gc_name){
  var temp = checkGrammarCookie(gc_name);
  if(temp == 1) 
    setGrammarCookie(gc_name,"false");
  else
    setGrammarCookie(gc_name,"true");
  window.location.reload();
 }

//]]>  
