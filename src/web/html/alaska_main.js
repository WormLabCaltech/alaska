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
 * Go to ftp upload page.
 */
function goto_ftp_info() {
  $('#success_check').show();
  $('#new_proj_btn').prop('disabled', true);

  // Send ajax request to get ftp password again.
  $.ajax({
    type: 'POST',
    url: 'cgi_request.php',
    data: {
      action: 'get_ftp_info',
      id: proj_id
    },
    success:function(out) {
      console.log(out);
      // Parse pw.
      var split = out.split('\n');
      var pw = split[split.length - 3];
      show_ftp_info(proj_id, pw);
    }
  });
}

/**
 * Goto raw reads.
 */
function goto_raw_reads() {
  // Disable fetch reads button.
  $('#fetch_reads_btn').prop('disabled', true);

  goto_ftp_info();
  refetch_reads();
}

/**
 * Go to meta input page.
 */
function goto_meta_input() {
  read_proj();
}

/**
 * Go to analysis progress page.
 */
function goto_progress(status) {
  $('#meta_container').hide();
  $('#main_content_div').hide();
  $('#ftp_info_div').hide();
  $('#raw_reads_div').hide();
  $('#fetch_failed_div').hide();

  // Set output listeners for live output.
  set_output_listeners();

  // Set multiqc report button listener.
  $('#qc_report_btn').click(function () {
      window.open('multiqc_report.php?id=' + proj_id, '_blank');
  });

  // Set download button listeners.
  $('#qc_download_btn').click(function () {
      window.open('download.php?id=' + proj_id + '&type=qc', '_blank');
  });
  $('#quant_download_btn').click(function () {
      window.open('download.php?id=' + proj_id + '&type=quant', '_blank');
  });
  $('#diff_download_btn').click(function () {
      window.open('download.php?id=' + proj_id + '&type=diff', '_blank');
  });

  // Set sleuth server open button listener.
  $('#diff_server_btn').click(function () {
    $.ajax({
      type: 'POST',
      url: 'cgi_request.php',
      data: {
        id: proj_id,
        action: 'open_sleuth_server'
      },
      success:function(out) {
        console.log(out);
        var split = out.split('\n');
        var line = split[split.length - 3];
        var split2 = line.split(' ');
        var port = parseInt(split2[split2.length - 1]);

        console.log(port);

        var url = 'http://' + window.location.hostname + ':' + port + '/';
        window.open(url, '_blank');
      }
    });
  });

  // Set the progress page to the given progress.
  set_progress(status);

  // Then, call update_progress regularly.
  project_progress_interval = setInterval(update_progress, 3000);
}

function get_output(type, textarea) {
  $.ajax({
    type: 'POST',
    url: 'get_output.php',
    data: {
      'type': type,
      'id': proj_id
    },
    success:function(out) {
      textarea.val(out);
      textarea.scrollTop(textarea[0].scrollHeight);
    }
  });

}

/**
 * Sets listeners for each of the three live output views.
 */
function set_output_listeners() {
  var qc_output_collapse = $('#qc_output_collapse');
  var quant_output_collapse = $('#quant_output_collapse');
  var diff_output_collapse = $('#diff_output_collapse');
  var qc_textarea = $('#qc_textarea');
  var quant_textarea = $('#quant_textarea');
  var diff_textarea = $('#diff_textarea');

  // qc textarea
  qc_output_collapse.on('show.bs.collapse', {
    textarea: qc_textarea
  }, function (e) {
    var textarea = e.data.textarea;
    qc_output_interval = setInterval(get_output, 1000, 'qc', textarea);
  });
  qc_output_collapse.on('hide.bs.collapse', function () {
    clearInterval(qc_output_interval);
  });

  // quant textarea
  quant_output_collapse.on('show.bs.collapse', {
    textarea: quant_textarea
  }, function (e) {
    var textarea = e.data.textarea;
    quant_output_interval = setInterval(get_output, 1000, 'quant', textarea);
  });
  quant_output_collapse.on('hide.bs.collapse', function () {
    clearInterval(quant_output_interval);
  });

  // diff textarea
  diff_output_collapse.on('show.bs.collapse', {
    textarea: diff_textarea
  }, function (e) {
    var textarea = e.data.textarea;
    diff_output_interval = setInterval(get_output, 1000, 'diff', textarea);
  });
  diff_output_collapse.on('hide.bs.collapse', function () {
    clearInterval(diff_output_interval);
  });
}

/**
 * Update progress.
 */
function update_progress() {
  $.ajax({
    type: 'POST',
    url: 'cgi_request.php',
    data: {
      action: 'get_proj_status',
      id: proj_id
    },
    success:function(out) {
      console.log(out);
      update_proj_status(out);
    }
  });
}

/**
 * Helper function to parse output.
 */
function update_proj_status(out) {
  var split = out.split('\n');
  var status = parseInt(split[split.length - 3]);

  set_progress(status);

  if (status >= progress.diff_finished) {
    clearInterval(project_progress_interval);
  }
}

/**
 * Sets the progress page to the given status.
 * This function assumes the project has been queued.
 */
function set_progress(status) {
  var progress_container = $('#progress_container');
  var project_status_badge = progress_container.find('#project_status_badge');
  var project_download_btn = progress_container.find('#project_download_btn');

  // Set the project status badge
  if (status >= progress.diff_finished) {
    set_progress_badge(project_status_badge, 'finished');
    project_download_btn.prop('disabled', false);
  } else if (status >= progress.qc_started) {
    set_progress_badge(project_status_badge, 'started');
    project_download_btn.prop('disabled', true);
  } else {
    set_progress_badge(project_status_badge, 'queued');
    project_download_btn.prop('disabled', true);
  }

  ids = [
    'qc_status_badge',
    'qc_output_btn',
    'qc_report_btn',
    'qc_download_btn',
    'qc_output_collapse',
    'quant_status_badge',
    'quant_output_btn',
    'quant_download_btn',
    'quant_output_collapse',
    'diff_status_badge',
    'diff_output_btn',
    'diff_server_btn',
    'diff_download_btn',
    'diff_output_collapse'
  ];

  // Construct elements dictionary
  elements = {};
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    elements[id] = progress_container.find('#' + id);
  }

  // Deal with enabling buttons first.
  switch (status) {
    case progress.server_open:
    case progress.diff_finished:
      elements.diff_server_btn.prop('disabled', false);
      elements.diff_download_btn.prop('disabled', false);
    case progress.diff_started:
      elements.diff_output_btn.prop('disabled', false);
    case progress.diff_queued:
    case progress.quant_finished:
      elements.quant_download_btn.prop('disabled', false);
    case progress.quant_started:
      elements.quant_output_btn.prop('disabled', false);
    case progress.quant_queued:
    case progress.qc_finished:
      elements.qc_download_btn.prop('disabled', false);
      elements.qc_report_btn.prop('disabled', false);
    case progress.qc_started:
      elements.qc_output_btn.prop('disabled', false);
  }

  // Then, disable everything after.
  switch (status) {
    case progress.finalized:
    case progress.qc_queued:
      elements.qc_output_btn.prop('disabled', true);
    case progress.qc_started:
      elements.qc_report_btn.prop('disabled', true);
      elements.qc_download_btn.prop('disabled', true);
    case progress.qc_finished:
    case progress.quant_queued:
      elements.quant_output_btn.prop('disabled', true);
    case progress.quant_started:
      elements.quant_download_btn.prop('disabled', true);
    case progress.quant_finished:
    case progress.diff_queued:
      elements.diff_output_btn.prop('disabled', true);
    case progress.diff_started:
      elements.diff_download_btn.prop('disabled', true);
      elements.diff_server_btn.prop('disabled', true);
  }


  // Finally, set status badges.
  if (status < progress.qc_started) {
    set_progress_badge(elements.qc_status_badge, 'queued');
    set_progress_badge(elements.quant_status_badge, 'queued');
    set_progress_badge(elements.diff_status_badge, 'queued');
  } else if (status < progress.quant_started) {
    set_progress_badge(elements.quant_status_badge, 'queued');
    set_progress_badge(elements.diff_status_badge, 'queued');
  } else if (status < progress.diff_started) {
    set_progress_badge(elements.diff_status_badge, 'queued');
  }

  if (status >= progress.diff_finished) {
    set_progress_badge(elements.qc_status_badge, 'finished');
    set_progress_badge(elements.quant_status_badge, 'finished');
    set_progress_badge(elements.diff_status_badge, 'finished');

    // Stop live output refreshing.
    elements.qc_output_collapse.off('show.bs.collapse');
    elements.qc_output_collapse.off('hide.bs.collapse');
    elements.quant_output_collapse.off('show.bs.collapse');
    elements.quant_output_collapse.off('hide.bs.collapse');
    elements.diff_output_collapse.off('show.bs.collapse');
    elements.diff_output_collapse.off('hide.bs.collapse');
  } else if (status >= progress.quant_finished) {
    set_progress_badge(elements.qc_status_badge, 'finished');
    set_progress_badge(elements.quant_status_badge, 'finished');

    // Stop live output refreshing.
    elements.qc_output_collapse.off('show.bs.collapse');
    elements.qc_output_collapse.off('hide.bs.collapse');
    elements.quant_output_collapse.off('show.bs.collapse');
    elements.quant_output_collapse.off('hide.bs.collapse');
  } else if (status >= progress.qc_finished) {
    set_progress_badge(elements.qc_status_badge, 'finished');

    // Stop live output refreshing.
    elements.qc_output_collapse.off('show.bs.collapse');
    elements.qc_output_collapse.off('hide.bs.collapse');
  }
  switch (status) {
    case progress.qc_started:
      set_progress_badge(elements.qc_status_badge, 'started');
      break;
    case progress.quant_started:
      set_progress_badge(elements.quant_status_badge, 'started');
      break;
    case progress.diff_started:
      set_progress_badge(elements.diff_status_badge, 'started');
      break;
  }
}

/**
 * Sets status badge to a certain state.
 */
function set_progress_badge(badge, state) {
  // Reset badge.
  badge.removeClass('badge-secondary badge-info badge-success badge-danger');
  badge.removeClass('flash animated infinite')

  switch (state) {
    case 'queued':
      badge.addClass('badge-secondary');
      badge.text('Queued');
      break;
    case 'started':
      badge.addClass('badge-info');
      badge.addClass('flash animated infinite');
      badge.text('Running');
      break;
    case 'finished':
      badge.addClass('badge-success');
      badge.text('Success');
      break;
    case 'error':
    default:
      badge.addClass('badge-danger');
      badge.text('Error');
  }
}

/**
 * Set progress bar to queued.
 */
function set_progress_bar_queued() {
  var bar = $('#progress_bar');
  var queued = bar.children('#queued');
  var qc = bar.children('#qc');
  var quant = bar.children('#quant');
  var diff = bar.children('#diff');
  var done = bar.children('#done');

  bar.children().removeClass('progress-bar-striped progress-bar-animated');

  // Set queued classes.
  queued.removeClass('bg-secondary border-right border-dark');
  queued.addClass('bg-dark progress-bar-striped progress-bar-animated');

  // Set qc classes.
  qc.removeClass('bg-warning');
  qc.addClass('bg-secondary border-right border-dark');

  // Set quant classes.
  quant.removeClass('bg-info');
  quant.addClass('bg-secondary border-right border-dark');

  // Set diff classes.
  diff.removeClass('bg-danger');
  diff.addClass('bg-secondary border-right border-dark');

  // Set done classes.
  done.removeClass('bg-success');
  done.addClass('bg-secondary');
}

/**
 * Set progress bar to quality control.
 */
function set_progress_bar_qc() {
  var bar = $('#progress_bar');
  var queued = bar.children('#queued');
  var qc = bar.children('#qc');
  var quant = bar.children('#quant');
  var diff = bar.children('#diff');
  var done = bar.children('#done');

  bar.children().removeClass('progress-bar-striped progress-bar-animated');

  // Set queued classes.
  queued.removeClass('bg-secondary border-right border-dark');
  queued.addClass('bg-dark');

  // Set qc classes.
  qc.removeClass('bg-secondary border-right border-dark');
  qc.addClass('bg-warning progress-bar-striped progress-bar-animated');

  // Set quant classes.
  quant.removeClass('bg-info');
  quant.addClass('bg-secondary border-right border-dark');

  // Set diff classes.
  diff.removeClass('bg-danger');
  diff.addClass('bg-secondary border-right border-dark');

  // Set done classes.
  done.removeClass('bg-success');
  done.addClass('bg-secondary');
}

/**
 * Set progress bar to alignment & quantification.
 */
