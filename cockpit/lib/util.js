$.fn.serializeXML = function () {
    var out = '';
    if (typeof XMLSerializer == 'function') {
        var xs = new XMLSerializer();
        this.each(function() {
            out += xs.serializeToString(this);
        });
    } else if (this[0] && this[0].xml != 'undefined') {
        this.each(function() {
            out += this.xml;
        });
    }
    return out;
};
$.fn.serializePrettyXML = function () {
    var out = '';
    if (typeof XMLSerializer == 'function') {
        var xs = new XMLSerializer();
        var xsl = $.parseXML('<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:output omit-xml-declaration="yes" indent="yes"/><xsl:template match="node()|@*"><xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy></xsl:template></xsl:stylesheet>');
        var ex;
        this.each(function() {
          if (window.ActiveXObject) {
            // code for IE
            ex = this.transformNode(xsl);
          } else if (document.implementation && document.implementation.createDocument) {
            // code for Chrome, Firefox, Opera, etc.
            xsltProcessor = new XSLTProcessor();
            xsltProcessor.importStylesheet(xsl);
            ex = xsltProcessor.transformToFragment(this, document);
          }
          out += xs.serializeToString(ex);
          console.log(out);
        });
    } else if (this[0] && this[0].xml != 'undefined') {
        this.each(function() {
            out += this.xml;
        });
    }
    return out;
};

String.prototype.repeat = function(num) {
  return new Array(num + 1).join(this);
};

String.prototype.unserialize = function() {
  var data = this.split("&");
  var ret = new Array();
  $.each(data, function(){
      var properties = this.split("=");
      ret.push([properties[0], properties[1]]);
  });
  return ret;
};

$X = function(xmlstr) {
  return $($.parseXML(xmlstr).documentElement);
};
