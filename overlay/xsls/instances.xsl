<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
  <xsl:template match="*">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>CPEE - List of Instances</title>
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
        <script class="jsbin" src="http://datatables.net/download/build/jquery.dataTables.nightly.js"></script>
        <script src="//sumatra.wst.univie.ac.at/libs/showdown.js"></script>
        <script src="//sumatra.wst.univie.ac.at/libs/table_methods.js"></script>
        <script src="//sumatra.wst.univie.ac.at/libs/docu.js"></script>
        <link rel="stylesheet" href="http://sumatra.wst.univie.ac.at/libs/cpee_doc.css" type="text/css" />
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
            rathalos();
            rathian();
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
        <div id="resource_doc">
	      </div>
        <table id="solo">
	        <thead>
		        <tr>
		          <th>Info</th>
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
        <script type="text/javascript">
          $(document).ready(function(){

            console.log($('#gramma_pa'));

          });
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

