<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
  <xsl:template match="*">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>CPEE - List of Instances</title>
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js"></script>   
        <script class="jsbin" src="http://datatables.net/download/build/jquery.dataTables.nightly.js"></script>
		<script type="text/javascript">
    function counterforrealz(counter,timout,urli,otable,state_node){
    setTimeout(function(){test(urli,otable,counter,state_node);},timout);


    }
    function test(status,otable,counter,state_node) {
      console.log(state_node.text());
       $.ajax({
          url: status,
          type: 'get',
          dataType: 'html',
          success: function(data) {
            state_node.html(data);
            if(data!="finished"){
              setTimeout(function(){test(status,otable,counter,state_node);},30000);
             }
          } 
      });
      otable.fnDraw();
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
    });
  function running_sushi(otable){
    var idd = $("#solo").find('tbody').children();
    var counter = 0;
    idd.each(function() {
      $(this).find('#id').css('color', 'green');
      var state_node = $(this).children('#state');
      var status = state_node.text();
      var tempi = $(this).children('#id').text();
      var urli = "./"+tempi+"/properties/values/state";        
      if (status!="finished"){
        counterforrealz(counter,30000,urli,otable,state_node);
      }
      counter++;
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
              	<tr>
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
           	 </tr>  
          </xsl:for-each>
        	</tbody>
	</table>

      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

