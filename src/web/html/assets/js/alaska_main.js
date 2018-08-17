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
 * Make a new ftp username and password.
 */
function make_ftp(username, password) {

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
        console.log(out);
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
