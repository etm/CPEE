$(document).ready(function() {
  $(document).on('keypress','#prompt',function(e){
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      let input = $(this);
      let text = this.innerText;
      console.log(text);
      input.empty();
    }
  });
});
