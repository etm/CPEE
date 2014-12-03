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
        this.each(function() {
            out += XML(xs.serializeToString(this)).toXMLString();
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
