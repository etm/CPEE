    <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:d="http://cpee.org/ns/description/1.0">
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
          <xsl:choose>
            <xsl:when test="@lay">
              <xsl:text>activity [:</xsl:text>
              <xsl:value-of select="@id"/>
              <xsl:text>,</xsl:text>
              <xsl:value-of select="@lay"/>
              <xsl:text>]</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>activity :</xsl:text>
              <xsl:value-of select="@id"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:if>
        <xsl:if test="name()='call'">
          <xsl:text>, :call, :</xsl:text>
          <xsl:value-of select="@endpoint"/>
          <xsl:apply-templates select="d:parameters"/>
          <xsl:apply-templates select="d:manipulate" mode="part-of-call">
            <xsl:with-param name="myspace"><xsl:value-of select="$myspace"/></xsl:with-param>
          </xsl:apply-templates>
          <xsl:call-template name="print-newline"/>
        </xsl:if>
        <xsl:if test="name()='manipulate'">
          <xsl:text>, :manipulate</xsl:text>
          <xsl:call-template name="print-content">
            <xsl:with-param name="myspace"><xsl:value-of select="$myspace"/></xsl:with-param>
          </xsl:call-template>
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
            <xsl:text>pre_test{</xsl:text>
            <xsl:value-of select="@pre_test"/>
            <xsl:text>} </xsl:text>
          </xsl:if>
          <xsl:if test="@post_test">
            <xsl:text>post_test{</xsl:text>
            <xsl:value-of select="@post_test"/>
            <xsl:text>} </xsl:text>
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
          <xsl:text>choose do</xsl:text>
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
        <xsl:value-of select="@condition"/>
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
        <xsl:text>, :</xsl:text>
        <xsl:value-of select="name()"/>
        <xsl:text> => </xsl:text>
        <xsl:choose>
          <xsl:when test="count(*) > 0">
            <xsl:text>[</xsl:text>
            <xsl:apply-templates select="d:*" mode="sub-parameter"/>
            <xsl:text>]</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>"</xsl:text>
            <xsl:value-of select="text()"/>
            <xsl:text>"</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:template>

      <xsl:template match="d:*" mode="sub-parameter">
        <xsl:text> { :</xsl:text>
        <xsl:value-of select="name()"/>
        <xsl:text> => </xsl:text>
        <xsl:value-of select="text()"/>
        <xsl:text> }</xsl:text>
        <xsl:choose>
          <xsl:when test=". = ../*[last()]">
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
          <xsl:text> do </xsl:text>
          <xsl:if test="@output">
            <xsl:text>|</xsl:text>
            <xsl:value-of select="@output"/>
            <xsl:text>|</xsl:text>
          </xsl:if>
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
