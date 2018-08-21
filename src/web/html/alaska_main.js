/**
 * Summary. (use period)
 *
 * Description. (use period)
 *
 * @link   URL
 * @file   This files defines the MyClass class.
 * @author AuthorName.
 * @since  x.x.x
 */

/**
 * Sets the server status badge to either online or offline.
 *
 * @param {bool}  on  Whether the server is on.
 */
function set_badge(on) {
  $('#server_status_badge').removeClass();
  $('#server_status_badge').addClass('badge');
  $('#server_status_badge').addClass('badge-pill');
  if (on) {
    $('#server_status_badge').addClass('badge-success');
    $('#server_status_badge').text('Online');

    // Now that it's online, enable the new project button!
    $('#new_proj_btn').css('pointer-events', 'auto');
    $('#new_proj_btn').prop('disabled', false);

    // remove popover
    $('#new_proj_btn_span').popover('dispose');

  } else {
    $('#server_status_badge').addClass('badge-danger');
    $('#server_status_badge').text('Offline');
  }
}

/**
 * Get the server status and set the badge accordingly.
 *
 * This function sends an ajax request to run cgi_request.php
 * and checks whether the server is active. Depending on
 * what the php script outputs, this function sets the
 * server status badge.
 *
 */
function get_server_status() {
  // show loading badge
  // $('#server_status_badge').removeClass();
  // $('#server_status_badge').addClass('badge');
  // $('#server_status_badge').addClass('badge-pill');
  // $('#server_status_badge').addClass('badge-warning');
  // $('#server_status_badge').addClass('flash');
  // $('#server_status_badge').addClass('infinite');

  // submit ajax request
  $.ajax({
    type: 'POST',
    url: 'cgi_request.php',
    data: { action: 'is_online' },
    success:function(out) {
      console.log(out);
      if (out.includes("true")) {
        set_badge(true);
      } else {
        set_badge(false);
      }
    }
  });
}

/**
 * Retrieve project id (which is also the ftp login) and ftp password
 * from output of new_proj.
 */
function get_id_pw(response) {
  console.log(out);

  // Split response to lines.
  var split = response.split('\n');
  console.log(split);

  // Get second-to-last string.
  split.pop();
  var line = split.pop();
  console.log(line);

  // Split with colon to get the id.
  var split2 = line.split(':');
  var id = split2[0];

  // Split the second split2 with space to fetch password.
  var split3 = split2[1].split(' ');
  var pw = split3.pop();

  // Create dict to return.
  var result = {
    'id': id,
    'pw': pw
  };

  console.log('id: ' + id + '\n');
  console.log('pw: ' + pw + '\n');

  return result;
}

/**
 * Start a new project.
 * The response from this button depends on whether the server is online or
 * offline.
 */
function new_proj() {
  // First, get text of server status span.
  var status = $('#server_status_badge').text().toLowerCase();

  // Note: we don't have to check whether the server is online because
  // the "new project" button is only enabled when the server is on.

  // Send new project request.
  // submit ajax request
  $.ajax({
    type: 'POST',
    url: 'cgi_request.php',
    data: { action: 'new_proj' },
    success:function(out) {
      id_pw = get_id_pw(out);
    }
  });
}

// To run when page is loaded.
$(document).ready(function() {
  // initialize tooltips
  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  });

  // initialize popovers
  $(function () {
    $('[data-toggle="popover"]').popover()
  })

  // Add on click handler for start project button.
  $('#new_proj_btn').click(new_proj);

  // Fetch server status.
  get_server_status();
});