function set_progress_bar_quant() {
  var bar = $('#progress_bar');
  var queued = bar.children('#queued');
  var qc = bar.children('#qc');
  var quant = bar.children('#quant');
  var diff = bar.children('#diff');
  var done = bar.children('#done');

  bar.children().removeClass('progress-bar-striped progress-bar-animated');

  // Set queued classes.
  queued.removeClass('bg-secondary border-right border-dark');
  queued.addClass('bg-dark');

  // Set qc classes.
  qc.removeClass('bg-secondary border-right border-dark');
  qc.addClass('bg-warning');

  // Set quant classes.
  quant.removeClass('bg-secondary border-right border-dark');
  quant.addClass('bg-info progress-bar-striped progress-bar-animated');

  // Set diff classes.
  diff.removeClass('bg-danger');
  diff.addClass('bg-secondary border-right border-dark');

  // Set done classes.
  done.removeClass('bg-success');
  done.addClass('bg-secondary');
}

/**
 * Set progress bar to diff exp
 */
function set_progress_bar_diff() {
  var bar = $('#progress_bar');
  var queued = bar.children('#queued');
  var qc = bar.children('#qc');
  var quant = bar.children('#quant');
  var diff = bar.children('#diff');
  var done = bar.children('#done');

  bar.children().removeClass('progress-bar-striped progress-bar-animated');

  // Set queued classes.
  queued.removeClass('bg-secondary border-right border-dark');
  queued.addClass('bg-dark');

  // Set qc classes.
  qc.removeClass('bg-secondary border-right border-dark');
  qc.addClass('bg-warning');

  // Set quant classes.
  quant.removeClass('bg-secondary border-right border-dark');
  quant.addClass('bg-info');

  // Set diff classes.
  diff.removeClass('bg-secondary border-right border-dark');
  diff.addClass('bg-danger progress-bar-striped progress-bar-animated');

  // Set done classes.
  done.removeClass('bg-success');
  done.addClass('bg-secondary');
}

/**
 * Set progress bar to done.
 */
function set_progress_bar_done() {
  var bar = $('#progress_bar');
  var queued = bar.children('#queued');
  var qc = bar.children('#qc');
  var quant = bar.children('#quant');
  var diff = bar.children('#diff');
  var done = bar.children('#done');

  bar.children().removeClass('progress-bar-striped progress-bar-animated bg-secondary border-right border-dark');

  // Set queued classes.
  queued.addClass('bg-dark');

  // Set qc classes.
  qc.addClass('bg-warning');

  // Set quant classes.
  quant.addClass('bg-info');

  // Set diff classes.
  diff.addClass('bg-danger');

  // Set done classes.
  done.addClass('bg-success');
}

/**
 * Parse project status.
 */
function parse_proj_status(out) {
  var split = out.split('\n');
  var status = parseInt(split[split.length - 3]);
  console.log(split);
  console.log(status);

  switch (status) {
    // Project created.
    case progress.new:
    case progress.raw_reads:
      console.log('status: created');
      goto_ftp_info();
      break;

    // Samples inferred
    case progress.inferred:
      console.log('status: samples inferred');
      goto_ftp_info();
      break;
    case progress.set:
      console.log('status: set');
      goto_meta_input()
      break;

    // For all of these cases, we go to the progress page.
    case progress.finalized:
      console.log('status: finalized');

    case progress.qc_queued:
    case progress.qc_started:
    case progress.qc_finished:
    case progress.quant_queued:
    case progress.quant_started:
    case progress.quant_finished:
    case progress.diff_queued:
    case progress.diff_started:
    case progress.diff_finished:
    case progress.server_open:
      goto_progress(status);

      break;

  }
}

/**
 * Get project status.
 */
