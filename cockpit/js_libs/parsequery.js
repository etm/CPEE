jQuery.parseQuery = function(qs) {                                                                                                                                                                                                                                   
  var q = (typeof qs === 'string' ? qs : window.location.search);
  var ret = [];
  q.replace(/#.*$/,'');
  q.replace(/([^?&=]+)=?([^&]*)(?:&+|$)/g, function(match, key, value) {
    ret.push( { 'name': decodeURIComponent(key.replace(/\+/g,' ')), 'value': decodeURIComponent(value.replace(/\+/g,' ')) });
  });
  return ret;
}
jQuery.parseQuerySimple = function(querystring) {
  var q = jQuery.parseQuery(querystring);
  var ret = {};
  jQuery.each(q,function(k,v){
    ret[v.name] = v.value;
  });
  return ret;
}
jQuery.parseFragment = function(querystring) {
  return window.location.hash;
}

