<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
  <xsl:template match="*">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Values</title>
            <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
            <style type="text/css">
              table.operation {
                border-style: outset; 
                border-width: 1px; 
                border-spacing: 2px; 
                width:100%;
              }
              table.operation table {
                margin:0px; 
                border: 0 none;
                padding: 0; 
                border-collapse:collapse; 
              }
              table.operation table td {
                margin:0px; 
                border: 0 none;
                padding: 0; 
              }
              table.operation table td:first-child {
                padding-right: 1em; 
              }
              table.operation td {
                border-style: outset; 
                border-width: 1px; 
                border-spacing: 2px; 
              }
              table.operation td.name {
                width: 18ex;
              }
            </style>
            <script type="text/javascript">
            //<![CDATA[
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
                $(document).ready(function(){
                  var chi = $("#ul_id").children();
                  chi.each(function(){
                    $(this).children('#delete_button').click(function(){
                      test($(this).attr('value'));
                    });
                  });

                // HERE TABLE
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
                      cook.zahl = 0;
                      rc_chi.each(function(){
                        var tr_yn=1;
                        var naga_siren = new Object;
                        naga_siren.tstring = "<table class='operation'><tbody><tr><td class='name'>Method</td><td><strong>%METHOD%</strong></td></tr><tr><td class='name'>Message-ID</td><td><strong>%MSG_NAME%</strong></td></tr><tr><td rowspan=\"%IROWSPAN%\" class='name'>Inputparameter(s)</td>";
                        naga_siren.spanne = 0;
                        var msg_name = $(this).attr('in');
                        var msg_search = "message[name='"+msg_name+"']";
                        var method_name = $(this).prop('tagName');
                        var templat = "";
                        if($(data).find(msg_search).children().length >0){
                          $(data).find(msg_search).children().each(function(){
                              var spacing = 0;
                              naga_siren = timbersaw($(this),spacing,naga_siren,tr_yn);
                              tr_yn = 0;
                          });
                        }
                        else{
                          naga_siren.tstring = naga_siren.tstring + "<td>*</td></tr>"
                          naga_siren.spanne++;
                        }
                        var tr_yn = 1;
                        naga_siren.tstring = naga_siren.tstring + "<tr><td rowspan=\"%OROWSPAN%\" class='name'> Output</td>";
                        naga_siren.isp = naga_siren.spanne;
                        naga_siren.tstring = naga_siren.tstring.replace(/%IROWSPAN%/,naga_siren.isp);
                        naga_siren.tstring = naga_siren.tstring.replace(/%METHOD%/,$(this).prop('tagName'));
                        naga_siren.tstring = naga_siren.tstring.replace(/%MSG_NAME%/,msg_name);

                        msg_name = $(this).attr('out');
                        msg_search = "message[name='"+msg_name+"']";
                        var templat = "";
                        if($(data).find(msg_search).children().length>0){
                          $(data).find(msg_search).children().each(function(){
                              var spacing = 0;
                              naga_siren = timbersaw($(this),spacing,naga_siren,tr_yn,cook);
                              tr_yn = 0;
                          });
                        } else {
                          naga_siren.tstring = naga_siren.tstring + "<td> - - - </td></tr>";
                          naga_siren.spanne++;
                        }

                        naga_siren.tstring = naga_siren.tstring.replace(/%OROWSPAN%/,(naga_siren.spanne-naga_siren.isp));
                        naga_siren.tstring = naga_siren.tstring.replace(/%ROWSPAN%/g,naga_siren.spanne);

                        naga_siren.tstring = naga_siren.tstring+table_end_temp;
                        doc_table.append(naga_siren.tstring);
                      });
                    }  
                  });
                });
                function timbersaw(knoten,spacing,naga_siren,tr_yn,cook){
                  var tag_n = knoten.prop('tagName');
                  naga_siren.spanne++;
                  switch(tag_n) {
                    case "parameter":
                      naga_siren.tstring=naga_siren.tstring+params(knoten,spacing,tr_yn,cook);
                      tr_yn = 0;
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
                function params(knoten,spacing,tr_yn,cook){
                  var templat = "";

                  if (tr_yn != 1)
                    templat = "<tr>";
                  templat += "<td style='padding-left: " + spacing +"ex'>" +
                    "<table>" +
                      "<tr><td>Parametername:</td><td>%PARAMETERNAME%</td></tr>" +
                      "<tr><td>Parameter%MIME%type:</td><td>%PARATYPE%</td></tr>" +
                      "<tr><td>Parameterpattern:</td><td>%PATTERN%</td></tr>" +
                    "</table>" +
                  "</td></tr>";
                  templat = templat.replace(/%PARAMETERNAME%/,knoten.attr('name'));
                  if(typeof knoten.attr('type') == "undefined"){
                    templat = templat.replace(/%PARATYPE%/,knoten.attr('mimetype'));
                    templat = templat.replace(/%MIME%/,"mime");
                  } else {
                    templat = templat.replace(/%PARATYPE%/,knoten.attr('type'));
                    templat = templat.replace(/%MIME%/,"");
                  }
                  if(knoten.children().length >0) {
                    if(knoten.children(':first-child').prop('tagName') == "param"){
                    templat = templat.replace(/%PATTERN%/,knoten.children(':first-child').text());
                    } else {
                      var gc_name= "gram_cook"+cook.zahl;
                      cook.zahl++;
                      var help = checkGrammarCookie(gc_name);
                      templat += "<tr><td>Grammar</td><td>";
                      if(help == 1)
                        templat+=knoten.children(':first-child').html()+"&nbsp;&nbsp;|&nbsp;&nbsp;";
                      templat+="<a onClick=\"changeGrammarCookie('"+gc_name+"')\">&#931;</a>";
                      templat+="</td></tr>";
                      templat = templat.replace(/%PATTERN%/,"*");
                    }
                  }
                  else {
                    templat = templat.replace(/%PATTERN%/,"*");
                  }
                  return templat;
                }
                function options(knoten,spacing,tr_yn,naga_siren,cook){
                  var templat = new Object;
                  templat.spanne=naga_siren.spanne;
                  if(tr_yn!=1){
                    templat.tstring = "<tr><td style='white-space:nowrap; padding-left: " + spacing +"ex'><em>%OPTION%</em></td></tr>";
                  } else {
                    templat.tstring = "<td style='white-space:nowrap; padding-left: " + spacing +"ex'><em>%OPTION%</em></td></tr>";
                  }
                  spacing = spacing + 2 ;
                  templat.tstring = templat.tstring.replace(/%OPTION%/,knoten.prop('tagName'));
                  knoten.children().each(function(){
                    templat = timbersaw($(this),spacing,templat); 
                  });
                  return templat;
                }
                function setGrammarCookie(gc_name,value){
  //                console.log("\nSETTING: " + gc_name + " VALUE: " + value);
                  document.cookie=gc_name + "=" + value;
                }
                
                function checkGrammarCookie(gc_name){
   //               console.log("\nCHECKING: " + gc_name);
                  var anzeigen = getGrammarCookie(gc_name);
                  if(anzeigen!=null && anzeigen!="")
                    return 1;
                  else 
                    return 0;
                }
                function getGrammarCookie(gc_name){
 //                 console.log("\nGETTING: " + gc_name);
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
         //         console.log("\nCHANGING: " + gc_name);
                  var temp = checkGrammarCookie(gc_name);
                  if(temp == 1) 
                    setGrammarCookie(gc_name,"");
                  else
                    setGrammarCookie(gc_name,"true");
                  window.location.reload();
                 }
            //]]>  
            </script>
      </head>
      <body>
        <div id="brot">
          <nav>
          <xsl:element name="a">
            <xsl:attribute name="href">../../../</xsl:attribute>
            Main
          </xsl:element>
          &gt;
          <xsl:element name="a">
            <xsl:attribute name="href">../../</xsl:attribute>
            Instance
          </xsl:element>
          &gt;
          <xsl:element name="a">
            <xsl:attribute name="href">../</xsl:attribute>
            Properties
          </xsl:element>  
          &gt;
          <xsl:element name="a">
            <xsl:attribute name="href">.</xsl:attribute>
            Values
          </xsl:element>   
          </nav>
        </div>
        <h1>List of Properties</h1>
        <ul>
            <xsl:for-each select="*">
            <li>
              <xsl:element name="a">
                <xsl:attribute name="href"><xsl:value-of select="text()"/>/</xsl:attribute>
                <xsl:value-of select="text()"/>
              </xsl:element>
            </li>   
            </xsl:for-each>
        </ul>
        <h1> Documentation</h1>
        <div id="test_id"> </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