function get_proj_status() {
  $.ajax({
    type: 'POST',
    url: 'cgi_request.php',
    data: {
      action: 'get_proj_status',
      id: proj_id
    },
    success:function(out) {
      console.log(out);
      parse_proj_status(out);
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
 * Scroll to specified element.
 */
function scroll_to_ele(ele) {
  var obj = {pos: $(window).scrollTop()};
  var target = ele.offset().top - $('#navbar_nav').outerHeight(true);
  var max = $(document).height() - $(window).height();

  // If the max scroll is smaller than the target, override target.
  if (max < target) {
    target = max;
  }

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
 * Copy test reads.
 */
function copy_test_reads() {
  // Show the loading spinner.
  var button = $(this);
  var spinner = button.children('div:nth-of-type(1)');
  var success = button.children('div:nth-of-type(2)');
  set_loading_spinner(button, spinner);

  $.ajax({
    type: 'POST',
    url: 'cgi_request.php',
    data: {
      action: 'test_copy_reads',
      id: proj_id
    },
    success:function(out) {
      console.log(out);

      spinner.hide();
      success.show();
    }
  });
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

  // Add on click handler for fetch reads button.
  $('#fetch_reads_btn').click(fetch_reads);

  // Add on click handler for copy test reads.
  $('#copy_test_reads_btn').click(copy_test_reads);

  bind_raw_reads();
  $('#refetch_reads_btn_2').click(refetch_reads);

  // Change url.
  history.pushState(null, '', '/?id=' + id);
  $('#proj_url').text(window.location.href);

  // Show the div.
  ftp_div.show();

  // Smoothly scroll to element.
  scroll_to_ele(ftp_div);
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

      // Set global variables.
      proj_id = id_pw.id;
      ftp_pw = id_pw.pw;

      // Then, show ftp info.
      show_ftp_info(proj_id, ftp_pw);
    }
  });
}

/**
 * Sets the md5.
 */
function set_md5(md5_id, spinner_id, md5) {
  // Remove the spinner.
  $('#' + spinner_id).hide();

  // Get md5 from output.
  md5 = md5.split('  ')[0];
  $('#' + md5_id).text(md5);
}

/**
 * Get the md5 sum of the given file.
 */
function get_md5(md5_id, spinner_id, path) {
  console.log(path);
  // Send md5 request.
  $.ajax({
    type: 'POST',
    url: 'md5sum.php',
    data: {
      'path': path
    },
    success:function(out) {
      console.log(out);
      set_md5(md5_id, spinner_id, out);
    }
  });
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
  var md5_loading_spinner_id = 'md5_loading_spinner_num';

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
    var new_md5_loading_spinner_id = md5_loading_spinner_id.replace('num', i);

    var row = $('#' + row_id).clone();

    // Set row id.
    row.attr('id', row_id.replace('num', i));

    // Replace children id's.
    row.children('#' + folder_id).attr('id', new_folder_id);
    row.children('#' + filename_id).attr('id', new_filename_id);
    row.children('#' + size_id).attr('id', new_size_id);
    row.children('#' + md5_id).attr('id', new_md5_id);
    row.children('#' + new_md5_id).children().attr('id',
                                  new_md5_loading_spinner_id);

    // Then, set the values.
    row.children('#' + new_folder_id).text(folder);
    row.children('#' + new_filename_id).text(filename);
    row.children('#' + new_size_id).text(size);

    // Append the row to the table.
    $('#raw_reads_table').append(row);
    row.show();

    // Calculate md5 sum.
    get_md5(new_md5_id, new_md5_loading_spinner_id, path);
  }
}

/**
 * Sets fetch succeeded.
 */
function set_fetch_succeeded() {
  var failed = $('#fetch_failed_div');
  var succeeded = $('#raw_reads_div');

  failed.hide();
  succeeded.show();

  // Disable fetch reads button.
  $('#fetch_reads_btn').prop('disabled', true);

  scroll_to_ele(succeeded);
}

/**
 * Sets fetch failed.
 */
function set_fetch_failed() {
  var failed = $('#fetch_failed_div');
  var succeeded = $('#raw_reads_div');

  succeeded.hide();
  failed.show();

  scroll_to_ele(failed);
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

  // console.log(reads);

  // If there are no raw reads, something went wrong.
  if (reads.length < 1) {
    set_fetch_failed();
  } else {
    // Pass on the parsed reads to set the table values.
    set_raw_reads_table(reads);

    set_fetch_succeeded();

    // After everything has been added, set this table as a DataTable.
    $('#raw_reads_table').DataTable({
      'ordering': true,
      'order': [[0, 'asc']],
      'searching': false,
      'paging': false,
      'scrollY': 500,
      'columnDefs':[{
        'targets':[2,3],
        'orderable': false
      }]
    });
  }

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

/**
 * Refetch reads.
 */
function refetch_reads() {
  // Reset the raw reads div.
  var replacement = raw_reads_div.clone(true);
  $('#raw_reads_div').replaceWith(replacement);

  // Rebind.
  bind_raw_reads();

  // Then, call fetch.
  fetch_reads();
}

/**
 * Binds events for raw reads div.
 */
function bind_raw_reads() {
  // Add on click handler for refetch reads button.
  $('#refetch_reads_btn_1').click(refetch_reads);

  // Bind infer samples button.
  $('#infer_samples_btn').click(infer_samples);

  // Bind done button for inputing sample names.
  $('#sample_names_btn').click(meta_input);
}

/**
 * Show sample name input form.
 */
function show_sample_name_input() {
  var first = $('#infer_samples_modal');
  var second = $('#sample_names_modal');

  // First, add event listener for modal hide.
  first.on('hidden.bs.modal', function (e) {
    second.modal('show');
    $(this).off('hidden.bs.modal');
  });

  // Then, hide infer samples modal,
  // which will also show the second modal.
  first.modal('hide');

}

/**
 * Set the sample name input form.
 */
function set_sample_name_input(proj) {
  // First, set the header to say how many samples were detected.
  var n_samples = Object.keys(proj.samples).length;

  var header = $('#sample_names_header');
  header.text(header.text().replace('num', n_samples));

  // Set sorted names.
  set_sorted_names();

  // Then, set the rows.
  var row_id = 'name_input_row_SAMPLEID';
  var folder_id = 'name_input_folder_SAMPLEID';
  var name_id = 'name_input_SAMPLEID';

  for (var i = 0; i < sorted_names.length; i++) {
    var name = sorted_names[i];
    var id = names_to_ids[name];

    var new_folder_id = folder_id.replace('SAMPLEID', id);
    var new_name_id = name_id.replace('SAMPLEID', id);

    var row = $('#' + row_id).clone();
    var def = name;

    // Set row id.
    row.attr('id', row_id.replace('SAMPLEID', id));

    // Replace children id's.
    row.children('#' + folder_id).attr('id', new_folder_id);
    row.children('#' + name_id).attr('id', new_name_id);

    // Then, set the values.
    row.children('#' + new_folder_id).text(def);
    row.children('#' + new_name_id).attr('placeholder', 'Default: ' + def);

    // Append the row to the table.
    $('#sample_names_form').append(row);
    row.show();
    row.addClass('d-flex');
  }
}

// /**
//  * Sets the dropdown of available organisms.
//  */
// function set_organisms_dropdown() {
//   var dropdown_id = 'sample_organism_SAMPLEID';
//   var option_id = 'sample_organism_SAMPLEID_option';
//
//   for (var id in sample_forms) {
//     var new_dropdown_id = dropdown_id.replace('SAMPLEID', id);
//     var new_option_id = option_id.replace('SAMPLEID', id);
//     var dropdown = sample_forms[id].find('#' + new_dropdown_id);
//
//     // Loop through each organism.
//     for (var i = 0; i < organisms.length; i++) {
//       var org = organisms[i];
//
//       // Get clone of placeholder option.
//       var option = dropdown.children('#' + new_option_id).clone();
//
//       // Set the value and remove id (because we don't need the id).
//       option.attr('value', org);
//       option.attr('id', '');
//       option.text(org);
//
//       // Add it to the dropdown.
//       dropdown.append(option);
//
//       // Then, show it.
//       option.show();
//     }
//   }
// }

/**
 * Populates the given select with the global organisms variable.
 */
function populate_organisms_select(select) {
  for (var i = 0; i < organisms.length; i++) {
    var option = $('<option>', {text: organisms[i]});
    select.append(option);
  }
}

/**
 * Sets the internal list of available organisms.
 */
function set_organisms_select(select) {
  // Send request only if we haven't received the list of organisms yet.
  if (organisms == null) {
    // Send get_organisms request.
    $.ajax({
      type: 'POST',
      url: 'cgi_request.php',
      data: {
        action: 'get_organisms'
      },
      success:function(out) {
        console.log(out);

        var split = out.split('[');
        var split2 = split[1].split(']');
        var dump = '[' + split2[0] + ']';

        organisms = JSON.parse(dump);

        // Set the dropdowns.
        populate_organisms_select(select);
      }
    });
  } else {
    // Otherwise, we can just set the dropdown right away.
    populate_organisms_select(select);
  }

}

/**
 * Parse the string returned by infer_samples.
 */
function parse_infer_samples(out) {
  // Split by first opening bracket.
  var i = out.indexOf('{');
  var split = out.slice(i);

  // Then, split by ending string.
  var split2 = split.split('END');

  // Then, we have the raw json dump.
  var dump = split2[0];

  console.log(dump);

  // Parse json.
  proj = JSON.parse(dump);

  set_sample_name_input(proj);
  show_sample_name_input();
}

/**
 * Infer samples.
 */
function infer_samples() {
  // Show the loading spinner.
  var button = $('#infer_samples_btn');
  var spinner = $('#infer_samples_loading_spinner');
  set_loading_spinner(button, spinner);

  // Send fetch_reads request.
  $.ajax({
    type: 'POST',
    url: 'cgi_request.php',
    data: {
      action: 'infer_samples',
      id: proj_id
    },
    success:function(out) {
      console.log(out);
      parse_infer_samples(out);
    }
  });
}

/**
 * Set sample reads table.
 */
function set_sample_reads(table, reads) {

}

/**
 * Show sample form.
 */
function show_sample_form(id, form) {
  // If the form is already being shown, just return.
  if (current_sample_form == form) {
    return;
  }

  // If the global current_sample_form is not empty,
  // then we need to hide it first.
  if (current_sample_form != null) {
    // Set on-hide handler to show the new sample form.
    current_sample_form.on('hidden.bs.collapse', function () {
      form.collapse('show');
      current_sample_form.off('hidden.bs.collapse');
    });

    current_sample_form.collapse('hide');
  }
  else {
    form.collapse('show');
  }

  // Replace current sample.
  current_sample_form = form;
}

/**
 * Set choose sample button.
 */
function set_choose_sample_button(dropdown, forms) {
  var dropdown_item = dropdown.children('.show_sample_dropdown_item');

  for (var id in forms) {
    var new_item = dropdown_item.clone();

    // Change id, text.
    new_item.text(proj.samples[id].name);

    // Append to global variable.
    dropdown_items[id] = new_item;

    // Set on click handler.
    new_item.click({'id': id}, function (e) {
      console.log('clicked ' + e.data.id);
      var item = $(this);
      var id = e.data.id;
      var grandparent = item.parent().parent();
      grandparent.children('button').text(proj.samples[id].name);
      show_sample_form(id, sample_forms[id]);
    });

    // Append to html and show.
    dropdown.append(new_item);

    new_item.show();
  }
}

/**
 * Set reads table for the specified sample.
 */
function set_reads_table(id, form) {
  // Set the reads table.
  var sample_reads_table_id = 'sample_reads_table_' + id + '_row_num';
  var folder_id = 'folder_' + id + '_num';
  var filename_id = 'filename_' + id + '_num';
  var size_id = 'size_' + id + '_num';
  var md5_id = 'md5_' + id + '_num';
  for (var path in proj.samples[id].reads) {
    // Extract folder, filename, size and md5.
    split = path.split('/');

    var filename = split[split.length - 1];
    var folder = path.replace('0_raw_reads', '');
    folder = folder.replace('/' + filename, '');

    var size = proj.samples[id].reads[path].size / Math.pow(1024, 2);
    var md5 = proj.samples[id].reads[path].md5;

    // Construct row.
    var new_sample_reads_table_id = sample_reads_table_id.replace('num', path);
    var new_folder_id = folder_id.replace('num', path);
    var new_filename_id = filename_id.replace('num', path);
    var new_size_id = size_id.replace('num', path);
    var new_md5_id = md5_id.replace('num', path);

    // Change row id.
    var row = form.find('#' + sample_reads_table_id).clone();
    row.attr('id', new_sample_reads_table_id);

    // Change cell ids.
    var folder_cell = row.children('#' + folder_id);
    var filename_cell = row.children('#' + filename_id);
    var size_cell = row.children('#' + size_id);
    var md5_cell = row.children('#' + md5_id);
    folder_cell.attr('id', new_folder_id);
    filename_cell.attr('id', new_filename_id);
    size_cell.attr('id', new_size_id);
    md5_cell.attr('id', new_md5_id);

    // Then, set the values.
    folder_cell.text(folder);
    filename_cell.text(filename);
    size_cell.text(size);
    md5_cell.text(md5);

    // Append row.
    form.find('#sample_reads_table_' + id).append(row);
    row.show();
  }
}

/**
 * Set DOM of paired end input form.
 */
function set_paired_end(id, form) {
  var pair_1_id = 'sample_paired_' + id + '_row_num_1';
  var pair_2_id = 'sample_paired_' + id + '_row_num_2';
  var row_id = 'sample_paired_' + id + '_row_num';
  var paired_id = 'sample_paired_' + id;

  // Get elements.
  var row = form.find('#' + row_id);
  var paired = form.find('#' + paired_id);

  // Get the list of paths (to the reads).
  var reads = Object.keys(proj.samples[id].reads);

  // Get how many reads this sample has.
  var n_reads = reads.length;
  var n_pairs = n_reads / 2;

  // If there are an odd number of reads, automatically disable.
  if (n_reads % 2 == 1) {
    form.find('#' + pair_2_id).prop('disabled', true);
  }

  // Sort reads.
  reads = reads.sort();

  // First, generate list of options for each read.
  var options = [];
  for (var i = 0; i < n_reads; i++) {
    var read = reads[i];
    var short = read.replace('0_raw_reads/', '');

    var option = $('<option>', {
      text: short,
      value: read
    });

    options.push(option);
  }

  // Add row for each pair.
  sample_pair_fields[id] = [];
  for (var i = 0; i < n_pairs; i++) {
    // Define new ids for this row.
    var new_row_id = row_id.replace('num', i);
    var new_pair_1_id = pair_1_id.replace('num', i);
    var new_pair_2_id = pair_2_id.replace('num', i);

    var new_row = row.clone();

    // First change this row's id.
    new_row.attr('id', new_row_id);

    // Set the legend.
    new_row.children('legend').text('Pair ' + (i+1));

    // Set the id of each pair.
    var new_pair_1 = new_row.children('#' + pair_1_id);
    var new_pair_2 = new_row.children('#' + pair_2_id);
    new_pair_1.attr('id', new_pair_1_id);
    new_pair_2.attr('id', new_pair_2_id);

    // Add list of reads.
    for (var j = 0; j < options.length; j++) {
      var opt = options[j];

      new_pair_1.append(opt.clone());
      new_pair_2.append(opt.clone());
    }

    // Finally, append the new row.
    paired.append(new_row);
    new_row.show();
    new_row.addClass('d-flex');

    // Also append to the global variable.
    sample_pair_fields[id].push(new_row);
  }

  // attach listener.
  set_paired_end_listener(id, form);
}

/**
 * Set paired end listener.
 */
function set_paired_end_listener(id, form) {
  var single_radio_id = 'sample_type_SAMPLEID_1_radio'
  var paired_radio_id = 'sample_type_SAMPLEID_2_radio';
  var paired_id = 'sample_paired_SAMPLEID';

  var new_single_radio_id = single_radio_id.replace('SAMPLEID', id);
  var new_paired_radio_id = paired_radio_id.replace('SAMPLEID', id);
  var new_paired_id = paired_id.replace('SAMPLEID', id);

  var single_radio = form.find('#' + new_single_radio_id);
  var paired_radio = form.find('#' + new_paired_radio_id);
  var paired = form.find('#' + new_paired_id);

  // Set listener for click.
  single_radio.click({'paired': paired}, function (e) {
    var paired = e.data.paired;
    if (this.checked) {
      paired.collapse('hide');
    }
  });
  paired_radio.click({'paired': paired}, function (e) {
    var paired = e.data.paired;
    if (this.checked) {
      paired.collapse('show');
    }
  });
}

// /**
//  * Import data from sample.
//  */
// function import_sample() {
//
// }
//
// /**
//  * Refreshes the names in the import/export dropdown.
//  */
// function refresh_import_export_samples() {
//   var import_dropdown = $('#import_popover_dropdown');
//   var export_dropdown = $('#export_popover_dropdown');
//
//   for (var name in names_to_ids) {
//     var id = names_to_ids[name];
//
//     // These are samples that we will refresh in this iteration.
//     var import_sample = import_dropdown.children('option[value="' + id + '"]');
//     var export_sample = export_dropdown.children('option[value="' + id + '"]');
//
//     // Refresh the text.
//     import_sample.text(name);
//     export_sample.text(name);
//   }
// }
//
// /**
//  * Set import/export samples list.
//  */
// function add_import_export_sample(name, id) {
//   var import_dropdown = $('#import_popover_dropdown');
//   var export_dropdown = $('#export_popover_dropdown');
//
//   var option = $('<option>', {
//     text: name,
//     value: id,
//   });
//
//   import_dropdown.append(option.clone());
//   export_dropdown.append(option.clone());
//
//   set_import_export_popover_btn();
// }
//
// /**
//  * Returns content for import/export popover title.
//  */
// function get_import_export_popover_title() {
//   if (current_sample_form != null) {
//     var id = current_sample_form.attr('id').replace('sample_', '');
//     return proj.samples[id].name;
//   }
//   return '';
// }
//
// /**
//  * Returns content for import/export popover body.
//  */
// function get_import_export_popover_body(popover) {
//   if (current_sample_form != null) {
//     var new_popover = popover.clone(true);
//     var id = current_sample_form.attr('id').replace('sample_', '');
//
//     var to_hide = new_popover.children('select').children('option[value="' + id + '"]');
//     to_hide.prop('hidden', true);
//
//     return new_popover.html();
//   }
//
//   return 'Please choose a sample first.';
// }
//
// /**
//  * Set import/export button.
//  */
// function set_import_export_popover_btn() {
//   // Set data input/export button.
//   var import_btn = $('#sample_import_outer_btn');
//   var export_btn = $('#sample_export_outer_btn');
//   var import_popover = $('#import_popover');
//   var export_popover = $('#export_popover');
//
//   import_btn.popover({
//     html: true,
//     placement: "bottom",
//     content: function() {
//       return get_import_export_popover_body(import_popover);
//     },
//     title: function() {
//       return get_import_export_popover_title();
//     }
//   });
//   export_btn.popover({
//     html: true,
//     placement: "bottom",
//     content: function() {
//       return get_import_export_popover_body(export_popover);
//     },
//     title: function() {
//       return get_import_export_popover_title();
//     }
//   });
//   import_btn.on('show.bs.popover', function() {
//     export_btn.popover('hide');
//   });
//   export_btn.on('show.bs.popover', function() {
//     import_btn.popover('hide');
//   });
// }

// /**
//  * Remove contributor with index n.
//  */
// function remove_contributor(fields, n) {
//   // Get the div of the contributor.
//   var div = fields[n];
//
//   // Set on-hide listener to destroy this div.
//   div.on('hidden.bs.collapse', {'div': div, 'fields': fields, 'n': n},
//   function (e) {
//     var div = e.data.div;
//     var fields = e.data.fields;
//     var n = e.data.n;
//
//     var contributors_div = div.parent();
//     var more_div = contributors_div.children('div[style*="display:none"]');
//     var more_input = more_div.children('input');
//     var more_btn = more_div.children('button');
//
//     var more_div_id = more_div.attr('id');
//     var more_input_id = more_input.attr('id');
//     var more_btn_id = more_btn.attr('id');
//
//     // Remove item from the array. Then, delete it from DOM.
//     fields.splice(n, 1);
//     div.remove();
//
//     // Then, update the ids of all the following elements.
//     var n_contributors = fields.length;
//     for (var i = n; i < n_contributors; i++) {
//       var new_more_div_id = more_div_id.replace('num', i);
//       var new_more_input_id = more_input_id.replace('num', i);
//       var new_more_btn_id = more_btn_id.replace('num', i);
//
//       var div = fields[i];
//       div.attr('id', new_more_div_id);
//       div.children('input').attr('id', new_more_input_id);
//       div.children('button').attr('id', new_more_btn_id);
//     }
//   });
//
//   // Hide collapse.
//   div.collapse('hide');
// }

// /**
//  * Set up the remove contributor button.
//  */
// function set_remove_contributor_button(button) {
//   button.click(function () {
//     var id = $(this).attr('id');
//     var split = id.split('_');
//     var n = split[split.length - 1];
//
//     console.log(id);
//
//     if (id.startsWith('proj')) {
//       remove_contributor(proj_contributor_fields, n);
//     } else if (id.startsWith('sample')) {
//       var sample_id = split[split.length - 3];
//       remove_contributor(sample_contributor_fields[sample_id], n);
//     }
//   });
//
// }

// /**
//  * Add contributors.
//  */
// function add_contributor() {
//   var btn = $(this);
//   var contributors_div = btn.parent().parent();
//   var more_div = contributors_div.children('div[style*="display:none"]');
//   var more_input = more_div.children('input');
//   var more_btn = more_div.children('button');
//
//   var more_div_id = more_div.attr('id');
//   var more_input_id = more_input.attr('id');
//   var more_btn_id = more_btn.attr('id');
//
//   var fields;
//   if (more_div_id.startsWith('proj')) {
//     fields = proj_contributor_fields;
//   } else if (more_div_id.startsWith('sample')) {
//     var split = more_div_id.split('_');
//     var sample_id = split[split.length - 3];
//     fields = sample_contributor_fields[sample_id];
//   }
//
//   // Current number of project contributor fields.
//   var n_contributors = fields.length;
//
//   // Make new div by cloning.
//   var new_div = more_div.clone();
//
//   // Then, change the ids.
//   var new_more_div_id = more_div_id.replace('num', n_contributors);
//   var new_more_input_id = more_input_id.replace('num', n_contributors);
//   var new_more_btn_id = more_btn_id.replace('num', n_contributors);
//   var new_more_input = new_div.children('input');
//   var new_more_btn = new_div.children('button');
//   new_div.attr('id', new_more_div_id);
//   new_more_input.attr('id', new_more_input_id);
//   new_more_btn.attr('id', new_more_btn_id);
//
//   // Set up suggestions (if this is for a sample)
//   if (more_div_id.startsWith('sample')) {
//     new_more_input.focusin(function() {
//       var split = $(this).attr('id').split('_');
//       var id = split[split.length - 2];
//
//       set_suggestions($(this), get_all_contributors_except(id));
//     });
//   }
//
//   // Then, set the remove button handler.
//   set_remove_contributor_button(new_more_btn);
//
//   // Append the new field to DOM.
//   contributors_div.append(new_div);
//   new_div.show();
//   new_div.addClass('d-flex');
//
//   // Show the collapse.
//   new_div.collapse('show');
//
//   // Add the div to the global list of contributor fields.
//   fields.push(new_div);
// }

// /**
//  * Remove contributor with index n.
//  */
// function remove_characteristic(fields, n) {
//   // Get the div of the contributor.
//   var div = fields[n];
//
//   // Set on-hide listener to destroy this div.
//   div.on('hidden.bs.collapse', {'div': div, 'fields': fields, 'n': n},
//   function (e) {
//     var div = e.data.div;
//     var fields = e.data.fields;
//     var n = e.data.n;
//
//     var characteristics_div = div.parent();
//     var more_div = characteristics_div.children('div[style*="display:none"]');
//     var more_div_id = more_div.attr('id');
//
//     // Extract sample id.
//     var split = more_div_id.split('_');
//     var id = split[split.length - 3];
//
//     var more_char_id = 'sample_characteristic_' + id + '_num';
//     var more_detail_id = 'sample_detail_' + id + '_num';
//
//     var more_btn = more_div.children('button');
//     var more_btn_id = more_btn.attr('id');
//
//     // Remove item from the array. Then, delete it from DOM.
//     fields.splice(n, 1);
//     div.remove();
//
//     // Then, update the ids of all the following elements.
//     var n_characteristics = fields.length;
//     for (var i = n; i < n_characteristics; i++) {
//       var new_more_div_id = more_div_id.replace('num', i);
//       var new_more_char_id = more_char_id.replace('num', i);
//       var new_more_detail_id = more_detail_id.replace('num', i);
//       var new_more_btn_id = more_btn_id.replace('num', i);
//
//       var div = fields[i];
//       div.attr('id', new_more_div_id);
//       div.children('#' + more_char_id).attr('id', new_more_char_id);
//       div.children('#' + more_detail_id).attr('id', new_more_detail_id);
//       div.children('button').attr('id', new_more_btn_id);
//     }
//   });
//
//   // Hide collapse.
//   div.collapse('hide');
// }
//
// /**
//  * Set up the remove contributor button.
//  */
// function set_remove_characteristic_button(button) {
//   button.click(function () {
//     var id = $(this).attr('id');
//     var split = id.split('_');
//     var n = split[split.length - 1];
//
//     console.log(id);
//
//     var sample_id = split[split.length - 3];
//     remove_characteristic(sample_characteristic_fields[sample_id], n);
//   });
// }
//
// /**
//  * Add characteristic.
//  */
// function add_characteristic() {
//   var btn = $(this);
//   var characteristics_div = btn.parent().parent();
//   var more_div = characteristics_div.children('div[style*="display:none"]');
//   var more_div_id = more_div.attr('id');
//
//   // Extract sample id.
//   var split = more_div_id.split('_');
//   var id = split[split.length - 3];
//
//   var more_char_id = 'sample_characteristic_' + id + '_num';
//   var more_detail_id = 'sample_detail_' + id + '_num';
//
//   var more_btn = more_div.children('button');
//   var more_btn_id = more_btn.attr('id');
//
//   var fields = sample_characteristic_fields[id];
//
//   // Current number of project contributor fields.
//   var n_characteristics = fields.length;
//
//   // Make new div by cloning.
//   var new_div = more_div.clone();
//
//   // Then, change the ids.
//   var new_more_div_id = more_div_id.replace('num', n_characteristics);
//   var new_more_char_id = more_char_id.replace('num', n_characteristics);
//   var new_more_detail_id = more_detail_id.replace('num', n_characteristics);
//   var new_more_btn_id = more_btn_id.replace('num', n_characteristics);
//   var new_more_char = new_div.children('#' + more_char_id);
//   var new_more_detail = new_div.children('#' + more_detail_id);
//   var new_more_btn = new_div.children('button');
//   new_div.attr('id', new_more_div_id);
//   new_more_char.attr('id', new_more_char_id);
//   new_more_detail.attr('id', new_more_detail_id);
//   new_more_btn.attr('id', new_more_btn_id);
//
//   // Set up suggestions
//   new_more_char.focusin(function() {
//     var split = $(this).attr('id').split('_');
//     var id = split[split.length - 2];
//     var characteristics = get_all_characteristics_except(id);
//
//     set_suggestions($(this), Object.keys(characteristics));
//   });
//   new_more_detail.focusin({char: new_more_char}, function(e) {
//     var char = e.data.char.val();
//     var characteristics = get_all_characteristics();
//
//     if (char != '' && char != null && characteristics[char] != null) {
//       set_suggestions($(this), characteristics[char]);
//     }
//   });
//
//
//   // Then, set the remove button handler.
//   set_remove_characteristic_button(new_more_btn);
//
//   // Append the new field to DOM.
//   characteristics_div.append(new_div);
//   new_div.show();
//   new_div.addClass('d-flex');
//
//   // Show the collapse.
//   new_div.collapse('show');
//
//   // Add the div to the global list of contributor fields.
//   fields.push(new_div);
// }
//
// /**
//  * Remove value.
//  */
// function remove_value(fields, n) {
//   // Get div of value.
//   var div = fields[n];
//
//   // Set on-hide listener to destroy this div.
//   div.on('hidden.bs.collapse', {'div': div, 'fields': fields, 'n': n},
//   function (e) {
//     var div = e.data.div;
//     var fields = e.data.fields;
//     var n = e.data.n;
//
//     var factor_div = div.parent();
//     var more_div = factor_div.children('div[style*="display:none"]');
//     var more_value = more_div.children('input');
//     var more_btn = more_div.children('button');
//     var more_div_id = more_div.attr('id');
//     var more_value_id = more_value.attr('id');
//     var more_btn_id = more_btn.attr('id');
//
//     // Remove item from the array. Then, delete it from DOM.
//     fields.splice(n, 1);
//     div.remove();
//
//     // Then, update the ids of all the following elements.
//     var n_values = fields.length;
//     for (var i = n; i < n_values; i++) {
//       var new_more_div_id = more_div_id.replace('num', i);
//       var new_more_value_id = more_value_id.replace('num', i);
//       var new_more_btn_id = more_btn_id.replace('num', i);
//
//       var div = fields[i];
//       div.attr('id', new_more_div_id);
//       div.children('input').attr('id', new_more_value_id);
//       div.children('button').attr('id', new_more_btn_id);
//     }
//   });
//
//   // Hide collapse.
//   div.collapse('hide');
// }
//
// /**
//  * Set up the remove value button.
//  */
// function set_remove_factor_btn(button, fields) {
//   button.click({
//     'fields': fields,
//   }, function (e) {
//     var id = $(this).attr('id');
//     var split = id.split('_');
//     var n = split[split.length - 1];
//     var fields = e.data.fields;
//     remove_value(fields, n);
//   });
// }
//
// /**
//  * Add factor detail.
//  */
// function add_factor() {
//   var btn = $(this);
//   var factor_div = btn.parent().parent();
//   var more_div = factor_div.children('div[style*="display:none"]');
//   var more_value = more_div.children('input');
//   var more_btn = more_div.children('button');
//   var more_div_id = more_div.attr('id');
//   var more_value_id = more_value.attr('id');
//   var more_btn_id = more_btn.attr('id');
//
//   // Extract factor number.
//   var split = more_div_id.split('_');
//   var num = parseInt(split[split.length - 4]);
//
//   var fields;
//   if (num == 0) {
//     fields = proj_factor_0_fields;
//   } else {
//     fields = proj_factor_1_fields;
//   }
//
//   // Get how many values there are already.
//   var n_values = fields.length;
//
//   // Make new div by cloning.
//   var new_div = more_div.clone();
//
//   // Then, change the ids.
//   var new_more_div_id = more_div_id.replace('num', n_values);
//   var new_more_value_id = more_value_id.replace('num', n_values);
//   var new_more_btn_id = more_btn_id.replace('num', n_values);
//   var new_more_value = new_div.children('input');
//   var new_more_btn = new_div.children('button');
//   new_div.attr('id', new_more_div_id);
//   new_more_value.attr('id', new_more_value_id);
//   new_more_btn.attr('id', new_more_btn_id);
//
//   // Set the remove button handler.
//   set_remove_factor_btn(new_more_btn, fields);
//
//   // Append the new field to DOM.
//   factor_div.append(new_div);
//   new_div.show();
//   new_div.addClass('d-flex');
//
//   // Show the collapse.
//   new_div.collapse('show');
//
//   // Add the div to the global list of factor values.
//   fields.push(new_div);
// }

/**
 * Sets project meta fields with the values from the global proj object.
 */
function set_proj_meta_fields() {
  var fields = meta_input_fields;

  for (var cat in fields) {
    var field = fields[cat];
    var val = proj[cat];

    switch (cat) {
      case 'meta':
      case 'samples':
        break;

      case 'design':
        field.find('input[value="' + val + '"]').prop('checked', true);
        break;

      default:
        field.val(val);
    }
  }

  var meta_fields = fields.meta;

  for (var cat in meta_fields) {
    var field = meta_fields[cat];
    var val = proj.meta[cat];

    switch (cat) {
      case 'contributors':
        if (val.length > 0) {
          // Set first row first.
          var first_row = field[0];
          var add_btn = first_row.children('button');
          first_row.children('input').val(val[0]);

          // Then, deal with subsequent contributors.
          for (var i = 1; i < val.length; i++) {
            var contributor = val[i];

            // Simulate add button click.
            add_btn.click();
            var row = field[i];
            row.children('input').val(val[0]);
          }
        }
        break;

      case 'title':
      case 'abstract':
      case 'SRA_center_code':
      case 'email':
      default:
        field.val(val);
    }
  }
}

/**
 * Sets sample meta fields with the values from the global proj object.
 */
function set_sample_meta_fields(id) {
  var fields = meta_input_fields.samples[id];

  for (var cat in fields) {
    var field = fields[cat];
    var val = proj.samples[id][cat];

    switch (cat) {
      case 'meta':
        break;

      case 'type':
        var radio = field.find('input[value="' + val + '"]');
        radio.prop('checked', true);
        radio.click();
        break;

      case 'organism':
        var org = val;
        var ver = proj.samples[id]['ref_ver'];
        var selection = val + '_' + ver;
        field.children('option[value="' + selection + '"]').prop('selected', true);
        break;

      case 'name':
      case 'length':
      case 'stdev':
      default:
        field.val(val);
    }
  }

  var meta_fields = fields.meta;

  for (var cat in meta_fields) {
    var field = meta_fields[cat];
    var val = proj.samples[id].meta[cat];

    switch (cat) {
      case 'contributors':
        if (val.length > 0) {
          // Set first row first.
          var first_row = field[0];
          var add_btn = first_row.children('button');
          first_row.children('input').val(val[0]);

          // Then, deal with subsequent contributors.
          for (var i = 1; i < val.length; i++) {
            var contributor = val[i];

            // Simulate add button click.
            add_btn.click();
            var row = field[i];
            row.children('input').val(val[0]);
          }
        }
        break;

      case 'chars':
        var chars = Object.keys(val);
        if (chars.length > 0) {
          // Set first row first.
          var first_row = field[0];
          var add_btn = first_row.children('button');
          first_row.children('input:nth-of-type(1)').val(chars[0]);
          first_row.children('input:nth-of-type(2)').val(val[chars[0]]);

          // Then, deal with subsequent contributors.
          for (var i = 1; i < Object.keys(val).length; i++) {
            var char = chars[i];
            var detail = val[char];

            // Simulate add button click.
            add_btn.click();
            var row = field[i];
            row.children('input:nth-of-type(1)').val(char);
            row.children('input:nth-of-type(2)').val(detail);
          }
        }
        break;

      case 'source':
      case 'description':
      default:
        field.val(val);
    }
  }
}

/**
 * Sets all meta fields with the values from the global proj object.
 */
function set_all_meta_fields() {
  set_proj_meta_fields();

  for (var id in proj.samples) {
    set_sample_meta_fields(id);
  }
}

/**
 * Read project from temporary json.
 */
function read_proj() {
  // Send ajax request.
  $.ajax({
    type: 'POST',
    url: 'read_proj.php',
    data: { id: proj_id },
    success:function(out) {
      console.log(out);
      proj = JSON.parse(out);

      set_meta_input();

      show_meta_input();

      // Then, set all the meta fields.
      set_all_meta_fields();
    }
  });
}

/**
 * Save project to temporary json.
 */
function save_proj(callback) {
  // set_all_meta();
  // write_proj(callback);
}

// /**
//  * Set 1-, 2-factor listener.
//  */
// function set_factor_listener() {
//   var factor_1_radio_id = 'proj_design_1_radio';
//   var factor_2_radio_id = 'proj_design_2_radio';
//
//   // ID of the second factor.
//   var factor_1_id = 'proj_factor_1_card';
//
//   var factor_1_radio = proj_form.find('#' + factor_1_radio_id);
//   var factor_2_radio = proj_form.find('#' + factor_2_radio_id);
//   var factor_1 = proj_form.find('#' + factor_1_id);
//
//   // Set listener for click.
//   factor_1_radio.click({'factor_1': factor_1}, function (e) {
//     var factor_1 = e.data.factor_1;
//     if (this.checked) {
//       factor_1.collapse('hide');
//     }
//   });
//   factor_2_radio.click({'factor_1': factor_1}, function (e) {
//     var factor_1 = e.data.factor_1;
//     if (this.checked) {
//       factor_1.collapse('show');
//     }
//   });
// }

/**
 * Sets a 2-radio toggle to show/hide a collapse.
 */
function set_radio_collapse_toggle(radio_hide, radio_show, div_to_toggle) {
  radio_hide.click({'div': div_to_toggle}, function (e) {
    var div = e.data.div;
    if (this.checked) {
      div.collapse('hide');
    }
  });
  radio_show.click({'div': div_to_toggle}, function (e) {
    var div = e.data.div;
    if (this.checked) {
      div.collapse('show');
    }
  });
}

/**
 * Add a contributor.
 */
function add_contributor() {
  var btn = $(this);
  var grandparent = btn.parent().parent();
  var div = grandparent.children('div[style*="display:none"]');

  // Make a copy of this new div.
  var new_div = div.clone();

  // Set up remove button.
  new_div.children('button').click(remove_contributor);

  // Then, add it to the DOM and show it.
  grandparent.append(new_div);
  new_div.show();
  new_div.addClass('d-flex');

  // Show the new contributor row.
  new_div.collapse('show');
}

/**
 * Removes given contributor.
 */
function remove_contributor() {
  var btn = $(this);
  var div = btn.parent();

  // Set it up so that this div is destroyed when it is hidden.
  div.on('hidden.bs.collapse', function () {
    $(this).remove();
  });

  // Then, hide the div so that it is destroyed.
  div.collapse('hide');
}

/**
 * Sets add/remove functionality for contributors input.
 */
function set_contributors(div) {
  // The first child div is the first contributor row.
  var first = div.children('div:nth-of-type(1)');

  // Set up the add button.
  first.children('button').click(add_contributor);
}

/**
 * Remove a input row.
 */
function remove_input_row() {
  var btn = $(this);

  var div = btn.parent();

  // Set it up so that this div is destroyed when it is hidden.
  div.on('hidden.bs.collapse', function () {
    $(this).remove();
  });

  // Then, hide the div so that it is destroyed.
  div.collapse('hide');
}

/**
 * Adds an input row.
 */
function add_input_row() {
  var btn = $(this);
  var grandparent = btn.parent().parent();
  var div = grandparent.children('div[style*="display:none"]');

  // Clone a new row.
  var new_div = div.clone(true);

  // Set up remove button.
  new_div.children('button').click(remove_input_row);

  // Then, add it to the DOM and show it.
  grandparent.append(new_div);
  new_div.show();
  new_div.addClass('d-flex');

  // Show the new contributor row.
  new_div.collapse('show');
}

/**
 * Sets functionality for adding/removing input rows.
 */
function set_fluid_input_rows(div) {
  var button = div.find('button:first');

  // Set up the add button.
  button.click(add_input_row);
}

/**
 * Enables custom input.
 */
function enable_custom_input() {
  var select = $(this);
  var parent = select.parent();
  var input = parent.find('input');
  var value = select.children('option:selected').val();

  if (value.toLowerCase() == 'other') {
    input.prop('disabled', false);
  } else {
    input.prop('disabled', true);
  }
}

/**
 * Sets custom listener, which automatically enables an adjacent textbox
 * when the 'other' option is selected and disables it otherwise.
 */
function set_custom_listener(select) {
  select.change(enable_custom_input);
}

/**
 * Sets dropdown and text area wehre if the user selects 'other', the text
 * area is enabled..
 */
function set_custom_dropdown(div, choices) {
  var select = div.find('select');
  var custom_input = div.find('input');

  // Add possible names.
  for (var i = 0; i < choices.length; i++) {
    var choice = choices[i];
    var option = $('<option>', {text: choice});
    select.append(option);
  }

  // Then, add custom.
  var custom = $('<option>', {text: 'other'});
  select.append(custom);

  // Finally, set listener for when user selects the 'other' option.
  set_custom_listener(select);
}

/**
 * Sets everything that needs to be set for a factor selection card.
 */
function set_factor(div) {
  var name_group = div.find('.factor_name_group');
  var values_group = div.find('.factor_values_group');

  var name_div = name_group.children('.factor_name_inputs');
  var values_div = values_group.children('.factor_values_inputs');

  set_custom_dropdown(name_div, Object.keys(factor_names_to_class_ids));
  set_fluid_input_rows(values_div);
}

/**
 * Gets value from custom dropdown.
 */
function get_value_from_custom_dropdown(div) {
  var select = div.find('select');
  var custom_input = div.find('input');

  var selected = select.find('option:selected');
  var val;

  if (selected.length > 0) {
    val = selected.val();

    if (val.toLowerCase() == 'other') {
      val = custom_input.val();
    }
  }

  return val;
}

/**
 * Get list of values inputed to fluid input rows.
 */
function get_values_from_fluid_rows(div) {
  var values = [];

  var rows = div.children('div:visible');

  var custom_rows = [];
  rows.each(function () {
    var row = $(this);
    var col_values = [];
    if (get_custom_class(row).includes('_')) {
      var columns = row.children('input');

      columns.each(function () {
        var input = $(this);
        var val = input.val();

        if (val != null && val != '') {
          col_values.push(val);
        }
      });

      values.push(col_values);
    }
  });

  return values;
}



/**
 * Sets listener to change content of the given sample factor group depending on
 * the values of the factor card.
 */
function set_factor_card_to_sample_listener(factor_card, sample_factor_group_class_name) {
  var name_div = factor_card.find('.factor_name_inputs');
  var values_div = factor_card.find('.factor_values_inputs');

  var name_inputs = name_div.find('select,input');
  var values_inputs = values_div.find('select,input');

  // If name changes, the factor name also changes for each sample.
  name_inputs.change({
    'name_div': name_div,
    'class_name': sample_factor_group_class_name
  }, function (e) {
    var name_div = e.data.name_div;
    var class_name = e.data.class_name;

    for (var id in sample_forms) {
      var sample_form = sample_forms[id];

      var factor_group = sample_form.find('.' + class_name);
      var label = factor_group.find('label');
      var name = get_value_from_custom_dropdown(name_div);
      label.text('Factor 1: ' + name);
    }
  });

  // If values change, the values dropdown must also change.
  values_inputs.change({
    'values_div': values_div,
    'class_name': sample_factor_group_class_name
  }, function (e) {
    var values_div = e.data.values_div;
    var class_name = e.data.class_name;

    for (var id in sample_forms) {
      var sample_form = sample_forms[id];

      var factor_group = sample_form.find('.' + class_name);
      var select = factor_group.find('select');

      // First, remove all options.
      select.children('option:not(:disabled)').remove();

      // Then, retrieve list of values.
      var values = get_values_from_fluid_rows(values_div);

      for (var i = 0; i < values.length; i++) {
        var value = values[i][0];
        var option = $('<option>', {
          text: value
        });

        select.append(option);
      }
    }
  });
}

/**
 * Sets up factor 1 and factor 2 listeners so that appropriate information
 * is displayed in the factor card of each sample.
 */
function set_factor_to_sample_listeners(design_1_radio, design_2_radio, design_inputs) {
  var factor_1_card = design_inputs.children('.factor_card:first');
  var factor_2_card = design_inputs.children('.factor_card:last');

  set_factor_card_to_sample_listener(factor_1_card, 'sample_factors_1_group');
  set_factor_card_to_sample_listener(factor_2_card, 'sample_factors_2_group');

  // Also, depending on which radio is selected (i.e. what design the
  // experiment is), we need to show or hide the second factor.
  design_1_radio.click(function () {
    if (this.checked) {
      for (var id in sample_forms) {
        var sample_form = sample_forms[id];

        sample_form.find('.sample_factors_2_group').hide();
      }
    }
  });
  design_2_radio.click(function () {
    if (this.checked) {
      for (var id in sample_forms) {
        var sample_form = sample_forms[id];

        sample_form.find('.sample_factors_2_group').show();
      }
    }
  });
}

/**
 * Set project meta input.
 */
function set_proj_meta_input() {
  proj_form = $('#proj');

  // Set the project id header
  var html = proj_form.html();
  proj_form.html(html.replace(new RegExp('PROJECT_ID', 'g'), proj_id));

  // Set up contributors.
  var contributors_group = proj_form.find('.contributors_group');
  var contributors_div = contributors_group.children('.contributors_inputs');
  set_contributors(contributors_div);

  // Set up Factor 1 name and values.
  var factor_card = proj_form.find('.factor_card');
  set_factor(factor_card);

  // Enable experimental design.
  var design_group = proj_form.find('.experimental_design_group');
  var design_inputs = design_group.children('.experimental_design_inputs');
  var factor_hide_radio = design_group.find('#proj_design_1_radio');
  var factor_show_radio = design_group.find('#proj_design_2_radio');
  var div_to_toggle = factor_card.clone(true);
  div_to_toggle.children('h6').text('Factor 2');
  div_to_toggle.addClass('collapse');
  design_inputs.append(div_to_toggle);
  set_radio_collapse_toggle(factor_hide_radio, factor_show_radio, div_to_toggle);

  // Then, we must also set up listeners to show/hide appropriate factor 1
  // and factor 2 information for each sample.
  set_factor_to_sample_listeners(factor_hide_radio, factor_show_radio, design_inputs);

  proj_form.find('.save_btn').click(function () {
    save_proj();

    var header = $('#sample_meta_header');
    header.show();
    $('#sample_meta_common').show();
    scroll_to_ele(header);

  });

  // Disable 2-factor design if there are less than 8 samples.
  if (Object.keys(proj.samples).length < 8) {
    factor_show_radio.prop('disabled', true);
  }
}

/**
 * Enables/disables row depending on whether the checkbox is checked.
 */
function enable_disable_row(checkbox) {
    var form_group = checkbox.parent().parent().parent();

    var inputs = form_group.find('input:not(:checkbox)');
    var textareas = form_group.find('textarea');
    var selects = form_group.find('select');
    var buttons = form_group.find('button');

    if (checkbox.prop('checked')) {
      // Enable everything.
      form_group.removeClass('text-muted');

      inputs.prop('disabled', false);
      textareas.prop('disabled', false);
      selects.prop('disabled', false);
      // Then, fire change event for selects.
      selects.change();
      buttons.prop('disabled', false);
    } else {
      // Disable everything.
      form_group.addClass('text-muted');
      inputs.prop('disabled', true);
      textareas.prop('disabled', true);
      selects.prop('disabled', true);
      buttons.prop('disabled', true);
    }
}

/**
 * Extracts the custom class from the element.
 */
function get_custom_class(ele) {
  var classes = ele.attr('class');
  var class_list;

  if (classes != null) {
    class_list = classes.split(' ');

    for (var i = 0; i < class_list.length; i++) {
      var item = class_list[i];
      if (item.includes('_')) {
        return item;
      }
    }
  }

  return '';
}

/**
 * Removes the given form_group from the specified card of all samples.
 */
function remove_from_form(form_group, from_form_class_name) {
  var class_name = get_custom_class(form_group);

  for (var id in sample_forms) {
    var form = sample_forms[id];
    var from_form = form.find('.' + from_form_class_name);
    var find = from_form.find('.' + class_name);

    if (find.length > 0) {
      find.remove();
    }
  }
}
/**
 * Copies the given input group to the specified card of all samples.
 */
function copy_to_form(form_group, to_form_class_name, disable) {
  var class_name = get_custom_class(form_group);
  var index = class_order.indexOf(class_name);
  console.log(class_name);
  console.log(index);

  for (var id in sample_forms) {
    var form = sample_forms[id];
    var to_form = form.find('.' + to_form_class_name);

    // Make a copy and switch it up.
    var copy = form_group.clone(true);
    copy.find('*').each(function () {
      var ele = $(this);
      var ele_name = ele.attr('name');
      var ele_id = ele.attr('id');

      if (ele_name != null && ele_name != '' && ele_name.includes('_share_')) {
        ele.attr('name', ele_name.replace('_share_', '_' + id + '_'));
      }

      if (ele_id != null && ele_id != '' && ele_id.includes('_share_')) {
        ele.attr('id', ele_id.replace('_share_', '_' + id + '_'));
      }
    });

    copy.children('div:first').remove();
    copy.children('div:first').removeClass('pl-0');
    copy.find('input,select,button,textarea').prop('disabled', disable);

    // First, construct an array of classes present in the form.
    var indices = [];
    for (var i = 0; i < class_order.length; i++) {
      var temp_class = class_order[i];
      if (to_form.find('.' + temp_class).length > 0) {
        indices.push(i);
      }
    }

    console.log(indices);

    // If the form is empty, just append the element into the form.
    if (indices.length == 0) {
      to_form.append(copy);
    } else if (indices.includes(index)) {
      // We have to replace the form group already in the form.
      var to_replace = to_form.find('.' + class_order[index]);
      to_replace.after(copy);
      to_replace.remove();
    } else {
      // Otherwise, let's calculate where it should be added.
      for (var i = 0; i < indices.length; i++) {
        var temp_index = indices[i];

        // As soon as index < temp_index, we have to add it before.
        if (index < temp_index) {
          to_form.find('.' + class_order[temp_index]).before(copy);
          break;
        } else if (i == (indices.length - 1)) {
          to_form.find('.' + class_order[temp_index]).after(copy);
        }
      }
    }
  }
}

/**
 * Get closest custom parent.
 */
function get_closest_custom_parent(start) {
  var class_name = "";
  var custom_parent = start;

  while (!class_name.includes('_')) {
    custom_parent = custom_parent.parent();
    class_name = get_custom_class(custom_parent);
  }

  return custom_parent;
}

/**
 * Refresh which inputs are common and which are sample-specific.
 */
function refresh_checkbox(checkbox) {
  var form_group = checkbox;
  var class_name = "";

  while (!(class_name.includes('_') && class_name.includes('group'))) {
    form_group = form_group.parent();
    class_name = get_custom_class(form_group);
  }

  // Copy to different places depending on whether the checkbox is checked
  // or unchecked.
  var common_form_class_name = 'sample_common_form';
  var specific_form_class_name = 'sample_specific_form';
  if (checkbox.prop('checked')) {
    copy_to_form(form_group, common_form_class_name, true);
    remove_from_form(form_group, specific_form_class_name);
  } else {
    copy_to_form(form_group, specific_form_class_name, false);
    remove_from_form(form_group, common_form_class_name);
  }
}

/**
 * Sets enabling/disabling of rows in the common metadata form.
 */
function set_common_checkboxes(form) {
  // First, find all the checkboxes.
  var checkboxes = form.find('input:checkbox');
  checkboxes.click(function () {
    var checkbox = $(this);
    refresh_checkbox(checkbox);
    enable_disable_row(checkbox);
  });
  checkboxes.click();

  // Also, whenever an input or select is changed, fire the checkbox.
  var inputs = form.find('input:not(:checkbox),select,button,textarea');
  inputs.change(function () {
    var input = $(this);
    var custom_parent = get_closest_custom_parent(input);
    var checkbox = custom_parent.find('input:checkbox');

    while (custom_parent.length < 1) {
      custom_parent = get_closest_custom_parent(custom_parent);
      checkbox = custom_parent.find('input:checkbox');
    }

    checkbox.click();
  });
}

/**
 * Sets few of the shared inputs for the common input form and
 * individual input forms.
 */
function set_shared_inputs(form) {
  var organism_select = form.find('.sample_organism_select');
  var lifestage_dropdown = form.find('.sample_life-stage_inputs');
  var tissue_dropdown = form.find('.sample_tissue_inputs');
  var chars_inputs = form.find('.sample_characteristics_inputs');
  var sequenced_molecules_dropdown = form.find('.sample_sequenced_molecules_inputs');

  set_organisms_select(organism_select);
  set_custom_dropdown(lifestage_dropdown, life_stages);
  set_custom_dropdown(tissue_dropdown, tissues);
  set_fluid_input_rows(chars_inputs);
  set_custom_dropdown(sequenced_molecules_dropdown, sequenced_molecules);

  // Then, set up div toggle for single-end reads, which need read lenght and
  // standard deviation.
  var single_show_radio = form.find('.sample_read_type_single');
  var single_hide_radio = form.find('.sample_read_type_paired');
  var div_to_toggle = form.find('.sample_read_type_collapse');
  set_radio_collapse_toggle(single_hide_radio, single_show_radio, div_to_toggle);
}

/**
 * Set the common metadata form.
 */
function set_common_meta_input() {
  common_form = $('#sample_common_form');
  var form = common_form.children('form');

  // Set checkboxes.
  set_common_checkboxes(form);

  // Set shared inputs.
  set_shared_inputs(form);

  // Set save & apply button.
  common_form.find('.save_btn').click(function () {
    save_proj();

    var meta = $('#sample_meta')
    $('#sample_meta').show();
    scroll_to_ele(meta);
  });
}

/**
 * Set autocomplete suggestions for the given button.
 */
function set_suggestions(field, suggestions) {
  field.autocomplete({
    source: suggestions
  });
}

/**
 * Get all characteristics except those in this sample.
 */
function get_all_characteristics_except(id) {
  var characteristics = get_all_characteristics();

  var fields = sample_characteristic_fields[id];
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var char_id = 'sample_characteristic_' + id + '_' + i;
    var char = field.children('#' + char_id).val();

    if (characteristics[char] != null && char != '' && char != null) {
      delete characteristics[char];
    }
  }

  return characteristics;
}

/**
 * Get all characteristics.
 */
function get_all_characteristics() {
  characteristics = {};

  for (var id in sample_characteristic_fields) {
    var fields = sample_characteristic_fields[id];

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var char_id = 'sample_characteristic_' + id  + '_' + i;
      var detail_id = 'sample_detail_' + id + '_' + i;

      var char = field.children('#' + char_id).val();
      var detail = field.children('#' + detail_id).val();

      if (char != '' && char != null) {
        if (characteristics[char] == null) {
          if (detail != '' && detail != null) {
            characteristics[char] = [detail];
          } else {
            characteristics[char] = [];
          }
        } else if (!characteristics[char].includes(detail) && detail != '' && detail != null) {
          characteristics[char].push(detail);
        }
      }
    }
  }
  return characteristics;
}

