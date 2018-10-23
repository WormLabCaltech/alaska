function handle(data) {
    var error = "Error"
    $("p").text(data);
};

function testAjax(handleData) {
  $.ajax({
    type: "POST",
    url: "test.php",
    success:function(data) {
      handleData(data);
    }
  });
};

$(document).ready(function() {
    $("#submit").click(function() {
        testAjax(handle);
    });
});
