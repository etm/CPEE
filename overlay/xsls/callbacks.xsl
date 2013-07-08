<!DOCTYPE html>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
  <xsl:template match="*">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
      <head>
         <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
         <title>List of Callbacks</title>
      </head>
      <body>
        <div id="brot">
          <nav> 
            <xsl:element name="a">
              <xsl:attribute name="href">../../</xsl:attribute>
              Main
            </xsl:element>
            &gt;
            <xsl:element name="a">
              <xsl:attribute name="href">../</xsl:attribute>
              Instanz
            </xsl:element>
            &gt;
            <xsl:element name="a">
              <xsl:attribute name="href">.</xsl:attribute>
              Callbacks
            </xsl:element>                                                        
          </nav>
        </div>
 
        <h1>List of Callbacks</h1>
        <ul>
          <xsl:for-each select="callback">
            <li>
              <xsl:element name="a">
                <xsl:attribute name="href"><xsl:value-of select="@id"/>/</xsl:attribute>
                <xsl:value-of select="text()"/>
              </xsl:element>
            </li>  
          </xsl:for-each>
        </ul>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