/**
 * Get all contributors except those in this sample.
 */
function get_all_contributors_except(id) {
  var contributors = get_all_contributors();

  var fields = sample_contributor_fields[id];
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var contributor = field.children('input').val();

    if (contributor != '' && contributor != null) {
      var index = contributors.indexOf(contributor);

      if (index > -1) {
        contributors.splice(index, 1);
      }
    }
  }

  return contributors;
}

/**
* Gets all contributors.
*/
function get_all_contributors() {
  contributors = [];

  // First loop through project contributors.
  for (var i = 0; i < proj_contributor_fields.length; i++) {
    var field = proj_contributor_fields[i];
    var contributor = field.children('input').val();

    if (contributor != '' && contributor != null) {
      if (!contributors.includes(contributor)) {
        contributors.push(contributor);
      }
    }
  }

  // Then, loop through each sample.
  for (var id in sample_contributor_fields) {
    for (var i = 0; i < sample_contributor_fields[id].length; i++) {
      var field = sample_contributor_fields[id][i];
      var contributor = field.children('input').val();

      if (contributor != '' && contributor != null) {
        if (!contributors.includes(contributor)) {
          contributors.push(contributor);
        }
      }
    }
  }

  return contributors;
}

/**
 * Set samples meta input.
 */
function set_samples_meta_input() {
  var sample_form = $('.sample_collapse');

  // Set sorted names.
  set_sorted_names();

  // Add samples in sorted order (by name).
  for (var i = 0; i < sorted_names.length; i++) {
    var name = sorted_names[i];
    var id = names_to_ids[name];
    var new_sample_form = sample_form.clone(true);

    // Replace all instances of SAMPLEID to the id.
    var html = new_sample_form.html();
    new_sample_form.html(html.replace(new RegExp('SAMPLEID', 'g'), id));

    sample_forms[id] = new_sample_form;


    // var char_id = 'sample_characteristic_' + id + '_0';
    // var detail_id = 'sample_detail_' + id + '_0';
    // var sample_characteristic_0_char = sample_characteristic_0.children('#' + char_id);
    // var sample_characteristic_0_detail = sample_characteristic_0.children('#' + detail_id);
    // sample_characteristic_0_char.focusin({'id':id}, function(e) {
    //   var id = e.data.id;
    //   var characteristics = get_all_characteristics_except(id);
    //
    //   set_suggestions($(this), Object.keys(characteristics));
    // });
    // sample_characteristic_0_detail.focusin({char: sample_characteristic_0_char}, function(e) {
    //   var char = e.data.char.val();
    //   var characteristics = get_all_characteristics();
    //
    //   if (char != '' && char != null && characteristics[char] != null) {
    //     set_suggestions($(this), characteristics[char]);
    //   }
    // });

    // Set paired end listener.
    // set_paired_end(id, new_sample_form);

    // Set the reads table for this sample.
    // set_reads_table(id, new_sample_form);

    // Save changes button.
    var save_changes_btn = new_sample_form.find('.save_btn');
    save_changes_btn.click(save_proj);

    // Append new form.
    $('#sample_card').append(new_sample_form);
  }

  // Then, set the button handler.
  var dropdown = $('#sample_choices');
  set_choose_sample_button(dropdown, sample_forms);
}

