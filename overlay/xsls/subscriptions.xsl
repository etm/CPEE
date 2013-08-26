<!DOCTYPE html>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
    <xsl:template match="*">
        <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>List of Subscriptions</title>
            <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
            <script type="text/javascript">
            //<![CDATA[
                function test(uri) {
                  $.ajax({
                    url: uri,
                    type: 'DELETE',
                    error: function(){
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
                      rc_chi.each(function(){
                        var tr_yn=1;
                        var naga_siren = new Object;
                        naga_siren.tstring = "<table border=\"1\"><thead><th>Methode</th><th>Messagename</th><th>I/O</th><th>Parameter</th></thead><tbody><tr><td rowspan=\"%ROWSPAN%\" align=\"center\">%METHODE%</td><td rowspan=\"%ROWSPAN%\" align=\"center\">%MSG_NAME%</td><td rowspan=\"%IROWSPAN%\" align=\"center\">Input</td>";
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
                          naga_siren.tstring = naga_siren.tstring + "<td>- - - </td></tr>"
                          naga_siren.spanne++;
                        }
                        var tr_yn = 1;
                        naga_siren.tstring = naga_siren.tstring + "<tr><td rowspan=\"%OROWSPAN%\" align =\"center\"> Output</td>";
                        naga_siren.isp = naga_siren.spanne;
                        naga_siren.tstring = naga_siren.tstring.replace(/%IROWSPAN%/,naga_siren.isp);
                        naga_siren.tstring = naga_siren.tstring.replace(/%METHODE%/,$(this).prop('tagName'));
                        naga_siren.tstring = naga_siren.tstring.replace(/%MSG_NAME%/,msg_name);

                        msg_name = $(this).attr('out');
                        msg_search = "message[name='"+msg_name+"']";
                        var templat = "";
                        if($(data).find(msg_search).children().length>0){
                          $(data).find(msg_search).children().each(function(){
                              var spacing = 0;
                              naga_siren = timbersaw($(this),spacing,naga_siren,tr_yn);
                              tr_yn = 0;
                          });
                        }
                        else{
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
                function timbersaw(knoten,spacing,naga_siren,tr_yn){
                    var tag_n = knoten.prop('tagName');
                    naga_siren.spanne++;
                    switch(tag_n)
                    {
                      case "parameter":
                      naga_siren.tstring=naga_siren.tstring+params(knoten,spacing,tr_yn);
                      naga_siren.spanne++;
                      naga_siren.spanne++;
                      tr_yn = 0;
                      break;
                      default:
                      var temp = naga_siren.tstring;
                      naga_siren=options(knoten,spacing,tr_yn,naga_siren);
                      naga_siren.tstring = temp + naga_siren.tstring;
                      tr_yn = 0;
                      break;
                    }
                  return naga_siren;

                }
                function params(knoten,spacing,tr_yn){
                var templat = "";
                var placeholder = "";
                for(var i=0;i<spacing;i++) placeholder = placeholder + "-";
                if(tr_yn != 1){
                  templat = "<tr charoff=\""+spacing+"\"><td>"+placeholder+"Parametername: %PARAMETERNAME%</td></tr><tr charoff=\""+spacing+"\"><td>"+placeholder+"Parameter%MIME%type: %PARATYPE%</td></tr><tr charoff=\""+spacing+"\"><td>"+placeholder+"Parameterpattern: %PATTERN%</td></tr>";
                }
                else{
                  templat = "<td>"+placeholder+"Parametername: %PARAMETERNAME%</td></tr><tr charoff=\""+spacing+"\"><td>"+placeholder+"Parameter%MIME%type: %PARATYPE%</td></tr><tr charoff=\""+spacing+"\"><td>"+placeholder+"Parameterpattern: %PATTERN%</td></tr>";
                }
                templat = templat.replace(/%PARAMETERNAME%/,knoten.attr('name'));
                if(typeof knoten.attr('type') == "undefined"){
                  templat = templat.replace(/%PARATYPE%/,knoten.attr('mimetype'));
                  templat = templat.replace(/%MIME%/,"mime");
                }
                else{
                  templat = templat.replace(/%PARATYPE%/,knoten.attr('type'));
                  templat = templat.replace(/%MIME%/,"");
                }
                if(knoten.children().length >0 && knoten.children(':first-child').prop('tagName') == "param"){
                  templat = templat.replace(/%PATTERN%/,knoten.children(':first-child').text());
                }
                else{
                  templat = templat.replace(/%PATTERN%/,"---");
                }
                return templat;
                }
                function options(knoten,spacing,tr_yn,naga_siren){
                  var templat = new Object;
                  templat.spanne=naga_siren.spanne;
                  var placeholder = "";
                  for(var i=0;i<spacing;i++) placeholder = placeholder + "-";

                  if(tr_yn!=1){
                    templat.tstring = "<tr charoff=\""+spacing+"\"><td>"+placeholder+"OPTION: %OPTION%</td></tr>";
                  }
                  else{
                    templat.tstring = "<td>"+placeholder+"OPTION: %OPTION%</td></tr>";
                  }
                  spacing = spacing + 5 ;
                  templat.tstring = templat.tstring.replace(/%OPTION%/,knoten.prop('tagName'));
                  knoten.children().each(function(){
                    templat = timbersaw($(this),spacing,templat); 
                  });
                  return templat;
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
                  Instanz
                </xsl:element>
                &gt;
                <xsl:element name="a">
                  <xsl:attribute name="href">../</xsl:attribute>
                  Notifications
                </xsl:element>
                &gt;
                <xsl:element name="a">
                  <xsl:attribute name="href">.</xsl:attribute>
                  Subscriptions                                                                                                                                                      
                </xsl:element>                                                        
              </nav>
            </div>
            <h1>List of Subscriptions</h1>
            <ul id="ul_id">
              <xsl:for-each select="*">
                <li>
                  <xsl:element name="a">
                    <xsl:attribute name="href">#stay</xsl:attribute>
                    <xsl:attribute name="id">delete_button</xsl:attribute>
                    <xsl:attribute name="value">./<xsl:value-of select="@id"/></xsl:attribute>
                    ☠
                  </xsl:element>
                  <xsl:element name="a">
                    <xsl:attribute name="href"><xsl:value-of select="@id"/>/</xsl:attribute>
                    <xsl:if test="@url">
                      <xsl:value-of select="@url"/>:
                    </xsl:if>  
                    <xsl:value-of select="@id"/>
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

