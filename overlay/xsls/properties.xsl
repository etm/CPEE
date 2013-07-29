<!DOCTYPE html>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" doctype-public="XSLT-compat"/>
  <xsl:template match="*">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Further Explore the Notifications</title>
        <script src="http://code.jquery.com/jquery-1.9.1.js"></script>
        <script src="http://code.jquery.com/ui/1.10.3/jquery-ui.js"></script>
        <script type="text/javascript">
          $(document).ready(function(){
            troublesome();
            var doc_table = $('#test_id');                                                                                                                                       
            var input_param_temp = "&lt;tr&gt;&lt;td&gt;InputParameter&lt;/td&gt;&lt;td&gt;&lt;/td&gt;&lt;td&gt;%MSGNAME%&lt;/td&gt;&lt;td&gt;%PARANAME%&lt;/td&gt;&lt;td&gt;%PARATYPE%&lt;/td&gt;";
            var table_template = "&lt;table border=\"1\"&gt;&lt;thead&gt;&lt;tr&gt;&lt;th&gt;OPERATION&lt;/th&gt;&lt;th rowspan=\"%ROWSPAN%\"&gt;%METHODE%&lt;/th&gt;&lt;th&gt;Message_Name&lt;/th&gt;&lt;th&gt;Parameter_Name&lt;/th&gt;&lt;th&gt;Parameter_Type&lt;/th&gt;&lt;/tr&gt;&lt;/thead&gt;&lt;tbody&gt;";
            var table_end_temp = "&lt;/tbody&gt;&lt;/table&gt;&lt;br /&gt;";
            var output_param_temp = "&lt;tr&gt;&lt;td&gt;OutputParameter&lt;/td&gt;&lt;td&gt;&lt;/td&gt;&lt;td&gt;%MSGNAME%&lt;/td&gt;&lt;td&gt;%PARANAME%&lt;/td&gt;&lt;td&gt;%PARATYPE%&lt;/td&gt;";     
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
                  if(!(msg_node.children().length > 2))
                  {
                    var msg_chil = msg_node.children(":first-child");
                    var omsg_str = "message[name='"+vout+"']";
                    var omsg_node = $(data).find(omsg_str);
                    var omsg_chil = omsg_node.children(":first-child");
                    var in_temp = input_param_temp.replace(/%MSGNAME%/,vin);
                    in_temp = in_temp.replace(/%PARANAME%/,msg_chil.attr('name'));
                    var mime_or_no_mime_i = "type";
                    if(typeof msg_chil.attr('type') == "undefined"){
                      mime_or_no_mime_i = "mimetype";                                                                                                                           
                    }
                    in_temp = in_temp.replace(/%PARATYPE%/,msg_chil.attr(mime_or_no_mime_i));
                    var out_temp = output_param_temp.replace(/%MSGNAME%/,vout);
                    var mime_or_no_mime_o = "type";
                    if(typeof omsg_chil.attr('type') == "undefined"){
                      mime_or_no_mime_o = "mimetype";
                    }
                    out_temp = out_temp.replace(/%PARANAME%/,omsg_chil.attr('name'));
                    out_temp = out_temp.replace(/%PARATYPE%/,omsg_chil.attr(mime_or_no_mime_o));                                                                                
                    var table_temp = table_template.replace(/%METHODE%/,vop);
                    if(!(typeof vout == "undefined")){
                      table_temp = table_temp.replace(/%ROWSPAN%/,3);
                      temp = table_temp+in_temp+out_temp+table_end_temp;
                    }
                    else{
                      table_temp = table_temp.replace(/%ROWSPAN%/,2);
                      temp = table_temp+in_temp+table_end_temp;
                    }
                    doc_table.append(temp);
                  }
                  else{
                    console.log("ToDo");
                  }
                });
              }
            });
          });
          function troublesome(){
            var chi =$("#lagiacrus").children();
            chi.each(function(){ replacing($(this)); });
          }
          function replacing(leia){
            var jacen = leia.children('#manly').children('#jacen');
            if (jacen.children().length>0){ 
              jacen.children().each(function(){ replacing($(this));});
            }
            var temp = jacen.html().split("gt");
            var replacement = "&lt;div id=anakin&gt;"+temp[0]+"gt;&lt;/div&gt;"; 
            var anakin = leia.children('#manly').children('#anakin');  
            anakin.replaceWith(replacement);
            anakin = leia.children('#manly').children('#anakin');
            jacen.toggle();
            var real_one ="&lt;div id=jacen&gt;"+jacen.html()+"&lt;/div&gt;";
            leia.children('#jaina').click(function(){
              jacen.toggle();
              anakin.toggle();
              if($(this).text()!="▽") $(this).text("▽");
              else $(this).text("▶");
             });
          }
        </script>
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
              Properties
            </xsl:element>                                                        
          </nav>
        </div>
        <h1>Navigation </h1>
        <ul>
          <li><a href='schema/'>Schema</a></li>  
          <li><a href='values/'>Values</a></li>  
        </ul>
        <h1>RAW</h1>
        <pre id="lagiacrus">
          <xsl:apply-templates select="node()" mode="XmlEscape"/>
        </pre>
        <h1>DOC</h1>
        <div id="test_id"> </div>
      </body>
    </html>
  </xsl:template>

  <xsl:param name="NL"        select="'&#xA;'" /><!-- newline sequence -->
  <xsl:param name="INDENTSEQ" select="'&#160;&#160;'" /><!-- indent sequence -->

  <xsl:variable name="LT" select="'&lt;'" />
  <xsl:variable name="GT" select="'&gt;'" />

  <xsl:template match="transform-me">
    <html>
      <body>
        <!-- this XML-escapes an entire sub-structure -->
        <pre><xsl:apply-templates select="*" mode="XmlEscape" /></pre>
      </body>
    </html>
  </xsl:template>

  <!-- element nodes will be handled here, incl. proper indenting -->
  <xsl:template match="*" mode="XmlEscape">
    <xsl:param name="indent" select="''" />
    <xsl:choose>
      <xsl:when test="count(./*) &gt; 0">
        <xsl:element name="div">
          <xsl:attribute name="id">leia</xsl:attribute>
          <xsl:element name ="a">
            <xsl:attribute name="style">vertical-align: top;</xsl:attribute>
            <xsl:attribute name="href">#stay</xsl:attribute>
            <xsl:attribute name="id">jaina</xsl:attribute>
            <xsl:text>▶</xsl:text>
            <!--xsl:element name="span">▽</xsl:element-->
          </xsl:element> 
          <xsl:text>&#32;</xsl:text>
          <xsl:element name="div">
            <xsl:attribute name="id">manly</xsl:attribute>
            <xsl:attribute name="style">display: inline-block;</xsl:attribute>
            <xsl:element name="div"><xsl:attribute name="id">anakin</xsl:attribute></xsl:element>
            <xsl:element name="div">
              <xsl:attribute name="id">jacen</xsl:attribute>
              <xsl:value-of select="concat($indent, $LT, name())" />
              <xsl:apply-templates select="@*" mode="XmlEscape" />
              <xsl:variable name="HasChildNode" select="node()[not(self::text())]" />
              <xsl:variable name="HasChildText" select="text()[normalize-space()]" />
              <xsl:choose>
                <xsl:when test="$HasChildNode or $HasChildText">
                  <xsl:value-of select="$GT" />
                  <xsl:if test="not($HasChildText)">
                    <xsl:value-of select="$NL" />
                  </xsl:if>
                  <!-- render child nodes -->
                  <xsl:apply-templates mode="XmlEscape" select="node()">
                    <xsl:with-param name="indent" select="concat($INDENTSEQ, $indent)" />
                  </xsl:apply-templates>
                  <xsl:if test="not($HasChildText)">
                    <xsl:value-of select="$indent" />
                  </xsl:if>
                  <xsl:value-of select="concat($LT, '/', name(), $GT, $NL)" />
                </xsl:when>
                <xsl:otherwise>
                  <xsl:value-of select="concat(' /', $GT, $NL)" />
                </xsl:otherwise>
              </xsl:choose>
            </xsl:element>
          </xsl:element>
        </xsl:element>
      </xsl:when>
      <xsl:otherwise>
        <xsl:if test="..">
        <xsl:text>&#32;</xsl:text><xsl:text>&#32;</xsl:text>
        </xsl:if>
        <xsl:value-of select="concat($indent, $LT, name())" />
        <xsl:apply-templates select="@*" mode="XmlEscape" />
        <xsl:variable name="HasChildNode" select="node()[not(self::text())]" />
        <xsl:variable name="HasChildText" select="text()[normalize-space()]" />
        <xsl:choose>
          <xsl:when test="$HasChildNode or $HasChildText">
            <xsl:value-of select="$GT" />
            <xsl:if test="not($HasChildText)">
              <xsl:value-of select="$NL" />
            </xsl:if>
            <!-- render child nodes -->
            <xsl:apply-templates mode="XmlEscape" select="node()">
              <xsl:with-param name="indent" select="concat($INDENTSEQ, $indent)" />
            </xsl:apply-templates>
            <xsl:if test="not($HasChildText)">
              <xsl:value-of select="$indent" />
            </xsl:if>
            <xsl:value-of select="concat($LT, '/', name(), $GT, $NL)" />
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="concat(' /', $GT, $NL)" />
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- comments will be handled here -->
  <xsl:template match="comment()" mode="XmlEscape">
    <xsl:param name="indent" select="''" />
    <xsl:value-of select="concat($indent, $LT, '!--', ., '--', $GT, $NL)" />
  </xsl:template>

  <!-- text nodes will be printed XML-escaped -->
  <xsl:template match="text()" mode="XmlEscape">
    <xsl:if test="not(normalize-space() = '')">
      <xsl:call-template name="XmlEscapeString">
        <xsl:with-param name="s" select="." />
        <xsl:with-param name="IsAttribute" select="false()" />
      </xsl:call-template>
    </xsl:if>
  </xsl:template>

  <!-- attributes become a string: '{name()}="{escaped-value()}"' -->
  <xsl:template match="@*" mode="XmlEscape">
    <xsl:value-of select="concat(' ', name(), '=&quot;')" />
    <xsl:call-template name="XmlEscapeString">
      <xsl:with-param name="s" select="." />
      <xsl:with-param name="IsAttribute" select="true()" />
    </xsl:call-template>
    <xsl:value-of select="'&quot;'" />
  </xsl:template>

  <!-- template to XML-escape a string -->
  <xsl:template name="XmlEscapeString">
    <xsl:param name="s" select="''" />
    <xsl:param name="IsAttribute" select="false()" />
    <!-- chars &, < and > are never allowed -->
    <xsl:variable name="step1">
      <xsl:call-template name="StringReplace">
        <xsl:with-param name="s"       select="$s" />
        <xsl:with-param name="search"  select="'&amp;'" />
        <xsl:with-param name="replace" select="'&amp;amp;'" />
      </xsl:call-template>
    </xsl:variable>
    <xsl:variable name="step2">
      <xsl:call-template name="StringReplace">
        <xsl:with-param name="s"       select="$step1" />
        <xsl:with-param name="search"  select="'&lt;'" />
        <xsl:with-param name="replace" select="'&amp;lt;'" />
      </xsl:call-template>
    </xsl:variable>
    <xsl:variable name="step3">
      <xsl:call-template name="StringReplace">
        <xsl:with-param name="s"       select="$step2" />
        <xsl:with-param name="search"  select="'&gt;'" />
        <xsl:with-param name="replace" select="'&amp;lt;'" />
      </xsl:call-template>
    </xsl:variable>
    <!-- chars ", TAB, CR and LF are never allowed in attributes -->
    <xsl:choose>
      <xsl:when test="$IsAttribute">
        <xsl:variable name="step4">
          <xsl:call-template name="StringReplace">
            <xsl:with-param name="s"       select="$step3" />
            <xsl:with-param name="search"  select="'&quot;'" />
            <xsl:with-param name="replace" select="'&amp;quot;'" />
          </xsl:call-template>
        </xsl:variable>
        <xsl:variable name="step5">
          <xsl:call-template name="StringReplace">
            <xsl:with-param name="s"       select="$step4" />
            <xsl:with-param name="search"  select="'&#x9;'" />
            <xsl:with-param name="replace" select="'&amp;#x9;'" />
          </xsl:call-template>
        </xsl:variable>
        <xsl:variable name="step6">
          <xsl:call-template name="StringReplace">
            <xsl:with-param name="s"       select="$step5" />
            <xsl:with-param name="search"  select="'&#xA;'" />
            <xsl:with-param name="replace" select="'&amp;#xD;'" />
          </xsl:call-template>
        </xsl:variable>
        <xsl:variable name="step7">
          <xsl:call-template name="StringReplace">
            <xsl:with-param name="s"       select="$step6" />
            <xsl:with-param name="search"  select="'&#xD;'" />
            <xsl:with-param name="replace" select="'&amp;#xD;'" />
          </xsl:call-template>
        </xsl:variable>
        <xsl:value-of select="$step7" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$step3" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- generic string replace template -->
  <xsl:template name="StringReplace">
    <xsl:param name="s"       select="''" />
    <xsl:param name="search"  select="''" />
    <xsl:param name="replace" select="''" />

    <xsl:choose>
      <xsl:when test="contains($s, $search)">
        <xsl:value-of select="substring-before($s, $search)" />
        <xsl:value-of select="$replace" />
        <xsl:variable name="rest" select="substring-after($s, $search)" />
        <xsl:if test="$rest">
          <xsl:call-template name="StringReplace">
            <xsl:with-param name="s"       select="$rest" />
            <xsl:with-param name="search"  select="$search" />
            <xsl:with-param name="replace" select="$replace" />
          </xsl:call-template>
        </xsl:if>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$s" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

</xsl:stylesheet>