/**
 * Sets characteristic selection dropdown options for the control modal.
 */
function set_characteristic_options(dropdown) {
  for (var char in chars_to_samples) {
    // If the number of samples with this characteristic is equal to
    // the total number of samples, this means that every sample has
    // this characteristic.
    if (Object.keys(proj.samples).length == chars_to_samples[char].length) {
      // The characteristic is valid to be a control only if it has
      // 2+ details.
      if (Object.keys(chars_details_to_samples[char]).length > 1) {
        var option = $('<option>', {
          text: char,
          value: char
        });
        dropdown.append(option);

      }
    }
  }
}

/**
 * Sets detail selection dropdown options for the control modal.
 */
function set_detail_options(dropdown, characteristic) {
  // First, reset the details dropdown.
  dropdown.children('option:disabled').prop('selected', true);
  dropdown.children('option:not(:disabled)').remove();

  for (var detail in chars_details_to_samples[characteristic]) {
    var option = $('<option>', {
      text: detail,
      value: detail
    });
    dropdown.append(option);
  }

  dropdown.prop('disabled', false);
}

/**
 * Sets the choose controls modal with the appropriate information.
 */
function set_choose_controls_modal(modal) {
  var design = proj.design;
  var description = modal.find('#design_description');
  var header = description.children('#design_header');
  var tooltip = modal.find('#start_analysis_tooltip');
  var start_btn = modal.find('#start_analysis_btn');
  var control_0 = modal.find('#proj_control_0');
  var control_1 = modal.find('#proj_control_1');

  var controls;
  if (proj.design == 1) {
    controls = [control_0];
  } else {
    controls = [control_0, control_1];
  }

  tooltip.tooltip();

  // Set characteristic and detail dropdowns.
  for (var i = 0; i < controls.length; i++) {
    var ctrl = controls[i];

    var char_id = 'proj_control_char_' + i;
    var detail_id = 'proj_control_detail_' + i;
    var list_id = 'control_samples_' + i;
    var char = ctrl.find('#' + char_id);
    var detail = ctrl.find('#' + detail_id);
    var list = ctrl.find('#' + list_id);

    set_characteristic_options(char);

    // Then, bind to change.
    char.change({
      'tooltip': tooltip,
      'btn': start_btn,
      'detail': detail,
      'list': list
    }, function (e) {
      // First, disable start analysis button,
      var tooltip = e.data.tooltip;
      var btn = e.data.btn;
      tooltip.tooltip('enable');
      btn.css('pointer-events', 'none');
      btn.prop('disabled', true);

      // Hide list of samples.
      e.data.list.hide();

      var val = $(this).children('option:selected').val();
      set_detail_options(e.data.detail, val);
    });

    detail.change({
      'list': list,
      'tooltip': tooltip,
      'btn': start_btn
    }, function (e) {
      // First, disable start analysis button,
      var tooltip = e.data.tooltip;
      var btn = e.data.btn;
      tooltip.tooltip('enable');
      btn.css('pointer-events', 'none');
      btn.prop('disabled', true);


      // Hide list of samples.
      e.data.list.hide();
    });


    // Bind validate button.
    var validate_btn = modal.find('#validate_controls_btn');
    validate_btn.click({
      'tooltip': tooltip,
      'btn': start_btn,
      'controls': controls
    }, function (e) {
      var tooltip = e.data.tooltip;
      var btn = e.data.btn;
      var valid = verify_controls(e.data.controls);

      // If the controls are valid, enable the start analysis button.
      if (valid) {
        tooltip.tooltip('disable');
        btn.css('pointer-events', 'auto');
        btn.prop('disabled', false);
      } else {
        tooltip.tooltip('enable');
        btn.css('pointer-events', 'none');
        btn.prop('disabled', true);
      }
    });

    // Finally, bind start analysis button.
    start_btn.click({'controls': controls}, function (e) {
      set_controls(e.data.controls);
      write_proj(start_analysis);

      // Then, dismiss the project controls form and show progress screen.
      $('#choose_controls_modal').modal('hide');
      set_progress_bar_queued();
      goto_progress();
    });
  }

  // Depending on the project design, show a different description.
  var text;
  var to_hide;
  if (design == 1) {
    text = '1-factor';
    to_hide = description.children('#design_2_description');
  } else if (design == 2) {
    text = '2-factor';
    to_hide = description.children('#design_1_description');
    modal.find('#proj_control_1').show();
  }

  header.text(header.text().replace('FACTOR', text));
  to_hide.hide();
}

