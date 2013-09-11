<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
  <xsl:template match="*">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Values</title>
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
		    <script type="text/javascript">
        //<![CDATA[
	        $(document).ready(function(){
            var doc_table = $('#test_id');
            var table_temp = "<table border=\"1\"><thead><tr><th colspan=\"2\">Methode</th><th>Message_Name</th><th>Parameter_Name</th><th>Parameter_Type</th></tr></thead><tbody>";
            var input_param_temp = "<tr><td rowspan=\"%ROWSPAN%\">%METHODE%</td><td rowspan=\"%ROWSPAN%\">InputParameter</td><td rowspan=\"%ROWSPAN%\">%MSGNAME%</td><td>%PARANAME%</td><td>%PARATYPE%</td></tr>";
            var input_temp_short = "<tr><td>%PARANAME%</td><td>%PARATYPE%</td></tr>";
            var output_param_temp = "<tr><td>OutputParameter</td><td>%MSGNAME%</td><td>%PARANAME%</td><td>%PARATYPE%</td>";     
            var table_end_temp = "</tbody></table><br />";
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
                  var msg_chil = msg_node.children(":first-child");
                  var msg_name = msg_chil.prop('tagName');
                  var mime_or_no_mime = "type";
                  if(typeof msg_chil.prop('tagName') == "string" && msg_name.indexOf('oneOrMore')>=0) {
                      //  oneormoretable();
                    var int_rowspan = 0;
                    var table_head = table_temp.replace(/>Parameter_Name/," colspan=\"2\" >Parameter_Options</th><th>Parameter_Name");
                    var in_temp1= input_param_temp.replace(/>%PARANAME%/," rowspan=\"%ROWSPAN%\">"+msg_name+"</td><td>-</td><td>"+msg_chil.children('parameter').attr('name'));
                    int_rowspan++;
                    var in_temp_choice ="";
                    var chil_counter = 1;
                    msg_chil.children('Choice').children().each(function(){
                      if(typeof $(this).attr('type') == "undefined") { 
                        mime_or_no_mime = "mimetype";
                      }
                      else{
                        mime_or_no_mime = "type";
                      }
                      if(chil_counter == 1){
                        var in_temp2= input_temp_short.replace(/>%PARANAME%/," rowspan=\"%ROWSPAN_CHOICE%\" >Choice</td><td>"+$(this).attr('name'));
                        chil_counter++;  
                      }
                      else{
                        var in_temp2=input_temp_short.replace(/%PARANAME%/,$(this).attr('name'));
                      }
                      in_temp2=in_temp2.replace(/%PARATYPE%/,$(this).attr(mime_or_no_mime));
                      int_rowspan++;
                      in_temp_choice = in_temp_choice+in_temp2;
                      });
                    in_temp_choice = in_temp_choice.replace(/%ROWSPAN_CHOICE%/,msg_chil.children('Choice').children().length);
                    in_temp1= in_temp1.replace(/%METHODE%/,vop);
                    in_temp1= in_temp1.replace(/%MSGNAME%/,vin);
                    in_temp1= in_temp1.replace(/%ROWSPAN%/g,int_rowspan);
                    in_temp1= in_temp1.replace(/%PARATYPE%/,msg_chil.children('parameter').attr('type'));
                    var temp = table_head+in_temp1+in_temp_choice+table_end_temp;
                  }
                  else{ 
                    var omsg_str = "message[name='"+vout+"']";
                    var omsg_node = $(data).find(omsg_str);
                    var omsg_chil = omsg_node.children(":first-child");
                    var in_temp = input_param_temp.replace(/%MSGNAME%/,vin);
                    in_temp = in_temp.replace(/%PARANAME%/,msg_chil.attr('name'));
                    in_temp = in_temp.replace(/%PARATYPE%/,msg_chil.attr('type'));
                    var out_temp = output_param_temp.replace(/%MSGNAME%/,vout);
                    if(typeof omsg_chil.attr('type') == "undefined"){
                      mime_or_no_mime = "mimetype";
                    }
                    out_temp = out_temp.replace(/%PARANAME%/,omsg_chil.attr('name'));
                    out_temp = out_temp.replace(/%PARATYPE%/,omsg_chil.attr(mime_or_no_mime));
                    in_temp = in_temp.replace(/%METHODE%/,vop);
                    in_temp = in_temp.replace(/%ROWSPAN%/,"1");
                    if(!(typeof vout == "undefined")){
                      table_temp = table_temp.replace(/%ROWSPAN%/,3);
                      temp = table_temp+in_temp+out_temp+table_end_temp;
                    }
                    else{
                      table_temp = table_temp.replace(/%ROWSPAN%/,2);
                      temp = table_temp+in_temp+table_end_temp;
                    }
                  }
                  doc_table.append(temp);
                });
              }
            });
          });
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
            Properties
          </xsl:element>  
          &gt;
          <xsl:element name="a">
            <xsl:attribute name="href">.</xsl:attribute>
            Values
          </xsl:element>   
          </nav>
        </div>
        <h1>Pikachu</h1>
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

