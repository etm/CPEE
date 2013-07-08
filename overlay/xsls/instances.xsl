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

    function test(status,otable,counter) {
      $.ajax({
          url: status,
          type: 'get',
          dataType: 'html',
          success: function(data) {
            otable.fnUpdate(data, counter, 2 );
          } 
      });
    }



	$(document).ready(function(){
    $('#solo').dataTable({
      "oLanguage": {
        "sSearch": "Filter"
      },
      "bPaginate": false,
      "bInfo": false,
	  	"aaSorting": [[ 1, "desc" ]]
   	} );
    var idd = $("#solo").find('tbody').children();
    var counter = 0;
    idd.each(function() {
      $(this).find('#id').css('color', 'green');
      var tempi = $(this).find('#id').text();
      var otable = $('#solo').dataTable();
      test("./"+tempi+"/properties/values/state",otable,counter);
      counter++;
      });
	} );
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
      </td>
           	 </tr>  
          </xsl:for-each>
        	</tbody>
	</table>

      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

