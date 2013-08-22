<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
  <xsl:template match="*">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>CPEE - List of Instances</title>
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
        <script class="jsbin" src="http://datatables.net/download/build/jquery.dataTables.nightly.js"></script>
		    <script type="text/javascript">
          function counterforrealz(timout,urli,otable,state_node,trid){
            setTimeout(function(){test(urli,otable,state_node,trid);},timout);
          }
          function test(status,otable,state_node,trid) {
            console.log(state_node.text());
            $.ajax({
              url: status,
              type: 'get',
              dataType: 'html',
              success: function(data) {
                state_node.html(data);
                if(data!="finished"){
                  setTimeout(function(){test(status,otable,state_node);},30000);
                }
                otable.fnDraw(true);  
              } 
            });
          }
	        $(document).ready(function(){
            var otable = $('#solo').dataTable({
              "oLanguage": {
                "sSearch": "Filter"
              },
              "bPaginate": false,
              "bInfo": false,
	  	        "aaSorting": [[ 1, "desc" ]]
   	        } );
            running_sushi(otable);
            var doc_table = $('#test_id');
            var rawr = "&lt;tr&gt;&lt;td&gt;%OP%&lt;/td&gt;&lt;td&gt;%IN%&lt;/td&gt;&lt;td&gt;%OUT%&lt;/td&gt;&lt;/tr&gt;";
            var table_template = "&lt;table border=\"1\"&gt;&lt;thead&gt;&lt;tr&gt;&lt;th&gt;OPERATION&lt;/th&gt;&lt;th&gt;%METHODE%&lt;/th&gt;&lt;th&gt;Message_Name&lt;/th&gt;&lt;th&gt;Parameter_Name&lt;/th&gt;&lt;th&gt;Parameter_Type&lt;/th&gt;&lt;/tr&gt;&lt;/thead&gt;&lt;tbody&gt;";
            var input_param_temp = "&lt;tr&gt;&lt;td&gt;InputParameter&lt;/td&gt;&lt;td&gt;&lt;/td&gt;&lt;td&gt;%MSGNAME%&lt;/td&gt;&lt;td&gt;%PARANAME%&lt;/td&gt;&lt;td&gt;%PARATYPE%&lt;/td&gt;";
            var output_param_temp = "&lt;tr&gt;&lt;td&gt;OutputParameter&lt;/td&gt;&lt;td&gt;&lt;/td&gt;&lt;td&gt;%MSGNAME%&lt;/td&gt;&lt;td&gt;%PARANAME%&lt;/td&gt;&lt;td&gt;%PARATYPE%&lt;/td&gt;";     
            var table_end_temp = "&lt;/tbody&gt;&lt;/table&gt;&lt;br /&gt;";
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
                  var omsg_str = "message[name='"+vout+"']";
                  var omsg_node = $(data).find(omsg_str);
                  var omsg_chil = omsg_node.children(":first-child");
                  var in_temp = input_param_temp.replace(/%MSGNAME%/,vin);
                  in_temp = in_temp.replace(/%PARANAME%/,msg_chil.attr('name'));
                  in_temp = in_temp.replace(/%PARATYPE%/,msg_chil.attr('type'));
                  var out_temp = output_param_temp.replace(/%MSGNAME%/,vout);
                  var mime_or_no_mime = "type";
                  if(typeof omsg_chil.attr('type') == "undefined"){
                    mime_or_no_mime = "mimetype";
                  }
                  console.log(mime_or_no_mime);
                  out_temp = out_temp.replace(/%PARANAME%/,omsg_chil.attr('name'));
                  out_temp = out_temp.replace(/%PARATYPE%/,omsg_chil.attr(mime_or_no_mime));
                  var table_temp = table_template.replace(/%METHODE%/,vop);
         //         var temp = rawr.replace(/%OP%/,vop);
           //       temp = temp.replace(/%IN%/,vin);
             //     temp = temp.replace(/%OUT%/,vout);
                  temp = table_temp+in_temp+out_temp+table_end_temp;
                  doc_table.append(temp);
                });
              }
            });



          });
          function running_sushi(otable){
            var idd = $("#solo").find('tbody').children();
            idd.each(function() {
              $(this).find('#id').css('color', 'green');
              var state_node = $(this).children('#state');
              var status = state_node.text();
              var tempi = $(this).children('#id').text();
              var urli = "./"+tempi+"/properties/values/state";        
              if (status!="finished"){
                counterforrealz(30000,urli,otable,state_node,tempi);
              }
            });
          }
        </script>
      </head>
      <body>
        <div id="brot">
          <nav>
            <a href="/.">Main</a>
          </nav>
        </div>
        <h1>Pikachu</h1>
	      <table id="solo">
	        <thead>
		        <tr>
		          <th>Name</th>
			        <th>ID</th>
              <th>State</th>
		        </tr>
	        </thead>
		      <tbody>
            <xsl:for-each select="instance">
              <xsl:element name="tr">
                <xsl:attribute name="id"><xsl:value-of select="@id"/></xsl:attribute>
			          <td>
                  <xsl:element name="a">
                    <xsl:attribute name="href"><xsl:value-of select="@id"/>/</xsl:attribute>
                    <xsl:value-of select="text()"/>
                  </xsl:element>
			          </td>
			          <td id="id">
		              <xsl:value-of select="@id"/>
			          </td>
                <td id="state">
                  <xsl:value-of select="@state"/>
                </td>
              </xsl:element>  
            </xsl:for-each>
          </tbody>
	      </table>
        <h1> Documentation</h1>
        <div id="test_id"> </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

