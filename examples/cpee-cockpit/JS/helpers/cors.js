jQuery.extend({

  corsSettings: {
    url: location.href,
    type: "GET",
    processData: true,
  },

  cors: function(origSettings) {
    try {
      var s = jQuery.extend(true, {}, jQuery.corsSettings, origSettings);
      var req = new XMLHttpRequest();
      var type = s.type.toUpperCase();
      var rquery = /\?/;

      if (s.data && s.processData && typeof s.data !== "string") {
        s.data = jQuery.param(s.data, s.traditional);
      }
      if (s.data && type === "GET") {
        s.url += (rquery.test(s.url) ? "&" : "?") + s.data;
      }
      
      req.open(type, s.url, true);
      if (type === "POST" || type === "PUT" || type === "DELETE") {
        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      }  

      req.onreadystatechange = function (e) {
        if (req.readyState === 4) {
          if(req.status === 200) {
            if (s.success)
              s.success(jQuery.httpData(req, s.dataType, s));
          } else {
            if (s.failure)
              s.failure(type + " to " + s.url + " failed");
          }
        }
      };
      req.send(type === "POST" || type === "PUT" || type === "DELETE" ? s.data : null);
    } catch(e) {
      alert(e.toString());
      alert("You have to use Firefox, sorry.");
    }
  }

});
