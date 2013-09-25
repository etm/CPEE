<!DOCTYPE html>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
  <xsl:template match="*">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Further Explore the Notifications</title>
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
        <script src="//sumatra.wst.univie.ac.at/libs/table_methods.js" />
        <script src="//sumatra.wst.univie.ac.at/libs/showdown.js" />
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
            <xsl:element name="a">
              <xsl:attribute name="href"> ../../ </xsl:attribute>
              Main
            </xsl:element>
            &gt;
            <xsl:element name="a">
              <xsl:attribute name="href">../</xsl:attribute>
              Instance                                                                                                                                                        
            </xsl:element>
            &gt;
            <xsl:element name="a">
              <xsl:attribute name="href">./</xsl:attribute>
              Notifications
            </xsl:element>
          </nav>
        </div>
        <h1>Overview Notifications</h1>
        <ul>
          <xsl:for-each select="*">
            <li>
              <xsl:element name="a">
                <xsl:attribute name="href"><xsl:value-of select="name()"/>/</xsl:attribute>
                <xsl:value-of select="name()"/>
              </xsl:element>
            </li>  
          </xsl:for-each>
        </ul>
        <h1>Documentation</h1>
        <div id="test_id"> </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

