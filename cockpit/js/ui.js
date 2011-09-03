$(document).ready(function() {
  if (!($.browser.mozilla && parseInt($.browser.version) >= 6)) {
    $('body').children().remove();
    $('body').append('Sorry, only Firefox >= 6.0 for now.<br/>Chrom(ium|e) support will be added as soon as websocket >= hybi-08 is working (14.x ?).');
  }  
  $('#detailcolumn').resizable({ handles: { 'w' : '#handle2'}});
  $('#parameters .tabbelow').resizable({ handles: { 's' : '#handle1'}});

  $('#dat_dataelements input').live('keypress',function(e){
    if (e.keyCode == 40) {  //{{{
      var next = false;
      $('#dat_dataelements input.' + $(e.target).attr('class')).each(function(){
        if (next) { this.focus(); return false; }
        if (this == e.target) next = true;
      });
    } //}}}
    if (e.keyCode == 38) {  //{{{
      var prev = null;
      $('#dat_dataelements input.' + $(e.target).attr('class')).each(function(){
        if (this == e.target) {
          if (prev) prev.focus();
          return false;
        }
        prev = this;
      });
    } //}}}
    if (e.keyCode == 37 && $(e.target).caret().start == 0) {  //{{{
      var prev = null;
      $('#dat_dataelements input').each(function(){
        if (this == e.target) {
          if (prev) prev.focus();
          return false;
        }
        prev = this;
      });
    } //}}}
    if (e.keyCode == 39 && $(e.target).caret().end == $(e.target).val().length) {  //{{{
      var next = false;
      $('#dat_dataelements input').each(function(){
        if (next) { this.focus(); return false; }
        if (this == e.target) next = true;
      });
    } //}}}

    if (e.which == 100 && e.ctrlKey == true) { // Ctrl-D -> Delete Entry //{{{
      console.log('haller');
      return false;
    } //}}}
    if (e.which == 110 && e.ctrlKey == true) { // Ctrl-N -> New Entry //{{{
      console.log('haller');
      return false;
    } //}}}
    if (e.which == 115 && e.ctrlKey == true) { // Ctrl-S -> Save Entries //{{{
      console.log('haller');
      return false;
    } //}}}
  });

  $('#dat_endpoints input').live('keypress',function(e){
    if (e.keyCode == 40) {  //{{{
      var next = false;
      $('#dat_endpoints input.' + $(e.target).attr('class')).each(function(){
        if (next) { this.focus(); return false; }
        if (this == e.target) next = true;
      });
    } //}}}
    if (e.keyCode == 38) {  //{{{
      var prev = null;
      $('#dat_endpoints input.' + $(e.target).attr('class')).each(function(){
        if (this == e.target) {
          if (prev) prev.focus();
          return false;
        }
        prev = this;
      });
    } //}}}
    if (e.keyCode == 37 && $(e.target).caret().start == 0) {  //{{{
      var prev = null;
      $('#dat_endpoints input').each(function(){
        if (this == e.target) {
          if (prev) prev.focus();
          return false;
        }
        prev = this;
      });
    } //}}}
    if (e.keyCode == 39 && $(e.target).caret().end == $(e.target).val().length) {  //{{{
      var next = false;
      $('#dat_endpoints input').each(function(){
        if (next) { this.focus(); return false; }
        if (this == e.target) next = true;
      });
    } //}}}

    if (e.which == 100 && e.ctrlKey == true) { // Ctrl-D -> Delete Entry //{{{
      console.log('haller');
      return false;
    } //}}}
    if (e.which == 110 && e.ctrlKey == true) { // Ctrl-N -> New Entry //{{{
      console.log('haller');
      return false;
    } //}}}
    if (e.which == 115 && e.ctrlKey == true) { // Ctrl-S -> Save Entries //{{{
      console.log('haller');
      return false;
    } //}}}
  });


});
