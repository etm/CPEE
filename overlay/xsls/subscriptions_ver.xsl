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
                  var naga_siren = new Object;
                  naga_siren.illus = new Array();
                  var table_temp = "<table border=\"1\"><thead><tr><th colspan=\"2\">Methode</th><th>Message</th><th colspan=\"%COLSPAN%\">Parameter_Infos</th></tr></thead><tbody><tr><td rowspan=\"%ROWSPAN%\">%METHODE%</td><td rowspan=\"%ROWSPANIO%\">IN</td><td rowspan=\"%ROWSPANIO%\">%MSG%</td>";
                  var table_end_temp = "</tbody></table><br />";
                  naga_siren.tab = "<table border=\"1\"><thead></thead><tbody>";
                  // Not the most beatiful strings anymore.
                  $.ajax({
                    url: "?riddl-resource-description",
                    dataType: 'xml',
                    success: function(data){
                      var rc = $(data).find('resource');
                      var tr_yn=1;
                      var rc_chi = rc.children();
                      rc_chi.each(function(){
                        var tr_yn=1;
                        var msg_name = $(this).attr('in');
                        var msg_search = "message[name='"+msg_name+"']";
                        var method_name = $(this).prop('tagName');
                        naga_siren.illus = new Array();
                        $(data).find(msg_search).children().each(function(){
                          var illu = new Object;
                          illu.nod = $(this);
                          illu.place = 0;
                          naga_siren.illus.push(illu);
                          });
                        console.log(naga_siren.illus.length);
                        while(naga_siren.illus.length>0){
                          timbersaw(naga_siren,tr_yn);
                        }
                      });
                    naga_siren.tab = naga_siren.tab + table_end_temp;
                    console.log(naga_siren.tab);
                    doc_table.append(naga_siren.tab);
                    }
                  });
                });
              function timbersaw(naga_siren,tr_yn){
                var temp;
                var opc = 0;
                var arr = naga_siren.illus;
                var new_childs = 1;
                var illu_arr = new Array();
                if(tr_yn==100){
                  tr_yn = 0;
                }
                else{
                  var temp = "<tr>";
                  arr.forEach(function(entry){  
                    var tag_name = entry.nod.prop('tagName');
                    var zusatz = "";
                    switch (tag_name)
                    {
                      case "parameter":
                        zusatz=params(entry,tr_yn);
                        opc = 1 + entry.place;
                        break;
                        default:
                        zusatz=options(entry,tr_yn);
                        var temp_place = entry.place;
                         entry.nod.children().each(function(){
                            var temp_obj = new Object;
                              temp_obj.nod = $(this);
                              temp_obj.place = temp_place + opc;
                              opc =  0;
                              illu_arr.push(temp_obj);
                        });   
                        break;
                    }
                    temp=temp+zusatz;
                  });
                }
                  temp=temp+"</tr>";
              //    console.log(temp);
                  naga_siren.illus = illu_arr;
                  naga_siren.tab = naga_siren.tab + temp;
              }
              function params(illusion,tr_yn){
                var empty_tds = ""
                for(var i=0;i<illusion.place;i++) empty_tds = empty_tds + "<td></td>";
                var param_temp = empty_tds + "%OPTION%<td>Parametername: %PARANAME%\nParameter%MIME%type: %PARATYPE%\nPattern: %PATTERN%</td>";
                var temp= param_temp;
                temp = temp.replace(/%OPTION%/,"");
                temp = temp.replace(/%PARANAME%/,illusion.nod.attr('name'));
                if(typeof illusion.nod.attr('type') == "undefined"){
                  temp = temp.replace(/%MIME%/,"mime");
                  temp = temp.replace(/%PARATYPE%/, illusion.nod.attr('mimetype'));

                }
                else{
                  temp = temp.replace(/%PARATYPE%/,illusion.nod.attr('type'));
                  temp = temp.replace(/%MIME%/,"");
                }
                if(illusion.nod.children().length >0){
                  illusion.nod.children().each(function(){
                    if($(this).prop('tagName')=="param"){
                      temp = temp.replace(/%PATTERN%/,$(this).text());
                    }
                    else{
                      temp = temp.replace(/%PATTERN%/,"---");
                    }         
                  });
                }
                else 
                  temp = temp.replace(/%PATTERN%/,"---");
                return temp;
              }
              function options(illusion,tr_yn){
                var empty_tds = ""
                for(var i=0;i<illusion.place;i++) empty_tds = empty_tds + "<td></td>";
                var option_temp = empty_tds + "<td colspan=\"1\">%OPTION%</td>";
                var temp = option_temp;
                temp = temp.replace(/%OPTION%/,illusion.nod.prop('tagName'));
                return temp;
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

