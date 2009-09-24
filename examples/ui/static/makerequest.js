function makeRequest(method, url, success, failure) {
  var req = new XMLHttpRequest();
  req.open(method, url, true);
  req.onreadystatechange = function (e) {
    if (req.readyState === 4) {
      if(req.status === 200) {
        success(req.responseText);
      } else {
        failure("method "+method+" to "+url+" failed");
      }
      method
    }
  };  
  req.send(null);
}
