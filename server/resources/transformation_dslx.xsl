<?xml version="1.0"?>
<xsl:stylesheet version="1.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
    xmlns:d="http://cpee.org/ns/description/1.0" 
    xmlns:str="http://exslt.org/strings">

  <xsl:output method="text"/>
  <xsl:strip-space elements="*"/>
  <xsl:variable name="myspacemultiplier">2</xsl:variable>

  <xsl:template match="/">
    <xsl:apply-templates select="//d:description"/>
  </xsl:template>

  <xsl:template match="//d:description">
    <xsl:apply-templates>
      <xsl:with-param name="myspace"><xsl:value-of select="-1*$myspacemultiplier"/></xsl:with-param>
    </xsl:apply-templates>  
  </xsl:template>

  <xsl:template match="*">
    <xsl:param name="myspace"/>
    <xsl:call-template name="print-space">
      <xsl:with-param name="i">1</xsl:with-param>
      <xsl:with-param name="count"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
    </xsl:call-template>
    <xsl:if test="name()='call' or name()='manipulate'">
      <xsl:value-of select="name()"/>
      <xsl:text> :</xsl:text>
      <xsl:value-of select="@id"/>
    </xsl:if>
    <xsl:if test="name()='call'">
      <xsl:text>, </xsl:text>
      <xsl:choose>
        <xsl:when test="count(str:tokenize(@endpoint,' ')) > 1">
          <xsl:text>[</xsl:text>
          <xsl:for-each select="str:tokenize(@endpoint,' ')">
            <xsl:if test="position() >1">, </xsl:if>
            <xsl:text>:</xsl:text>
            <xsl:value-of select="."/>
          </xsl:for-each>
          <xsl:text>]</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>:</xsl:text>
          <xsl:value-of select="@endpoint"/>
        </xsl:otherwise>
      </xsl:choose>  
      <xsl:text>, { </xsl:text>
      <xsl:apply-templates select="d:parameters"/>
      <xsl:text> }</xsl:text>
      <xsl:apply-templates select="d:manipulate" mode="part-of-call">
        <xsl:with-param name="myspace"><xsl:value-of select="$myspace"/></xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='manipulate'">
      <xsl:call-template name="print-content">
        <xsl:with-param name="myspace"><xsl:value-of select="$myspace"/></xsl:with-param>
      </xsl:call-template>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='break'">
      <xsl:text>break</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='parallel'">
      <xsl:text>parallel</xsl:text>
      <xsl:if test="@wait">
        <xsl:text> :wait => </xsl:text>
        <xsl:value-of select="@wait"/>
      </xsl:if>
      <xsl:text> do</xsl:text>
      <xsl:call-template name="print-newline"/>
      <xsl:apply-templates>
        <xsl:with-param name="myspace"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
      </xsl:call-template>
      <xsl:text>end</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='loop'">
      <xsl:text>loop </xsl:text>
      <xsl:if test="@pre_test">
        <xsl:choose>
          <xsl:when test="not(@language) or @language='application/x-ruby'">
            <xsl:text>pre_test{</xsl:text>
            <xsl:value-of select="@pre_test"/>
            <xsl:text>} </xsl:text>
          </xsl:when>  
          <xsl:otherwise>
            <xsl:text>pre_test("</xsl:text>
            <xsl:value-of select="@pre_test"/>
            <xsl:text>") </xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:if>
      <xsl:if test="@post_test">
        <xsl:choose>
          <xsl:when test="not(@language) or @language='application/x-ruby'">
            <xsl:text>post_test{</xsl:text>
            <xsl:value-of select="@post_test"/>
            <xsl:text>} </xsl:text>
          </xsl:when>  
          <xsl:otherwise>
            <xsl:text>post_test("</xsl:text>
            <xsl:value-of select="@post_test"/>
            <xsl:text>") </xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:if>
      <xsl:text>do</xsl:text>
      <xsl:call-template name="print-newline"/>
      <xsl:apply-templates>
        <xsl:with-param name="myspace"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
      </xsl:call-template>
      <xsl:text>end</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='choose'">
      <xsl:text>choose </xsl:text>
        <xsl:choose>
          <xsl:when test="@mode='exclusive'">
            <xsl:text>:exclusive</xsl:text>
          </xsl:when>  
          <xsl:otherwise>
            <xsl:text>:inclusive</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      <xsl:text> do</xsl:text>
      <xsl:call-template name="print-newline"/>
      <xsl:apply-templates>
        <xsl:with-param name="myspace"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
      </xsl:call-template>
      <xsl:text>end</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='group'">
      <xsl:apply-templates>
        <xsl:with-param name="myspace"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='critical'">
      <xsl:text>critical :</xsl:text>
      <xsl:value-of select="@sid"/>
      <xsl:text> do</xsl:text>
      <xsl:call-template name="print-newline"/>
      <xsl:apply-templates>
        <xsl:with-param name="myspace"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
      </xsl:call-template>
      <xsl:text>end</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
  </xsl:template>
  
  <xsl:template match="d:alternative">
    <xsl:param name="myspace"/>
    <xsl:call-template name="print-space">
      <xsl:with-param name="i">1</xsl:with-param>
      <xsl:with-param name="count"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
    </xsl:call-template>
    <xsl:text>alternative </xsl:text>
    <xsl:choose>
      <xsl:when test="not(@language) or @language='application/x-ruby'">
        <xsl:text>"</xsl:text>
        <xsl:value-of select="@condition"/>
        <xsl:text>"</xsl:text>
      </xsl:when>  
      <xsl:otherwise>
        <xsl:text>"</xsl:text>
        <xsl:value-of select="@condition"/>
        <xsl:text>"</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
    <xsl:text> do</xsl:text>
    <xsl:call-template name="print-newline"/>
    <xsl:apply-templates>
      <xsl:with-param name="myspace"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
    </xsl:apply-templates>
    <xsl:call-template name="print-space">
      <xsl:with-param name="i">1</xsl:with-param>
      <xsl:with-param name="count"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
    </xsl:call-template>
    <xsl:text>end</xsl:text>
    <xsl:call-template name="print-newline"/>
  </xsl:template>

  <xsl:template match="d:otherwise">
    <xsl:param name="myspace"/>
    <xsl:call-template name="print-space">
      <xsl:with-param name="i">1</xsl:with-param>
      <xsl:with-param name="count"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
    </xsl:call-template>
    <xsl:text>otherwise do</xsl:text>
    <xsl:call-template name="print-newline"/>
    <xsl:apply-templates>
      <xsl:with-param name="myspace"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
    </xsl:apply-templates>
    <xsl:call-template name="print-space">
      <xsl:with-param name="i">1</xsl:with-param>
      <xsl:with-param name="count"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
    </xsl:call-template>
    <xsl:text>end</xsl:text>
    <xsl:call-template name="print-newline"/>
  </xsl:template>

  <xsl:template match="d:parallel_branch">
    <xsl:param name="myspace"/>
    <xsl:call-template name="print-space">
      <xsl:with-param name="i">1</xsl:with-param>
      <xsl:with-param name="count"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
    </xsl:call-template>
    <xsl:text>parallel_branch</xsl:text>
    <xsl:if test="@pass">
      <xsl:text> </xsl:text>
      <xsl:value-of select="@pass"/>
    </xsl:if>
    <xsl:text> do</xsl:text>
    <xsl:if test="@local">
      <xsl:text> |</xsl:text>
      <xsl:value-of select="@local"/>
      <xsl:text>|</xsl:text>
    </xsl:if>
    <xsl:call-template name="print-newline"/>
    <xsl:apply-templates>
      <xsl:with-param name="myspace"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
    </xsl:apply-templates>
    <xsl:call-template name="print-space">
      <xsl:with-param name="i">1</xsl:with-param>
      <xsl:with-param name="count"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
    </xsl:call-template>
    <xsl:text>end</xsl:text>
    <xsl:call-template name="print-newline"/>
  </xsl:template>

  <xsl:template match="d:parameters">
    <xsl:apply-templates select="d:*" mode="parameter"/>
  </xsl:template>
    
  <xsl:template match="d:*" mode="parameter">
    <xsl:choose>
      <xsl:when test="position() = 1">
        <xsl:text>:</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>, :</xsl:text>
      </xsl:otherwise>
    </xsl:choose>  
    <xsl:value-of select="name()"/>
    <xsl:text> => </xsl:text>
    <xsl:choose>  
      <xsl:when test="count(*) > 0">
        <xsl:text>{</xsl:text>
        <xsl:apply-templates select="d:*" mode="sub-parameter"/>
        <xsl:text>}</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="@type = 'symbolic'">
            <xsl:value-of select="text()"/>
          </xsl:when>
          <xsl:when test="not(node())">
            <xsl:text>nil</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>"</xsl:text>
            <xsl:value-of select="text()"/>
            <xsl:text>"</xsl:text>
          </xsl:otherwise>
        </xsl:choose>  
      </xsl:otherwise>
    </xsl:choose>  
  </xsl:template>
  
  <xsl:template match="d:*" mode="sub-parameter">
    <xsl:text> :</xsl:text>
    <xsl:value-of select="name()"/>
    <xsl:text> => </xsl:text>
    <xsl:value-of select="text()"/>
    <xsl:choose>  
      <xsl:when test="generate-id(.) = generate-id(../*[last()])">
        <xsl:text> </xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>,</xsl:text>
      </xsl:otherwise>
    </xsl:choose>  
  </xsl:template>

  <xsl:template match="d:manipulate" mode="part-of-call">
    <xsl:param name="myspace"/>
    <xsl:call-template name="print-content">
      <xsl:with-param name="myspace"><xsl:value-of select="$myspace"/></xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="print-content">
    <xsl:param name="myspace"/>
    <xsl:if test="text()">
      <xsl:choose>
        <xsl:when test="@language='application/x-ruby'">
          <xsl:text> do </xsl:text>
          <xsl:if test="@output">
            <xsl:text>|</xsl:text>
            <xsl:value-of select="@output"/>
            <xsl:text>|</xsl:text>
          </xsl:if>
        </xsl:when>  
        <xsl:otherwise>
          <xsl:text>, &lt;&lt;-end </xsl:text>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:call-template name="print-newline"/>
      <xsl:value-of select="text()"/>
      <xsl:call-template name="print-newline"/>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count"><xsl:value-of select="$myspace+$myspacemultiplier"/></xsl:with-param>
      </xsl:call-template>
      <xsl:text>end</xsl:text>
    </xsl:if>
  </xsl:template>

  <xsl:template name="print-space">
    <xsl:param name="i"/>
    <xsl:param name="count"/>
    <xsl:if test="$i &lt;= $count">
      <xsl:text> </xsl:text>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">
          <xsl:value-of select="$i + 1"/>
        </xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$count"/>
        </xsl:with-param>
      </xsl:call-template>
    </xsl:if>
  </xsl:template>
  <xsl:template name="print-newline">
    <xsl:text>
</xsl:text>
  </xsl:template>

</xsl:stylesheet>
