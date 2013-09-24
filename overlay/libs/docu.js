//<![CDATA[
  function rathian(){
    var doc_table = $('#resource_doc');
    $.ajax({
      url: "?riddl-resource-description",
      dataType: 'xml',
      success: function(data){
        var rc = $(data).find('resource');
        var rc_chi = rc.children();
        var cook = new Object;
        cook.zahl = 1;
        rc_chi.each(function(){
          var ns_uri = this.namespaceURI;
          if(ns_uri=="http://riddl.org/ns/description/1.0")
            return true;
          console.log(this.namespaceURI);
          
          doc_table.append("<h1>"+this.innerHTML+"</h1>");
        });
      }  
    });
  }

//]]>  
