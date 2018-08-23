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
    $('#new_proj_btn_span').popover('hide');
    $('#new_proj_btn_span').popover('disable');
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
 * Set loading spinner in given span/div.
 */
function set_loading_spinner(button, spinner) {
  button.prop('disabled', true);

  // First, figure out by how much the button needs to be lengthened.
  var width = button.width();
  var obj = {width: 0};

  // Do the transformation.
  var transform = anime({
    targets: obj,
    width: spinner.outerWidth(true),
    round: 1,
    easing: 'easeInOutQuart',
    update: function() {
      button.width(width + obj.width);
    },
    complete: function(anim) {
      spinner.show();
    }
  });
}

/**
 * Retrieve project id (which is also the ftp login) and ftp password
 * from output of new_proj.
 */
function get_id_pw(response) {
  // Split response to lines.
  var split = response.split('\n');

  // Get third-to-last string.
  split.pop();
  split.pop();
  var line = split.pop();

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
 * Show ftp info.
 */
function show_ftp_info(id, pw) {
  var ftp_div = $('#ftp_info_div');

  // First, set the project id and ftp info before showing.
  $('#proj_id').text(id);
  $('#ftp_id').text(id);
  $('#ftp_pw').text(pw);

  // Show the div.
  ftp_div.show();

  // Then, scroll to it.
  var obj = {pos: $(window).scrollTop()};
  var target = ftp_div.offset().top - $('#navbar_nav').outerHeight(true);
  var max = $(document).height() - $(window).height();

  // If the max scroll is smaller than the target, override target.
  if (max < target) {
    target = max;
  }

  // console.log(obj.pos + ' ' + target);

  // Scroll smoothly.
  var transform = anime({
    targets: obj,
    pos: target,
    round: 1,
    easing: 'easeInOutQuart',
    update: function() {
      $(window).scrollTop(obj.pos);
    }
  });
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

  // Show the loading spinner.
  var button = $('#new_proj_btn');
  var spinner = $('#loading_spinner');
  set_loading_spinner(button, spinner);

  // Send new project request.
  // submit ajax request
  $.ajax({
    type: 'POST',
    url: 'cgi_request.php',
    data: { action: 'new_proj' },
    success:function(out) {
      console.log(out);
      id_pw = get_id_pw(out);

      // Once we have an id and pw, stop the loading spinner.
      spinner.hide();
      $('#success_check').show();

      // Then, show ftp info.
      show_ftp_info(id_pw.id, id_pw.pw);
    }
  });
}

/**
 * Get the md5 sum of the given file.
 */
function get_md5(path) {

}

/**
 * Set raw reads table.
 */
function set_raw_reads_table(reads) {
  var row_id = 'raw_reads_table_row_num';
  var folder_id = 'folder_num';
  var filename_id = 'filename_num';
  var size_id = 'size_num';
  var md5_id = 'md5_num';

  // Loop through each read and add rows.
  for (var i = 0; i < reads.length; i++) {
    // Get values from reads array.
    var folder = reads[i].folder;
    var filename = reads[i].filename;
    var size = reads[i].size;
    var path = reads[i].path;

    var new_row_id = row_id.replace('num', i);
    var new_folder_id = folder_id.replace('num', i);
    var new_filename_id = filename_id.replace('num', i);
    var new_size_id = size_id.replace('num', i);
    var new_md5_id = md5_id.replace('num', i);

    var row = $('#' + row_id).clone();

    // Set row id.
    row.attr('id', row_id.replace('num', i));

    // Replace children id's.
    row.children('#' + folder_id).attr('id', new_folder_id);
    row.children('#' + filename_id).attr('id', new_filename_id);
    row.children('#' + size_id).attr('id', new_size_id);
    row.children('#' + md5_id).attr('id', new_md5_id);

    // Then, set the values.
    row.children('#' + new_folder_id).text(folder);
    row.children('#' + new_filename_id).text(filename);
    row.children('#' + new_size_id).text(size);

    // Append the row to the table.
    $('#raw_reads_table').append(row);

    // Calculate md5 sum.

  }

}

/**
 * Parse fetch_reads output.
 */
function parse_reads(out) {
  // Split by the array brackets
  var split = out.split('[');
  var split2 = split[1].split(']');

  // Then, we have the raw json dump.
  var dump = '[' + split2[0] + ']';

  // Then, parse into json.
  var reads = JSON.parse(dump);

  // Pass on the parsed reads to set the table values.
  set_raw_reads_table(reads);
}

/**
 * Fetch files in raw reads folder.
 */
function fetch_reads() {
  var proj_id = $('#proj_id').text();

  // Send fetch_reads request.
  $.ajax({
    type: 'POST',
    url: 'cgi_request.php',
    data: {
      action: 'fetch_reads',
      id: proj_id
    },
    success:function(out) {
      console.log(out);
      parse_reads(out);
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

  // Add on click handler for fetch reads button.
  $('#fetch_reads_btn').click(fetch_reads);

  // Fetch server status.
  get_server_status();
});