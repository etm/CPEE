<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:d="http://cpee.org/ns/description/1.0" xmlns:str="http://exslt.org/strings" version="1.0">
  <xsl:output method="text"/>
  <xsl:strip-space elements="*"/>
  <xsl:variable name="myspacemultiplier">2</xsl:variable>
  <xsl:template match="/">
    <xsl:text>control flow do</xsl:text>
    <xsl:call-template name="print-newline"/>
    <xsl:apply-templates select="/d:description"/>
    <xsl:text>end</xsl:text>
  </xsl:template>
  <xsl:template match="/d:description">
    <xsl:apply-templates>
      <xsl:with-param name="myspace">
        <xsl:value-of select="0*$myspacemultiplier"/>
      </xsl:with-param>
    </xsl:apply-templates>
  </xsl:template>
  <xsl:template match="*">
    <xsl:param name="myspace"/>
    <xsl:if test="name()='call' or name()='manipulate'">
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:value-of select="name()"/>
      <xsl:text> :</xsl:text>
      <xsl:value-of select="@id"/>
    </xsl:if>
    <xsl:if test="name()='call'">
      <xsl:text>, </xsl:text>
      <xsl:choose>
        <xsl:when test="count(str:tokenize(@endpoint,' ')) &gt; 1">
          <xsl:text>[</xsl:text>
          <xsl:for-each select="str:tokenize(@endpoint,' ')">
            <xsl:if test="position() &gt;1">, </xsl:if>
            <xsl:text>:</xsl:text>
            <xsl:value-of select="."/>
          </xsl:for-each>
          <xsl:text>]</xsl:text>
        </xsl:when>
        <xsl:when test="count(str:tokenize(@endpoint,' ')) = 0">
          <xsl:text>nil</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>:</xsl:text>
          <xsl:value-of select="@endpoint"/>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:text>, parameters: { </xsl:text>
      <xsl:apply-templates select="d:parameters"/>
      <xsl:text> }</xsl:text>
      <xsl:if test="(d:finalize or d:code/d:finalize) and (d:finalize/text() or d:code/d:finalize/text())">
        <xsl:text>, finalize: &lt;&lt;-END</xsl:text>
      </xsl:if>
      <xsl:if test="(d:update or d:code/d:update) and (d:update/text() or d:code/d:update/text())">
        <xsl:text>, update: &lt;&lt;-END</xsl:text>
      </xsl:if>
      <xsl:if test="(d:prepare or d:code/d:prepare) and (d:prepare/text() or d:code/d:prepare/text())">
        <xsl:text>, prepare: &lt;&lt;-END</xsl:text>
      </xsl:if>
      <xsl:if test="(d:rescue or d:code/d:rescue) and (d:rescue/text() or d:code/d:rescue/text())">
        <xsl:text>, salvage: &lt;&lt;-END</xsl:text>
      </xsl:if>
      <xsl:apply-templates select="d:finalize | d:code/d:finalize" mode="part-of-call">
        <xsl:with-param name="myspace">
          <xsl:value-of select="$myspace"/>
        </xsl:with-param>
      </xsl:apply-templates>
      <xsl:apply-templates select="d:update | d:code/d:update" mode="part-of-call">
        <xsl:with-param name="myspace">
          <xsl:value-of select="$myspace"/>
        </xsl:with-param>
      </xsl:apply-templates>
      <xsl:apply-templates select="d:prepare | d:code/d:prepare" mode="part-of-call">
        <xsl:with-param name="myspace">
          <xsl:value-of select="$myspace"/>
        </xsl:with-param>
      </xsl:apply-templates>
      <xsl:apply-templates select="d:rescue | d:code/d:rescue" mode="part-of-call">
        <xsl:with-param name="myspace">
          <xsl:value-of select="$myspace"/>
        </xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='manipulate'">
      <xsl:if test="@label">
        <xsl:text>, { :label => "</xsl:text>
          <xsl:value-of select="@label"/>
        <xsl:text>" }</xsl:text>
      </xsl:if>
      <xsl:call-template name="print-mcontent">
        <xsl:with-param name="myspace">
          <xsl:value-of select="$myspace"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:call-template name="print-newline"></xsl:call-template>
    </xsl:if>
    <xsl:if test="name()='terminate'">
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>terminate</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='stop'">
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>stop :</xsl:text>
      <xsl:value-of select="@id"/>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='escape'">
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>escape</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='parallel'">
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>parallel</xsl:text>
      <xsl:if test="@wait">
        <xsl:text> :wait =&gt; </xsl:text>
        <xsl:value-of select="@wait"/>
        <xsl:if test="@cancel">
          <xsl:text>, :cancel =&gt; :</xsl:text>
          <xsl:value-of select="@cancel"/>
        </xsl:if>
      </xsl:if>
      <xsl:text> do</xsl:text>
      <xsl:call-template name="print-newline"/>
      <xsl:apply-templates>
        <xsl:with-param name="myspace">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>end</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='loop'">
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>loop </xsl:text>
      <xsl:if test="@mode='pre_test'">
        <xsl:choose>
          <xsl:when test="@language='application/x-ruby'">
            <xsl:text>pre_test{</xsl:text>
            <xsl:value-of select="@condition"/>
            <xsl:text>} </xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>pre_test("</xsl:text>
            <xsl:value-of select="str:replace(str:replace(@condition,'\','\\'),'&quot;','\&quot;')"/>
            <xsl:text>")</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:if>
      <xsl:if test="@mode='post_test'">
        <xsl:choose>
          <xsl:when test="@language='application/x-ruby'">
            <xsl:text>post_test{</xsl:text>
            <xsl:value-of select="@condition"/>
            <xsl:text>} </xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>post_test("</xsl:text>
            <xsl:value-of select="str:replace(str:replace(@condition,'\','\\'),'&quot;','\&quot;')"/>
            <xsl:text>")</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:if>
      <xsl:for-each select="@*[not(name()='language' or name()='mode' or name()='condition' or name()='svg-label')]">
        <xsl:text>, :</xsl:text>
        <xsl:value-of select="name(.)"/>
        <xsl:text> => "</xsl:text>
        <xsl:value-of select="."/>
        <xsl:text>"</xsl:text>
      </xsl:for-each>
      <xsl:text> do</xsl:text>
      <xsl:call-template name="print-newline"/>
      <xsl:apply-templates>
        <xsl:with-param name="myspace">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>end</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='closed_loop'">
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>closed_loop</xsl:text>
      <xsl:if test="@overrun">
        <xsl:text> :overrun =&gt; </xsl:text>
        <xsl:value-of select="@overrun"/>
        <xsl:if test="@execution">
          <xsl:text>, :execution =&gt; :</xsl:text>
          <xsl:value-of select="@execution"/>
        </xsl:if>
      </xsl:if>
      <xsl:text> do</xsl:text>
      <xsl:call-template name="print-newline"/>
      <xsl:apply-templates>
        <xsl:with-param name="myspace">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>end</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='closed_loop_measuring' or name()='closed_loop_control'">
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>closed_loop_slice :type =&gt; :</xsl:text>
      <xsl:value-of select="substring(name(),13,10)"/>
      <xsl:if test="@ctime">
        <xsl:text>, :ctime =&gt; </xsl:text>
        <xsl:value-of select="@ctime"/>
      </xsl:if>
      <xsl:text> do</xsl:text>
      <xsl:call-template name="print-newline"/>
      <xsl:apply-templates>
        <xsl:with-param name="myspace">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>end</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='choose'">
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>choose </xsl:text>
      <xsl:text> do</xsl:text>
      <xsl:call-template name="print-newline"/>
      <xsl:apply-templates>
        <xsl:with-param name="myspace">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>end</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='group'">
      <xsl:apply-templates>
        <xsl:with-param name="myspace">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
    <xsl:if test="name()='critical'">
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>critical :</xsl:text>
      <xsl:value-of select="@sid"/>
      <xsl:text> do</xsl:text>
      <xsl:call-template name="print-newline"/>
      <xsl:apply-templates>
        <xsl:with-param name="myspace">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>end</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
  </xsl:template>
  <xsl:template match="d:alternative">
    <xsl:param name="myspace"/>
    <xsl:call-template name="print-space">
      <xsl:with-param name="i">1</xsl:with-param>
      <xsl:with-param name="count">
        <xsl:value-of select="$myspace+$myspacemultiplier"/>
      </xsl:with-param>
    </xsl:call-template>
    <xsl:text>alternative </xsl:text>
    <xsl:choose>
      <xsl:when test="@language='application/x-ruby'">
        <xsl:text>test{</xsl:text>
        <xsl:value-of select="@condition"/>
        <xsl:text>}</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>test("</xsl:text>
        <xsl:value-of select="str:replace(str:replace(@condition,'\','\\'),'&quot;','\&quot;')"/>
        <xsl:text>")</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
    <xsl:for-each select="@*[not(name()='language' or name()='condition' or name()='svg-label')]">
      <xsl:text>, :</xsl:text>
      <xsl:value-of select="name(.)"/>
      <xsl:text> => "</xsl:text>
      <xsl:value-of select="."/>
      <xsl:text>"</xsl:text>
    </xsl:for-each>
    <xsl:text> do</xsl:text>
    <xsl:call-template name="print-newline"/>
    <xsl:apply-templates>
      <xsl:with-param name="myspace">
        <xsl:value-of select="$myspace+$myspacemultiplier"/>
      </xsl:with-param>
    </xsl:apply-templates>
    <xsl:call-template name="print-space">
      <xsl:with-param name="i">1</xsl:with-param>
      <xsl:with-param name="count">
        <xsl:value-of select="$myspace+$myspacemultiplier"/>
      </xsl:with-param>
    </xsl:call-template>
    <xsl:text>end</xsl:text>
    <xsl:call-template name="print-newline"/>
  </xsl:template>
  <xsl:template match="d:otherwise">
    <xsl:param name="myspace"/>
    <xsl:if test="*">
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>otherwise </xsl:text>
      <xsl:for-each select="@*[not(name()='language' or name()='condition' or name()='svg-label')]">
        <xsl:if test="position() &gt;1">, </xsl:if>
        <xsl:text>:</xsl:text>
        <xsl:value-of select="name(.)"/>
        <xsl:text> => "</xsl:text>
        <xsl:value-of select="."/>
        <xsl:text>"</xsl:text>
      </xsl:for-each>
      <xsl:text> do</xsl:text>
      <xsl:call-template name="print-newline"/>
      <xsl:apply-templates>
        <xsl:with-param name="myspace">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:apply-templates>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>end</xsl:text>
      <xsl:call-template name="print-newline"/>
    </xsl:if>
  </xsl:template>
  <xsl:template match="d:parallel_branch">
    <xsl:param name="myspace"/>
    <xsl:call-template name="print-space">
      <xsl:with-param name="i">1</xsl:with-param>
      <xsl:with-param name="count">
        <xsl:value-of select="$myspace+$myspacemultiplier"/>
      </xsl:with-param>
    </xsl:call-template>
    <xsl:text>parallel_branch data do |local|</xsl:text>
    <xsl:call-template name="print-newline"/>
    <xsl:apply-templates>
      <xsl:with-param name="myspace">
        <xsl:value-of select="$myspace+$myspacemultiplier"/>
      </xsl:with-param>
    </xsl:apply-templates>
    <xsl:call-template name="print-space">
      <xsl:with-param name="i">1</xsl:with-param>
      <xsl:with-param name="count">
        <xsl:value-of select="$myspace+$myspacemultiplier"/>
      </xsl:with-param>
    </xsl:call-template>
    <xsl:text>end</xsl:text>
    <xsl:call-template name="print-newline"/>
  </xsl:template>
  <xsl:template match="d:parameters">
    <xsl:apply-templates select="d:label" mode="parameter"/>
    <xsl:apply-templates select="d:*[not(name()='label')]" mode="parameter"/>
    <xsl:if test="count(*) &gt; 0">, </xsl:if>
    <xsl:apply-templates select="../d:annotations" mode="annotations"/>
  </xsl:template>
  <xsl:template match="d:label" mode="parameter">
    <xsl:text>:</xsl:text>
    <xsl:value-of select="name()"/>
    <xsl:text> =&gt; "</xsl:text>
    <xsl:value-of select="str:replace(str:replace(text(),'\','\\'),'&quot;','\&quot;')"/>
    <xsl:text>"</xsl:text>
  </xsl:template>
  <xsl:template match="d:annotations" mode="annotations">
    <xsl:text>:</xsl:text>
    <xsl:value-of select="name()"/>
    <xsl:text> =&gt; </xsl:text>
    <xsl:text>{ </xsl:text>
    <xsl:apply-templates select="d:*" mode="simplemulti"/>
    <xsl:text> }</xsl:text>
  </xsl:template>
  <xsl:template match="d:*[not(name()='label')]" mode="parameter">
    <xsl:if test="count(preceding-sibling::*) &gt; 0">, </xsl:if>
    <xsl:text>:</xsl:text>
    <xsl:value-of select="name()"/>
    <xsl:text> =&gt; </xsl:text>

    <xsl:choose>
      <xsl:when test="count(*) &gt; 0 and name()='arguments'">
        <xsl:text>[</xsl:text>
        <xsl:apply-templates select="d:*" mode="sub"/>
        <xsl:text>]</xsl:text>
      </xsl:when>
      <xsl:when test="count(*) &gt; 0 and not(name()='arguments')">
        <xsl:text>{</xsl:text>
        <xsl:apply-templates select="d:*" mode="parameter"/>
        <xsl:text>}</xsl:text>
      </xsl:when>
      <xsl:when test="not(node())">
        <xsl:text>nil</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="text()"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  <xsl:template match="d:*" mode="plain">
    <xsl:if test="count(preceding-sibling::*) &gt; 0">, </xsl:if>
    <xsl:text>:</xsl:text>
    <xsl:value-of select="name()"/>
    <xsl:text> =&gt; </xsl:text>
    <xsl:choose>
      <xsl:when test="count(*) &gt; 0 and count(*) = count(*[name()=name(../*[1])])">
        <xsl:text>[</xsl:text>
        <xsl:apply-templates select="d:*" mode="plainmulti"/>
        <xsl:text>]</xsl:text>
      </xsl:when>
      <xsl:when test="count(*) &gt; 0">
        <xsl:text>{</xsl:text>
        <xsl:apply-templates select="d:*" mode="plain"/>
        <xsl:text>}</xsl:text>
      </xsl:when>
      <xsl:when test="not(node())">
        <xsl:text>nil</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="substring(text(),1,1) = '!'">
            <xsl:value-of select="substring(text(),2)"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>"</xsl:text>
            <xsl:value-of select="str:replace(str:replace(text(),'\','\\'),'&quot;','\&quot;')"/>
            <xsl:text>"</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  <xsl:template match="d:*" mode="plainmulti">
    <xsl:if test="count(preceding-sibling::*) &gt; 0">, </xsl:if>
    <xsl:text>{ </xsl:text>
    <xsl:text>:</xsl:text>
    <xsl:value-of select="name()"/>
    <xsl:text> =&gt; </xsl:text>
    <xsl:choose>
      <xsl:when test="count(*) &gt; 0">
        <xsl:text>{</xsl:text>
        <xsl:apply-templates select="d:*" mode="plain"/>
        <xsl:text>}</xsl:text>
      </xsl:when>
      <xsl:when test="not(node())">
        <xsl:text>nil</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="substring(text(),1,1) = '!'">
            <xsl:value-of select="substring(text(),2)"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>"</xsl:text>
            <xsl:value-of select="str:replace(str:replace(text(),'\','\\'),'&quot;','\&quot;')"/>
            <xsl:text>"</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
    <xsl:text> }</xsl:text>
  </xsl:template>
  <xsl:template match="d:*" mode="simplemulti">
    <xsl:if test="count(preceding-sibling::*) &gt; 0">, </xsl:if>
    <xsl:text>:</xsl:text>
    <xsl:value-of select="name()"/>
    <xsl:text> =&gt; </xsl:text>
    <xsl:choose>
      <xsl:when test="count(*) &gt; 0">
        <xsl:text>{</xsl:text>
        <xsl:apply-templates select="d:*" mode="plain"/>
        <xsl:text>}</xsl:text>
      </xsl:when>
      <xsl:when test="not(node())">
        <xsl:text>nil</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="substring(text(),1,1) = '!'">
            <xsl:value-of select="substring(text(),2)"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>"</xsl:text>
            <xsl:value-of select="str:replace(str:replace(text(),'\','\\'),'&quot;','\&quot;')"/>
            <xsl:text>"</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  <xsl:template name="format-name">
    <xsl:param name="tname"/>
    <xsl:choose>
      <xsl:when test="contains($tname,'-')">
        <xsl:text>'</xsl:text>
        <xsl:value-of select="$tname"/>
        <xsl:text>'</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$tname"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  <xsl:template match="d:*" mode="sub">
    <xsl:if test="count(preceding-sibling::*) &gt; 0">, </xsl:if>
    <xsl:text>⭐(</xsl:text>
    <xsl:text>:name =&gt; :</xsl:text>
    <xsl:choose>
      <xsl:when test="substring(name(),1,1) = '_'">
        <xsl:call-template name="format-name">
          <xsl:with-param name="tname">
            <xsl:value-of select="substring(name(),2)"/>
          </xsl:with-param>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="format-name">
          <xsl:with-param name="tname">
            <xsl:value-of select="name()"/>
          </xsl:with-param>
        </xsl:call-template>
      </xsl:otherwise>
    </xsl:choose>
    <xsl:text>, :value =&gt; -&gt;{ </xsl:text>
    <xsl:choose>
      <xsl:when test="not(node())">
        <xsl:text>nil</xsl:text>
      </xsl:when>
      <xsl:when test="child::node()[not(self::text())]">
        <!-- FUUUU, there is probably much more TODO. Updated Matthias und Juergen, we tested for ing-opcua/execute -->
        <xsl:choose>
          <xsl:when test="child::* and name(child::*)=concat(name(.),'_item') and count(child::*[not(name()=name(../child::*[1]))])=0">
            <xsl:text>"[ </xsl:text>
            <xsl:apply-templates select="*" mode="JSONArrayItem"/>
            <xsl:text>]"</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>"{ </xsl:text>
            <xsl:apply-templates select="*" mode="JSONSUB"/>
            <xsl:text>}"</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="substring(text(),1,1) = '!'">
            <xsl:value-of select="substring(text(),2)"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>"</xsl:text>
            <xsl:value-of select="str:replace(str:replace(text(),'\','\\'),'&quot;','\&quot;')"/>
            <xsl:text>"</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
    <xsl:text> }</xsl:text>
    <xsl:for-each select="@*">
      <xsl:text>, :</xsl:text>
      <xsl:value-of select="name()"/>
      <xsl:text> =&gt; "</xsl:text>
      <xsl:value-of select="string(.)"/>
      <xsl:text>"</xsl:text>
    </xsl:for-each>
    <xsl:text>)</xsl:text>
  </xsl:template>

  <xsl:template match="d:finalize | d:update | d:prepare | d:rescue" mode="part-of-call">
    <xsl:param name="myspace"/>
    <xsl:call-template name="print-content">
      <xsl:with-param name="myspace">
        <xsl:value-of select="$myspace"/>
      </xsl:with-param>
    </xsl:call-template>
  </xsl:template>
  <xsl:template name="print-content">
    <xsl:param name="myspace"/>
    <xsl:if test="text()">
      <xsl:for-each select="str:tokenize(text(), '&#x0A;')">
        <xsl:value-of select="concat('&#x0A;',concat(str:padding($myspace+$myspacemultiplier+$myspacemultiplier),str:replace(str:replace(str:replace(string(.),'\','\\'),'&quot;','\&quot;'),'#','\#')))" />
      </xsl:for-each>
      <xsl:call-template name="print-newline"/>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:text>END</xsl:text>
    </xsl:if>
  </xsl:template>
  <xsl:template name="print-mcontent">
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
          <xsl:text>, &lt;&lt;-END</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:for-each select="str:tokenize(text(), '&#x0A;')">
        <xsl:value-of select="concat('&#x0A;',concat(str:padding($myspace+$myspacemultiplier+$myspacemultiplier),str:replace(str:replace(str:replace(string(.),'\','\\'),'&quot;','\&quot;'),'#','\#')))" />
      </xsl:for-each>
      <xsl:call-template name="print-newline"/>
      <xsl:call-template name="print-space">
        <xsl:with-param name="i">1</xsl:with-param>
        <xsl:with-param name="count">
          <xsl:value-of select="$myspace+$myspacemultiplier"/>
        </xsl:with-param>
      </xsl:call-template>
      <xsl:choose>
        <xsl:when test="@language='application/x-ruby'">
          <xsl:text>end</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>END</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
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

  <!-- JSON Element -->
  <xsl:template match="*" mode="JSON">
    <xsl:call-template name="JSONProperties"/>
    <xsl:choose>
      <xsl:when test="following-sibling::*">, </xsl:when>
      <xsl:otherwise><xsl:text> </xsl:text></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="*" mode="JSONSUB">
    <xsl:text>\"</xsl:text>
    <xsl:value-of select="name()"/>
    <xsl:text>\": </xsl:text>
    <xsl:call-template name="JSONProperties">
      <xsl:with-param name="parent" select="'Yes'"></xsl:with-param>
    </xsl:call-template>
    <xsl:choose>
      <xsl:when test="following-sibling::*">, </xsl:when>
      <xsl:otherwise><xsl:text> </xsl:text></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- JSON Array Element -->
  <xsl:template match="*" mode="JSONArrayElement">
    <xsl:call-template name="JSONProperties"/>
    <xsl:choose>
      <xsl:when test="following-sibling::*">, </xsl:when>
      <xsl:otherwise><xsl:text> </xsl:text></xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  <xsl:template match="*" mode="JSONArrayItem">
    <xsl:call-template name="JSONProperties">
      <xsl:with-param name="parent" select="'Yes'"></xsl:with-param>
    </xsl:call-template>
    <xsl:choose>
      <xsl:when test="following-sibling::*">, </xsl:when>
      <xsl:otherwise><xsl:text> </xsl:text></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- JSON Object Properties -->
  <xsl:template name="JSONProperties">
    <xsl:param name="parent"></xsl:param>
    <xsl:variable name="childName" select="name(*[1])"/>
    <xsl:choose>
      <xsl:when test="not(*|@*)">
        <xsl:choose>
          <xsl:when test="$parent='Yes'">
            <xsl:choose>
              <xsl:when test="string(number(.)) = .">
                <xsl:value-of select="."/>
              </xsl:when>
              <xsl:otherwise>
                <xsl:choose>
                  <xsl:when test="substring(.,1,1) = '!'">
                    <xsl:text>#{(</xsl:text>
                    <xsl:value-of select="substring(.,2)"/>
                    <xsl:text>).to_json}</xsl:text>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:text>\"</xsl:text>
                    <xsl:value-of select="str:replace(str:replace(.,'\','\\'),'&quot;','\\\&quot;')"/>
                    <xsl:text>\"</xsl:text>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>\"</xsl:text>
            <xsl:value-of select="name()"/>
            <xsl:text>\": </xsl:text>
            <xsl:choose>
              <xsl:when test="string(number(.)) = .">
                <xsl:value-of select="."/>
              </xsl:when>
              <xsl:otherwise>
                <xsl:text>\"</xsl:text>
                <xsl:choose>
                  <xsl:when test="substring(.,1,1) = '!'">
                    <xsl:text>#{</xsl:text>
                    <xsl:value-of select="str:replace(str:replace(substring(.,2),'\','\\'),'&quot;','\\\&quot;')"/>
                    <xsl:text>}</xsl:text>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="str:replace(str:replace(.,'\','\\'),'&quot;','\\\&quot;')"/>
                  </xsl:otherwise>
                </xsl:choose>
                <xsl:text>\"</xsl:text>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:when test="count(*[name()=$childName]) > 1">
        <xsl:text>{ \"</xsl:text>
        <xsl:value-of select="$childName"/>
        <xsl:text>\": [ </xsl:text>
        <xsl:apply-templates select="*" mode="JSONArrayElement"/>
        <xsl:text>] }</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:if test="text()[normalize-space(.)]">
          <xsl:text>[ </xsl:text>
        </xsl:if>
        <xsl:text>{ </xsl:text>
        <xsl:apply-templates select="@*" mode="JSONSUB"/>
        <xsl:apply-templates select="*" mode="JSONSUB"/>
        <xsl:text>}</xsl:text>
        <xsl:if test="text()[normalize-space(.)]">
          <xsl:text>, </xsl:text>
          <xsl:text>\"</xsl:text>
          <xsl:choose>
            <xsl:when test="substring(.,1,1) = '!'">
              <xsl:text>#{</xsl:text>
              <xsl:value-of select="str:replace(str:replace(substring(.,2),'\','\\'),'&quot;','\\\&quot;')"/>
              <xsl:text>}</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select="str:replace(str:replace(.,'\','\\'),'&quot;','\\\&quot;')"/>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:text>\"</xsl:text>
          <xsl:text>]</xsl:text>
        </xsl:if>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- JSON Attribute Property -->
  <xsl:template match="@*" mode="JSONSUB">
    <xsl:text>\"@</xsl:text>
    <xsl:value-of select="name()"/>
    <xsl:text>\": </xsl:text>
    <xsl:choose>
      <xsl:when test="number(.) = .">
        <xsl:value-of select="."/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>\"</xsl:text>
        <xsl:choose>
          <xsl:when test="substring(.,1,1) = '!'">
            <xsl:text>#{</xsl:text>
            <xsl:value-of select="str:replace(str:replace(substring(.,2),'\','\\'),'&quot;','\\\&quot;')"/>
            <xsl:text>}</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="str:replace(str:replace(.,'\','\\'),'&quot;','\\\&quot;')"/>
          </xsl:otherwise>
        </xsl:choose>
        <xsl:text>\"</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
    <xsl:choose>
      <xsl:when test="not(position() = last())">
        <xsl:text>, </xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text> </xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
</xsl:stylesheet>
