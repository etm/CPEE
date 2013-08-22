<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
  <xsl:template match="*">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
        <script type="text/javascript">
          $(document).ready(function(){
            var doc_table = $('#test_id');                                                                                                                                       
            var input_param_temp = "&lt;tr&gt;&lt;td&gt;InputParameter&lt;/td&gt;&lt;td&gt;&lt;/td&gt;&lt;td&gt;%MSGNAME%&lt;/td&gt;&lt;td&gt;%PARANAME%&lt;/td&gt;&lt;td&gt;%PARATYPE%&lt;/td&gt;";
            var table_template = "&lt;table border=\"1\"&gt;&lt;thead&gt;&lt;tr&gt;&lt;th&gt;OPERATION&lt;/th&gt;&lt;th rowspan=\"%ROWSPAN%\"&gt;%METHODE%&lt;/th&gt;&lt;th&gt;Message_Name&lt;/th&gt;&lt;th&gt;Parameter_Name&lt;/th&gt;&lt;th&gt;Parameter_Type&lt;/th&gt;&lt;/tr&gt;&lt;/thead&gt;&lt;tbody&gt;";
            var table_end_temp = "&lt;/tbody&gt;&lt;/table&gt;&lt;br /&gt;";
            var output_param_temp = "&lt;tr&gt;&lt;td&gt;OutputParameter&lt;/td&gt;&lt;td&gt;&lt;/td&gt;&lt;td&gt;%MSGNAME%&lt;/td&gt;&lt;td&gt;%PARANAME%&lt;/td&gt;&lt;td&gt;%PARATYPE%&lt;/td&gt;";     
            // Most beatiful strings ever.
            $.ajax({
              url: "?riddl-resource-description",
              dataType: 'xml',
              success: function(data){
                var rc = $(data).find('resource');
                var rc_chi = rc.children();
                rc_chi.each(function(){
                  var vop = $(this).context.tagName;
                  var vout = $(this).attr('out');
                  var vin = $(this).attr('in');
                  var imsg_str = "message[name='"+vin+"']";
                  var msg_node = $(data).find(imsg_str);
                  if(!(msg_node.children().length > 2))
                  {
                    var msg_chil = msg_node.children(":first-child");
                    var omsg_str = "message[name='"+vout+"']";
                    var omsg_node = $(data).find(omsg_str);
                    var omsg_chil = omsg_node.children(":first-child");
                    var in_temp = input_param_temp.replace(/%MSGNAME%/,vin);
                    in_temp = in_temp.replace(/%PARANAME%/,msg_chil.attr('name'));
                    var mime_or_no_mime_i = "type";
                    if(typeof msg_chil.attr('type') == "undefined"){
                      mime_or_no_mime_i = "mimetype";                                                                                                                           
                    }
                    in_temp = in_temp.replace(/%PARATYPE%/,msg_chil.attr(mime_or_no_mime_i));
                    var out_temp = output_param_temp.replace(/%MSGNAME%/,vout);
                    var mime_or_no_mime_o = "type";
                    if(typeof omsg_chil.attr('type') == "undefined"){
                      mime_or_no_mime_o = "mimetype";
                    }
                    out_temp = out_temp.replace(/%PARANAME%/,omsg_chil.attr('name'));
                    out_temp = out_temp.replace(/%PARATYPE%/,omsg_chil.attr(mime_or_no_mime_o));
                    var table_temp = table_template.replace(/%METHODE%/,vop);
                    if(!(typeof vout == "undefined")){
                      table_temp = table_temp.replace(/%ROWSPAN%/,3);
                      temp = table_temp+in_temp+out_temp+table_end_temp;
                    }
                    else{
                      table_temp = table_temp.replace(/%ROWSPAN%/,2);
                      temp = table_temp+in_temp+table_end_temp;
                    }
                    doc_table.append(temp);
                  }
                });
              }
            });
          });
        </script>
        <title>Further Explore this Instance</title>
     </head>
      <body>
      <div id="brot">
        <nav>
          <xsl:element name="a">
            <xsl:attribute name="href">../</xsl:attribute>
            Main
          </xsl:element>
          &gt;
          <xsl:element name="a">
            <xsl:attribute name="href">./</xsl:attribute>
            Instanz
          </xsl:element>                                                                    
        </nav>
      </div>
        <h1>Uebersicht</h1>
        <ul>
          <xsl:for-each select="*">
            <li>
              <xsl:element name="a">
                <xsl:attribute name="href">/<xsl:value-of select="../@instance"/>/<xsl:value-of select="name()"/>/</xsl:attribute>
                <xsl:value-of select="name()"/>
              </xsl:element>
              <xsl:variable name="first" select="name()"/>
              <div id="descr">
                <xsl:if test="contains($first, 'properties')">
                  Eigenschaft. 
                </xsl:if>
                <xsl:if test="contains($first, 'noti')">
                  Subscriptions von Entitaeten um Aenderungen zu erfahren
                </xsl:if>
                <xsl:if test="contains($first, 'callb')">
                  URIs fuer Async-Methoden (z.B. Post,Puts,Delete) welche aufgeruft werden wenn fertig welche von den Methoden aufgerufen wird, wenn diese abgeschlossen sind.
                </xsl:if>
              </div>
            </li>  
          </xsl:for-each>
        </ul>
        <h1> DOCU</h1>
        <div id="test_id"> </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

