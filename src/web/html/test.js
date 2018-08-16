$("#submit").click();

function handleData(data) {
    var error = "ERROR"
    if (data.indexOf(error) != -1) {
        $("p").text("server is off")
    } else {
        $("p").text("server is on :)")
    }
}

function testAjax(handleData) {
  $.ajax({
    url: "/alaska/scripts/cgi_request.sh new_proj",
    success:function(data) {
      handleData(data);
    }
  });
}