/**
 * Set and finalize project. Then, start analysis.
 */
function start_analysis() {
  // Set project.
  $.ajax({
    type: 'POST',
    url: 'cgi_request.php',
    data: {
      action: 'set_proj',
      id: proj_id
    },
    success:function(out) {
      console.log(out);
      if (out.includes("successfully")) {
        // Finalize project.
        $.ajax({
          type: 'POST',
          url: 'cgi_request.php',
          data: {
            action: 'finalize_proj',
            id: proj_id
          },
          success:function(out) {
            console.log(out);
            if (out.includes("successfully")) {
              $.ajax({
                type: 'POST',
                url: 'cgi_request.php',
                data: {
                  action: 'do_all',
                  id: proj_id
                },
                success:function(out) {
                  console.log(out);
                }
              });
            }
          }
        });
      }
    }
  });
}


/**
 * Sets controls to the global proj object.
 */
function set_controls(controls) {
  ctrls = {};
  for (var i = 0; i < controls.length; i++) {
    var ctrl = controls[i];
    var char = ctrl.children('div:nth-of-type(1)').find('option:selected').val();

    var items = ctrl.find('li');
    if (items == null) {
      ctrl.find('select').addClass('is-invalid');
    } else {
      var names = [];
      items.each(function() {
        names.push($(this).text());
      });

      // Add these to the dictionary.
      for (var j = 0; j < names.length; j++) {
        var name = names[j];
        var id = names_to_ids[name];

        ctrls[id] = char;
      }

      // Once this is done, set the project chars dictionary.
      proj.ctrls = ctrls;
    }
  }
}

