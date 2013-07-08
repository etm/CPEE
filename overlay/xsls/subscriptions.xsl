<!DOCTYPE html>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
    <xsl:template match="*">
        <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
          <head>
           <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
           <title>List of Subscriptions</title>
             <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js"></script>
             <script type="text/javascript">
              function test(uri) {
                $.ajax({
                  url: uri,
                  type: 'DELETE',
                  dataType: 'html'
                });
              }
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
                  Notifications
                </xsl:element>
                &gt;
                <xsl:element name="a">
                  <xsl:attribute name="href">.</xsl:attribute>
                  Subscriptions                                                                                                                                                      
                </xsl:element>                                                        
              </nav>
            </div>
           <h1>List of Subscriptions</h1>
           <ul>
            <xsl:for-each select="*">
            <li>
              <xsl:element name="a">
               <xsl:attribute name="href"><xsl:value-of select="@id"/>/</xsl:attribute>
               <xsl:if test="@url">
               <xsl:value-of select="@url"/>:
               </xsl:if>  
               <xsl:value-of select="@id"/>
             </xsl:element>
             <xsl:element name="button">
              <xsl:attribute name="type">button</xsl:attribute>
              <xsl:attribute name="onclick">test("./<xsl:value-of select="@id"/>")</xsl:attribute>
              DELETE
            </xsl:element>
            </li>  
            </xsl:for-each>
           </ul>
          </body>
       </html>
    </xsl:template>
  </xsl:stylesheet>

