<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
  <xsl:template match="*">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
      <head>
         <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
         <script src="http://code.jquery.com/jquery-1.9.1.js"></script>
         <script src="http://code.jquery.com/ui/1.10.3/jquery-ui.js"></script>
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
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