/**
 * Verifies the controls.
 * We only need to verify whether the two controls are different.
 * (This only applies to 2-factor design.)
 */
function verify_controls(controls) {
  chars = {};
  for (var i = 0; i < controls.length; i++) {
    var ctrl = controls[i];

    var char_id = 'proj_control_char_' + i;
    var detail_id = 'proj_control_detail_' + i;
    var list_id = 'control_samples_' + i;
    var char_dropdown = ctrl.find('#' + char_id);
    var detail_dropdown = ctrl.find('#' + detail_id);
    var list = ctrl.find('#' + list_id);
    var char = char_dropdown.children('option:selected').val();
    var detail = detail_dropdown.children('option:selected').val();
    char_dropdown.removeClass('is-invalid');
    detail_dropdown.removeClass('is-invalid');
    list.hide();
    list.find('ul li').remove();

    // First, make sure something is selected.
    if (char == null || char == '') {
      char_dropdown.addClass('is-invalid');
    }
    if (detail == null || detail == '') {
      detail_dropdown.addClass('is-invalid');
    }

    // Then, check whether any has the same characteristic-detail pair.
    if (!(char in chars)) {
      chars[char] = {};
    }
    if (!(detail in chars[char])) {
      chars[char][detail] = detail_dropdown;
    } else {
      detail_dropdown.addClass('is-invalid');
      chars[char][detail].addClass('is-invalid');
    }
  }

  // Then, show selected controls for ones that are not invalid.
  var valid = true;
  for (var i = 0; i < controls.length; i++) {
    var ctrl = controls[i];

    var char_id = 'proj_control_char_' + i;
    var detail_id = 'proj_control_detail_' + i;
    var list_id = 'control_samples_' + i;
    var char_dropdown = ctrl.find('#' + char_id);
    var detail_dropdown = ctrl.find('#' + detail_id);
    var list = ctrl.find('#' + list_id);
    var char = char_dropdown.children('option:selected').val();
    var detail = detail_dropdown.children('option:selected').val();

    if (!char_dropdown.hasClass('is-invalid') && !detail_dropdown.hasClass('is-invalid')) {
      var samples = chars_details_to_samples[char][detail];
      for (var j = 0; j < samples.length; j++) {
        var sample = samples[j];
        var item = $('<li>', {
          text: proj.samples[sample].name
        });
        list.children('ul').append(item);
      }
      list.show();
    } else {
      valid = false;
    }
  }

  return valid;
}

/**
 * Sets the global charicteristic-details-to-samples dictionary.
 */
function set_chars_details_to_samples() {
  // Reset
  chars_to_samples = {};
  chars_details_to_samples = {};

  for (var id in proj.samples) {
    var sample = proj.samples[id];

    for (var char in sample.meta.chars) {
      var detail = sample.meta.chars[char];

      // Deal with chars_details_to_samples first
      if (!(char in chars_details_to_samples)) {
        chars_details_to_samples[char] = {};
      }

      if (!(detail in chars_details_to_samples[char])) {
        chars_details_to_samples[char][detail] = [id];
      } else {
        chars_details_to_samples[char][detail].push(id);
      }

      // Then, deal with chars_to_samples.
      if (!(char in chars_to_samples)) {
        chars_to_samples[char] = [id];
      } else {
        if (!chars_to_samples[char].includes(id)) {
          chars_to_samples[char].push(id);
        }
      }
    }
  }
}

/**
 * Saves all inputs to temporary json, then
 */
function show_verify_meta_modal() {
  // Save all inputs.
  save_proj();

  // Verify.
  var valid = validate_all_meta();

  // Depending on whether or not all the input is valid,
  // show different modal.
  var modal;
  if (true) {
    modal = $('#choose_controls_modal');

    var replacement = controls_modal.clone(true);
    modal.replaceWith(replacement);
    modal = replacement;

    set_chars_details_to_samples();
    set_choose_controls_modal(modal);
  } else {
    modal = $('#check_meta_modal');
  }

  modal.modal('show');
}

/**
 * Set meta input form.
 */
function set_meta_input() {
  // Then, set the samples metadata.
  set_samples_meta_input();

  // We have to set the common meta input form after setting up the samples
  // because this function assumes that the global sample_forms variable
  // is populated.
  set_common_meta_input();

  // Deal with project meta input form last.
  set_proj_meta_input();

  // set_meta_input_fields();

  // Then, add listener to verify metadata button.
  $('#verify_meta_btn').click(show_verify_meta_modal);
}

/*
 * Show meta input form. Note that all other elements
 * will be hidden at this point.
 */
function show_meta_input() {
  // Begin scrolling to the top.
  var obj = {pos: $(window).scrollTop()};
  var transform = anime({
    targets: obj,
    pos: 0,
    round: 1,
    easing: 'easeInOutQuart',
    update: function() {
      $(window).scrollTop(obj.pos);
    },
    complete: function(anim) {
      // Hide all other elements.
      $('#main_content_div').hide();
      $('#ftp_info_div').hide();
      $('#raw_reads_div').hide();
    }
  });

  // Show meta input.
  $('#progress_bar_container').show();
  $('#proj_meta_header').show();
  $('#proj_meta').show();
}

/**
 * Fetch custom sample names and replace the default names.
 */
function fetch_sample_names() {
  var input_id = 'name_input_SAMPLEID';
  var valid = true;

  var names = {};
  for (var id in proj.samples) {
    var input = $('#' + input_id.replace('SAMPLEID', id));
    var val = input.val();
    input.removeClass('is-invalid');

    // If the input is empty, just use default (i.e. do nothing).
    if (val != '') {
      if (!(val in names)) {
        names[val] = input;
      } else {
        input.addClass('is-invalid');
        names[val].addClass('is-invalid');
        valid = false;
      }
    }
  }

  // Only set the names if everything is valid.
  if (valid) {
    for (var id in proj.samples) {
      var input = $('#' + input_id.replace('SAMPLEID', id));
      var val = input.val();

      // If the input is empty, just use default (i.e. do nothing).
      if (val != '') {
        proj.samples[id].name = val;
      }
    }
  }

  return valid;
}

/**
 * Sets the global variables for sorting samples by name.
 */
function set_sorted_names() {
  // Before going on, create a separate list that has the
  // sample ids sorted by name.
  names_to_ids = {};
  for (var id in proj.samples) {
    names_to_ids[proj.samples[id].name] = id;
  }
  console.log(names_to_ids);
  sorted_names = Object.keys(names_to_ids).sort();
  console.log(sorted_names);
}

/**
 * Set and show meta input form.
 */
function meta_input() {
  var valid = fetch_sample_names();

  if (valid) {
    // First, save and set the project.
    write_proj(function () {
      $.ajax({
        type: 'POST',
        url: 'cgi_request.php',
        data: {
          id: proj_id,
          action: 'set_proj'
        },
        success:function(out) {
          console.log(out);
        }
      });
    });

    $('#sample_names_modal').modal('hide');

    set_meta_input();

    show_meta_input();
  }
}

/**
 * Gets query parameters from url.
 */
function get_url_params() {
  var url_params = new URLSearchParams(window.location.search);

  return url_params;
}

function substring_matcher(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};

/**
 * Validates all meta input. If everything is good, returns
 * whether everything is valid as a boolean.
 */
function validate_all_meta() {
  // First, validate individual forms.
  proj_valid = validate_proj_meta();
  console.log('proj: ' + proj_valid);

  for (var id in proj.samples) {
    var sample_valid = validate_sample_meta(id);
    console.log(id + ': ' + sample_valid);
    proj_valid = proj_valid && sample_valid;
  }

  // Then, we must check whether all samples share either 1 (for
  // 1-factor design) or 2 (for 2-factor design) characteristics.
  var design = proj.design;
  // Loop through each sample and check characteristic.
  if (design == 1) {

  } else if (design == 2) {

  }

  console.log('entire proj: ' + proj_valid);
  return proj_valid;
}

/**
 * Helper function to test whether a string is an email.
 */
function isEmail(email) {
  var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
}

/**
 * Validates project meta input. If everything is good, returns
 * whether the project is valid.
 */
function validate_proj_meta() {
  var proj_meta = get_proj_meta();
  var meta = proj_meta.meta;
  var valid = true;

  // We don't have to check design because it is a radio button.
  for (var cat in meta) {
    var field = meta_input_fields.meta[cat];
    var val = proj_meta.meta[cat];

    switch (cat) {
      // Contributors must be dealt slightly differently.
      // We just need to make sure the FIRST field is populated.
      case 'contributors':
        field = field[0].children('input');
        val = field.val();
      case 'title':
      case 'abstract':
        // These just have to be filled out.
        if (val != '' && val != null) {
          field.removeClass('is-invalid');
        } else {
          field.addClass('is-invalid');
          valid = false;
        }
        break;
      case 'email':
        if (isEmail(val)) {
          field.removeClass('is-invalid');
        } else {
          field.addClass('is-invalid');
          valid = false;
        }
        break;
      default:
        break;
    }
  }

  return valid;
}

/**
 * Validate pairs (only for paired-end samples).
 */
function validate_read_pairs() {

}

/**
 * Validates sample meta input. If everything is good, returns
 * whether the sample is valid.
 */
