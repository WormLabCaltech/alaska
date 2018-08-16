function handle(data) {
    var error = "Error"
    if (data.indexOf(error) != -1) {
        $("p").text("server is off");
    } else {
        $("p").text("server is on :)");
    }
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


