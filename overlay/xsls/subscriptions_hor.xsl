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
                  var table_temp = "<table border=\"1\"><thead><tr><th colspan=\"2\">Methode</th><th>Message</th><th colspan=\"%COLSPAN%\">Parameter_Infos</th></tr></thead><tbody><tr><td rowspan=\"%ROWSPAN%\">%METHODE%</td><td rowspan=\"%ROWSPANIO%\">IN</td><td rowspan=\"%ROWSPANIO%\">%MSG%</td>";
                  var param_temp = "%OPTION%<td>Parametername: %PARANAME%</td><td>Parameter%MIME%type: %PARATYPE%</td>%PATTERN%";
                  var table_end_temp = "</tbody></table><br />";
                  // Not the most beatiful strings anymore.
                  $.ajax({
                    url: "?riddl-resource-description",
                    dataType: 'xml',
                    success: function(data){
                      var rc = $(data).find('resource');
                      var rc_chi = rc.children();
                      rc_chi.each(function(){
                        var rowspi = 0;
                        var rowspo = 0;
                        var tr_yn = 1;
                        var options_le = 2;
                        var op_max = 2;
                        var msg_name = $(this).attr('in');
                        var msg_search = "message[name='"+msg_name+"']";
                        var method_name = $(this).prop('tagName');
                        var methode_finished = table_temp;
                        $(data).find(msg_search).children().each(function(){
                          var tag_name = $(this).prop('tagName');
                          var tab = "";
                        switch (tag_name)
                        {
                          case "parameter":
                            var temp_arr = params($(this),param_temp,options_le);
                            tab = tab + temp_arr[0];
                            if(temp_arr[1]>op_max) op_max=temp_arr[1];
                            rowspi++;
                            break;
                          default:
                            var temp_arr = options($(this),param_temp,options_le);
                            tab = tab + temp_arr[0];
                            rowspi = rowspi + temp_arr[1];
                            if(temp_arr[2]>op_max) op_max=temp_arr[2];
                          break;
                        }
                        if(tr_yn == 1){
                          tr_yn=0;
                          methode_finished= methode_finished+tab+"</tr>";
                        }
                        else {
                          methode_finished = methode_finished+"<tr>"+tab+"</tr>";
                        }
                      });
                      tr_yn = 1;
                      methode_finished = methode_finished.replace(/%MSG%/,"Message:\n"+msg_name);
                      msg_name = $(this).attr('out');
                      msg_search = "message[name='"+msg_name+"']";
                      if(rowspi==0) rowspi=1;
                      methode_finished = methode_finished.replace(/%ROWSPANIO%/g,rowspi);
                      if(typeof msg_name != "undefined"){
                        methode_finished = methode_finished+"<tr><td rowspan=\"%ROWSPANIO%\">OUT</td><td rowspan=\"%ROWSPANIO%\">%MSG%</td>";       
                        $(data).find(msg_search).children().each(function(){
                          var tag_name = $(this).prop('tagName');
                          var tab = "";
                          switch (tag_name)
                          {
                            case "parameter":
                              var temp_arr = params($(this),param_temp,options_le);
                              tab = tab + temp_arr[0];
                              if(temp_arr[1]>op_max) op_max=temp_arr[1];
                              rowspo++;
                              break;
                            default:
                              temp_arr = options($(this),param_temp,options_le);
                              tab = tab + temp_arr[0];
                              rowspo = rowspo + temp_arr[1];
                              if(temp_arr[2]>op_max) op_max = temp_arr[2];
                            break;
                          }
                          if(tr_yn == 1){
                            tr_yn=0;
                            methode_finished= methode_finished+tab+"</tr>";
                          }
                          else {
                            methode_finished = methode_finished+"<tr>"+tab+"</tr>";
                          }
                        });
                      }
                      var rowsp = rowspi+rowspo;
                      methode_finished = methode_finished.replace(/%ROWSPANIO%/g,rowspo);
                      methode_finished = methode_finished.replace(/%MSG%/,"Message:\n "+msg_name);
                      methode_finished = methode_finished.replace(/%METHODE%/,method_name);
                      methode_finished = methode_finished+table_end_temp+"<br />";
                      methode_finished = methode_finished.replace(/%ROWSPAN%/g,rowsp);
                      methode_finished = methode_finished.replace(/%OPTION%/g,"");
                      methode_finished = methode_finished.replace(/%COLSPAN%/,op_max);
                      doc_table.append(methode_finished);
                    });
                  }
                });
              });

              function params(para_node,param_temp,options_le){
                
                var temp = new Array(); 
                temp[0] = param_temp;
                temp[1] = options_le;
                temp[0] = temp[0].replace(/%PARANAME%/,para_node.attr('name'));
                if(typeof para_node.attr('type') == "undefined"){
                  temp[0] = temp[0].replace(/%PARATYPE%/,para_node.attr('mimetype'));
                  temp[0] = temp[0].replace(/%MIME%/,"mime");
                }
                else{
                  temp[0] = temp[0].replace(/%PARATYPE%/,para_node.attr('type'));
                  temp[0] = temp[0].replace(/%MIME%/,"");
                }
                para_node.children().each(function(){
                  if($(this).prop('tagName') == "param"){
                    temp[0] = temp[0].replace(/%PATTERN%/,"<td>Pattern: "+$(this).text()+"</td>");
                    temp[1]++;
                  }
                });
                temp[0] = temp[0].replace(/%PATTERN%/,"");
                return temp;
              }

              function options(opt_node,param_temp,options_le){
                options_le++;
                var temp =new Array();
                temp[0] = "";
                temp[1] = 0;
                temp[2] = options_le;
                var tr_yn = 0;
                opt_node.children().each(function(){
                  var tag_name = $(this).prop('tagName');
                  switch (tag_name)
                  {
                    case "parameter":
                      var temp_arr = params($(this),param_temp,options_le);
                      if(tr_yn==0) {
                        tr_yn=1;
                        temp[0] = temp[0]+temp_arr[0];
                        temp[0] = temp[0].replace(/%OPTION%/,"<td rowspan=\"%ROWSPAN%\">Option: "+opt_node.prop('tagName')+"</td>");
                      }
                      else{
                        temp[0] = temp[0]+"<tr>"+temp_arr[0]+"</tr>";
                        temp[0] = temp[0].replace(/%OPTION%/,"");
                        }
                      if(temp_arr[1]>temp[2]) temp[2]=temp_arr[1];
                      temp[1]++;
                      break;
                    default:
                      var temp_arr = options($(this),param_temp,options_le);
                      if(tr_yn==0){
                        tr_yn=1;
                        temp[0] = temp[0] + temp_arr[0];
                      }
                      else{
                        temp[0] = temp[0]+"<tr>"+temp_arr[0]+"</tr>";
                      }
                      if(temp_arr[2]>temp[2]) temp[2]=temp_arr[2];
                      temp[1]= temp[1]+temp_arr[1];
                      break;
                  }
                });
                temp[0]=temp[0].replace(/%ROWSPAN%/,temp[1]);
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