function validate_sample_meta(id) {
  var sample_meta = get_sample_meta(id);
  var meta = sample_meta.meta;
  var valid = true;

  // Loop through each field.
  for (var cat in sample_meta) {
    // Skip meta.
    if (cat == 'meta') {
      continue;
    }

    var field = meta_input_fields.samples[id][cat];
    var val = sample_meta[cat];

    switch (cat) {
      case 'name':
      case 'organism':
      case 'length':
      case 'stdev':
        // These just have to be filled out.
        if (val != '' && val != null && val != 0) {
          field.removeClass('is-invalid');
        } else {
          field.addClass('is-invalid');
          valid = false;
        }
        break;

      case 'type':
        // If the reads are paired-end, we need to make sure
        // correct pairs were selected.
        if (val == 2) {
          // Each selection must be unique.
          var reads = [];
          var pairs = sample_meta.reads;
          for (var i = 0; i < pairs.length; i++) {
            for (var j = 0; j < pairs[i].length; j++) {
              var read = pairs[i][j];

              // If the read is null or empty, we need to prompt the user
              // to make a selection.
              if (read != '' && read != null) {
                var dropdown = meta_input_fields.samples[id][cat]
                  .find('select option[value="' + read + '"]:selected').parent();
                if (!reads.includes(read)) {
                  dropdown.removeClass('is-invalid');
                } else {
                  dropdown.addClass('is-invalid');
                  valid = false;
                  reads.push(read);
                }
              } else {
                var dropdowns = meta_input_fields.samples[id][cat].find('select option:selected');
                dropdowns.filter(':disabled');
                dropdowns.filter(':hidden');
                dropdowns.parent().addClass('is-invalid');
                valid = false;
              }
            }
          }
        }

      default:
        break;
    }
  }

  // Loop through fields in meta.
  for (var cat in meta) {
    var field = meta_input_fields.samples[id].meta[cat];
    var val = sample_meta.meta[cat];

    switch (cat) {
      // Characteristics must be dealt slightly different.
      case 'chars':
        var chars = Object.keys(val);
        var n_chars = chars.length;
        var field = field[0].children('input');
        if (n_chars > 0) {
          // Then, make sure each characteristic is unique.
          for (var i = 0; i < n_chars; i++) {
            var char = chars[i];
            var fields = meta_input_fields.samples[id].meta[cat];
            var duplicates = [];
            for (var j = 0; j < fields.length; j++) {
              var char_field = fields[j].find('input:nth-of-type(1)');
              var detail_field = fields[j].find('input:nth-of-type(2)');
              if (char_field.val() == char) {
                duplicates.push([char_field, detail_field]);
              } else {
                char_field.removeClass('is-invalid');
                detail_field.removeClass('is-invalid');
              }
            }
          }
          if (duplicates.length > 1) {
            for (var j = 0; j < duplicates.length; j++) {
              duplicates[j][0].addClass('is-invalid');
              duplicates[j][1].addClass('is-invalid');
              valid = false;
            }
          } else if (duplicates.length == 1) {
            duplicates[0][0].removeClass('is-invalid');
            duplicates[0][1].removeClass('is-invalid');
          }
          // field.removeClass('is-invalid');
        } else {
          field.addClass('is-invalid');
          valid = false;
        }
        break;

      // Contributors must be dealt slightly differently.
      // We just need to make sure the FIRST field is populated.
      case 'contributors':
        field = field[0].children('input');
        val = field.val();
      case 'title':
      case 'description':
      case 'source':
        // These just have to be filled out.
        if (val != '' && val != null) {
          field.removeClass('is-invalid');
        } else {
          field.addClass('is-invalid');
          valid = false;
        }
        break;
    }
  }

  return valid;
}

/**
 * Sets global dictionary for meta input fields (proj + sample).
 */
function set_meta_input_fields() {
  meta_input_fields = get_proj_input_fields();
  meta_input_fields['samples'] = {};

  for (var id in proj.samples) {
    meta_input_fields.samples[id] = get_sample_input_fields(id);
  }
}

/**
 * Returns a dictionary for project input fields.
 */
function get_proj_input_fields() {
  var proj_input_fields = {}
  proj_input_fields['meta'] = {};
  proj_input_fields.meta['title'] = proj_form.find('#proj_title');
  proj_input_fields.meta['abstract'] = proj_form.find('#proj_abstract');
  proj_input_fields.meta['corresponding'] = {
    'email': proj_form.find('#proj_corresponding_email'),
    'name': proj_form.find('#proj_corresponding_name')
  };
  proj_input_fields.meta['contributors'] = proj_contributor_fields;
  proj_input_fields.meta['SRA_center_code'] = proj_form.find('#proj_sra_center_code');
  proj_input_fields['design'] = proj_form.find('#proj_design');

  return proj_input_fields;
}

/**
 * Returns a dictionary for sample input fields.
 */
function get_sample_input_fields(id) {
  var form = sample_forms[id];
  var sample_input_fields = {};
  sample_input_fields['meta'] = {};
  sample_input_fields['name'] = form.find('#sample_name_' + id);
  sample_input_fields.meta['description'] = form.find('#sample_description_' + id);
  sample_input_fields.meta['contributors'] = sample_contributor_fields[id];
  sample_input_fields.meta['source'] = form.find('#sample_source_' + id);
  sample_input_fields.meta['chars'] = sample_characteristic_fields[id];
  sample_input_fields['type'] = form.find('#read_type_' + id);
  sample_input_fields['organism'] = form.find('#sample_organism_' + id);
  sample_input_fields['length'] = form.find('#sample_length_' + id);
  sample_input_fields['stdev'] = form.find('#sample_stdev_' + id);

  return sample_input_fields;
}

/**
 * Sets all the metadata with values from the form.
 */
function set_all_meta() {
  // Set project meta.
  set_proj_meta(get_proj_meta());

  for (var id in sample_forms) {
    set_sample_meta(id, get_sample_meta(id));
  }
}

/**
 * Set global proj dictionary with the values given.
 */
function set_proj_meta(meta) {
  for (var cat in meta) {
    var val = meta[cat];

    switch (cat) {
      case 'meta':
        break;

      case 'design':
      default:
        proj[cat] = val;
    }
  }

  // Deal with meta field separately.
  for (var cat in meta.meta) {
    var val = meta.meta[cat];

    switch (cat) {
      case 'title':
      case 'abstract':
      case 'contributors':
      case 'SRA_center_code':
      case 'email':
      default:
        proj.meta[cat] = val;
    }
  }
}

/**
 * Set the specified sample in the global proj dictionary with
 * the values given.
 */
function set_sample_meta(id, meta) {
  for (var cat in meta) {
    var val = meta[cat];

    switch (cat) {
      case 'meta':
        break;

      // If reads is present, that means it is paired.
      case 'reads':
        var new_reads = [];
        for (var i = 0; i < val.length; i++) {
          var pair = val[i];
          var read_1 = pair[0];
          var read_2 = pair[1];
          var new_pair = [proj.samples[id][cat][read_1],
                            proj.samples[id][cat][read_2]];

          new_reads.push(new_pair);
        }
        proj.samples[id][cat] = new_reads;
        break;

      case 'name':
      case 'type':
      case 'organism':
      case 'ref_ver':
      case 'length':
      case 'stdev':
      default:
        proj.samples[id][cat] = val;
    }
  }

  for (var cat in meta.meta) {
    var val = meta.meta[cat];

    switch (cat) {
      case 'title':
      case 'contributors':
      case 'source':
      case 'chars':
      case 'description':
        proj.samples[id].meta[cat] = val;
    }
  }
}

/**
 * Get project metadata inputs.
 */
function get_proj_meta() {
  var proj_meta = {};
  proj_meta['meta'] = {};
  proj_meta.meta['title'] = meta_input_fields.meta['title'].val();
  proj_meta.meta['abstract'] = meta_input_fields.meta['abstract'].val();

  // Get contributors.
  proj_meta.meta['contributors'] = [];
  for (var i = 0; i < proj_contributor_fields.length; i++) {
    var field = proj_contributor_fields[i];
    var contributor = field.children('input').val();

    if (contributor != '' && contributor != null) {
      proj_meta.meta['contributors'].push(contributor);
    }
  }
  proj_meta.meta['email'] = meta_input_fields.meta['email'].val();
  proj_meta.meta['SRA_center_code'] = meta_input_fields.meta['SRA_center_code'].val();
  proj_meta['design'] = parseInt(meta_input_fields['design'].find('input:checked').val());

  return proj_meta;
}

/**
 * Get sample metadata inputs.
 */
function get_sample_meta(id) {
  var form = sample_forms[id];
  var sample_input_fields = meta_input_fields.samples[id];

  var sample_meta = {};
  sample_meta['meta'] = {};

  sample_meta['name'] = sample_input_fields['name'].val();
  sample_meta.meta['description'] = sample_input_fields.meta['description'].val();

  // Get contributors.
  sample_meta.meta['contributors'] = [];
  for (var i = 0; i < sample_contributor_fields[id].length; i++) {
    var field = sample_contributor_fields[id][i];
    var contributor = field.children('input').val();

    if (contributor != '' && contributor != null) {
      sample_meta.meta['contributors'].push(contributor);
    }
  }

  // Get characteristics.
  sample_meta.meta['chars'] = {};
  for (var i = 0; i < sample_characteristic_fields[id].length; i++) {
    var field = sample_characteristic_fields[id][i];
    var char = field.children('input:nth-of-type(1)').val();
    var detail = field.children('input:nth-of-type(2)').val();

    // Add to dictionary only if both char and detail is populated.
    if (char != '' && char != null && detail != '' && detail != null) {
      sample_meta.meta['chars'][char] = detail;
    }
  }

  sample_meta.meta['source'] = sample_input_fields.meta['source'].val();
  sample_meta['type'] = parseInt(sample_input_fields['type'].find('input:checked').val());

  // If reads are paired-end, we need to replace the reads dictionary as well.
  if (sample_meta['type'] == 2) {
    sample_meta['reads'] = [];
    for (var i = 0; i < sample_pair_fields[id].length; i++) {
      var field = sample_pair_fields[id][i];
      var pair_1 = field.children('select:nth-of-type(1)').val();
      var pair_2 = field.children('select:nth-of-type(2)').val();

      var pair = [pair_1, pair_2];
      sample_meta['reads'].push(pair);
    }
  }

  // Parse organism.
  var org = sample_input_fields['organism'].val();
  if (org != '' && org != null) {
    var split = org.split('_');
    sample_meta['organism'] = split[0] + '_' + split[1];
    sample_meta['ref_ver'] = split.slice(2).join('_');
  } else {
    sample_meta['organism'] = '';
    sample_meta['ref_ver'] = '';
  }

  var length = sample_input_fields['length'].val();
  if (length != '' && length != null) {
    sample_meta['length'] = parseInt(length);
  } else {
    sample_meta['length'] = 0;
  }

  var stdev = sample_input_fields['stdev'].val();
  if (stdev != '' && stdev != null) {
    sample_meta['stdev'] = parseInt(stdev);
  } else {
    sample_meta['stdev'] = 0;
  }

  return sample_meta;
}

/**
 * Writes the global proj variable as json to the project temp
 * directory.
 */
function write_proj(callback) {
  // Send ajax request.
  $.ajax({
    type: 'POST',
    url: 'jsonify.php',
    data: {
      id: proj_id,
      json: JSON.stringify(proj, null, 4)
    },
    success:function(out) {
      console.log(out);

      if (typeof callback === 'function') {
        callback();
      }
    }
  });
}

/**
 *
 *
 */

// Global variables.
var proj_id;
var proj;
var organisms;
var meta_input_fields;
var ftp_pw;
var raw_reads_div;
var controls_modal;
var dropdown_items = {};
var proj_form;
var common_form;
var current_sample_form;
var sample_forms = {};
var names_to_ids;
var sorted_names;
var organisms;
var import_export_dropdown;
var proj_contributor_fields = [];
var proj_factor_0_fields = [];
var proj_factor_1_fields = [];
var sample_characteristic_fields = {};
var sample_pair_fields = {};
var chars_to_samples = {};
var chars_details_to_samples = {};
var progress = {
  'new':              0,
  'raw_reads':        1,
  'inferred':         2,
  'set':              3,
  'finalized':        4,
  'qc_queued':        5,
  'qc_started':       6,
  'qc_finished':      7,
  'quant_queued':     8,
  'quant_started':    9,
  'quant_finished':   10,
  'diff_queued':      11,
  'diff_started':     12,
  'diff_finished':    13,
  'server_open':      14
  }
var factor_names_to_class_ids = {
  'genotype':           'sample_genotype_group',
  'growth conditions':  'sample_growth_conditions_group',
  'organism strain':    'sample_organism_strain_group',
  'life-stage':         'sample_life-stage_group',
  'tissue':             'sample_tissue_group'
};
var life_stages = [
  'L1', 'L2', 'L3', 'L4', 'Young Adult', 'Adult', 'Embryo', 'Mixed'
];
var tissues = [
  'Whole Organism (Multi-worm)',
  'Whole Organism (Single worm)',
  'Dissected Tissue'
];
var sequenced_molecules = [
  'Poly-A Purified',
  'Total RNA',
  'Tissue-specific tagged poly-A RNA',
  'Tissue-specific tagged total RNA'
];
var class_order = [
  'sample_genotype_group',
  'sample_growth_conditions_group',
  'sample_rna_extraction_group',
  'sample_library_preparation_group',
  'sample_miscellaneous_group',
  'sample_organism_group',
  'sample_organism_strain_group',
  'sample_life-stage_group',
  'sample_tissue_group',
  'sample_characteristics_group',
  'sample_sequenced_molecules_group',
  'sample_read_type_group'
];

// Global variables for holding interval ids.
var project_progress_interval;
var qc_output_interval;
var quant_output_interval;
var diff_output_interval;

// To run when page is loaded.
$(document).ready(function() {
  url_params = get_url_params();
  console.log(url_params);
  // If we are given an id, we need to resume where we left off with that project.
  if (url_params.has('id')) {
    proj_id = url_params.get('id');

    // Go to whatever step we need to go to.
    get_proj_status();
  }

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

  raw_reads_div = $('#raw_reads_div').clone(true);
  controls_modal = $('#choose_controls_modal').clone(true);

  // Fetch server status.
  get_server_status();
});
