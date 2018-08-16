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
    if (on) {
      $('#server_status_badge').addClass('badge-success');
    } else {
      $('#server_status_badge').addClass('badge-danger');
    }
    $('#server_status_badge').removeClass('badge-primary');
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
  // submit ajax request
  $.ajax({
    type: 'POST',
    url: 'cgi_request.php',
    data: { action: 'check' },
    success:function(out) {
      console.log(out);
      if (out == 'true') {
        set_badge(true);
      } else {
        set_badge(false);
      }
    }
  });
}
