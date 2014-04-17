<!DOCTYPE html>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
    <xsl:template match="*">
        <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>List of Subscriptions</title>
            <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
            <script src="//sumatra.wst.univie.ac.at/libs/showdown.js" />
            <script src="//sumatra.wst.univie.ac.at/libs/table_methods.js" />
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
                  <xsl:attribute name="href">../../../</xsl:attribute>
                  Main
                </xsl:element>
                &gt;
                <xsl:element name="a">
                  <xsl:attribute name="href">../../</xsl:attribute>
                  Instance
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
            <ul id="ul_id">
              <xsl:for-each select="*">
                <li>
                  <xsl:text>[</xsl:text>
                  <xsl:element name="a">
                    <xsl:attribute name="href">#stay</xsl:attribute>
                    <xsl:attribute name="id">delete_button</xsl:attribute>
                    <xsl:attribute name="value">./<xsl:value-of select="@id"/></xsl:attribute>
                    <xsl:text>✖</xsl:text>
                  </xsl:element>
                  <xsl:text>]</xsl:text>
                  <xsl:text> </xsl:text>
                  <xsl:element name="a">
                    <xsl:attribute name="href"><xsl:value-of select="@id"/>/</xsl:attribute>
                    <xsl:if test="@url">
                      <xsl:value-of select="@url"/>:
                    </xsl:if>  
                    <xsl:value-of select="@id"/>
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

