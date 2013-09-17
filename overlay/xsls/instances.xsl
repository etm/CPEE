<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
  <xsl:template match="*">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>CPEE - List of Instances</title>
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
        <script src="//sumatra.wst.univie.ac.at/libs/cpee_doc.js" />
        <link rel="stylesheet" href="http://sumatra.wst.univie.ac.at/libs/cpee_doc.css" type="text/css" />
        <script type="text/javascript">
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
              rathalos();
            });
        </script>
      </head>
      <body>
        <div id="brot">
          <nav>
            <a href="/.">Main</a>
          </nav>
        </div>
        <h1>List of Instances</h1>
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

