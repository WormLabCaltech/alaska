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
  var table = form.find('.sample_reads_table');

  for (var path in proj.samples[id].reads) {
    // Extract folder, filename, size and md5.
    split = path.split('/');

    var filename = split[split.length - 1];
    var folder = path.replace('0_raw_reads', '');
    folder = folder.replace('/' + filename, '');

    var size = proj.samples[id].reads[path].size / Math.pow(1024, 2);
    var md5 = proj.samples[id].reads[path].md5;

    var row = table.find('tr[style*="display:none"]').clone();
    var folder_cell = row.children('.sample_read_folder');
    var filename_cell = row.children('.sample_read_filename');
    var size_cell = row.children('.sample_read_size');
    var md5_cell = row.children('.sample_read_md5');

    // Then, set the values.
    folder_cell.text(folder);
    filename_cell.text(filename);
    size_cell.text(size);
    md5_cell.text(md5);

    // Append row.
    table.find('tbody').append(row);
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

// /**
//  * Sets project meta fields with the values from the global proj object.
//  */
// function set_proj_meta_fields() {
//   var fields = meta_input_fields;
//
//   for (var cat in fields) {
//     var field = fields[cat];
//     var val = proj[cat];
//
//     switch (cat) {
//       case 'meta':
//       case 'samples':
//         break;
//
//       case 'design':
//         field.find('input[value="' + val + '"]').prop('checked', true);
//         break;
//
//       default:
//         field.val(val);
//     }
//   }
//
//   var meta_fields = fields.meta;
//
//   for (var cat in meta_fields) {
//     var field = meta_fields[cat];
//     var val = proj.meta[cat];
//
//     switch (cat) {
//       case 'contributors':
//         if (val.length > 0) {
//           // Set first row first.
//           var first_row = field[0];
//           var add_btn = first_row.children('button');
//           first_row.children('input').val(val[0]);
//
//           // Then, deal with subsequent contributors.
//           for (var i = 1; i < val.length; i++) {
//             var contributor = val[i];
//
//             // Simulate add button click.
//             add_btn.click();
//             var row = field[i];
//             row.children('input').val(val[0]);
//           }
//         }
//         break;
//
//       case 'title':
//       case 'abstract':
//       case 'SRA_center_code':
//       case 'email':
//       default:
//         field.val(val);
//     }
//   }
// }
//
// /**
//  * Sets sample meta fields with the values from the global proj object.
//  */
// function set_sample_meta_fields(id) {
//   var fields = meta_input_fields.samples[id];
//
//   for (var cat in fields) {
//     var field = fields[cat];
//     var val = proj.samples[id][cat];
//
//     switch (cat) {
//       case 'meta':
//         break;
//
//       case 'type':
//         var radio = field.find('input[value="' + val + '"]');
//         radio.prop('checked', true);
//         radio.click();
//         break;
//
//       case 'organism':
//         var org = val;
//         var ver = proj.samples[id]['ref_ver'];
//         var selection = val + '_' + ver;
//         field.children('option[value="' + selection + '"]').prop('selected', true);
//         break;
//
//       case 'name':
//       case 'length':
//       case 'stdev':
//       default:
//         field.val(val);
//     }
//   }
//
//   var meta_fields = fields.meta;
//
//   for (var cat in meta_fields) {
//     var field = meta_fields[cat];
//     var val = proj.samples[id].meta[cat];
//
//     switch (cat) {
//       case 'contributors':
//         if (val.length > 0) {
//           // Set first row first.
//           var first_row = field[0];
//           var add_btn = first_row.children('button');
//           first_row.children('input').val(val[0]);
//
//           // Then, deal with subsequent contributors.
//           for (var i = 1; i < val.length; i++) {
//             var contributor = val[i];
//
//             // Simulate add button click.
//             add_btn.click();
//             var row = field[i];
//             row.children('input').val(val[0]);
//           }
//         }
//         break;
//
//       case 'chars':
//         var chars = Object.keys(val);
//         if (chars.length > 0) {
//           // Set first row first.
//           var first_row = field[0];
//           var add_btn = first_row.children('button');
//           first_row.children('input:nth-of-type(1)').val(chars[0]);
//           first_row.children('input:nth-of-type(2)').val(val[chars[0]]);
//
//           // Then, deal with subsequent contributors.
//           for (var i = 1; i < Object.keys(val).length; i++) {
//             var char = chars[i];
//             var detail = val[char];
//
//             // Simulate add button click.
//             add_btn.click();
//             var row = field[i];
//             row.children('input:nth-of-type(1)').val(char);
//             row.children('input:nth-of-type(2)').val(detail);
//           }
//         }
//         break;
//
//       case 'source':
//       case 'description':
//       default:
//         field.val(val);
//     }
//   }
// }
//
// /**
//  * Sets all meta fields with the values from the global proj object.
//  */
// function set_all_meta_fields() {
//   set_proj_meta_fields();
//
//   for (var id in proj.samples) {
//     set_sample_meta_fields(id);
//   }
// }

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

      set_all_meta_inputs();
    }
  });
}

/**
 * Save project to temporary json.
 */
function save_proj(callback) {
  save_all_meta_inputs();
  write_proj(callback);
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

  set_custom_dropdown(name_div, Object.keys(factor_names_to_class_names));
  set_fluid_input_rows(values_div);

}

/**
 * Gets value from custom dropdown.
 */
function get_value_from_custom_dropdown(div) {
  var select = div.find('select');
  var custom_input = div.find('input');

  var selected = select.find('option:selected');
  var val = '';

  if (selected.length > 0 && !selected.prop('disabled')) {
    val = selected.val();

    if (val.toLowerCase() == 'other') {
      val = custom_input.val();
    }
  }

  return val;
}

/**
 * Sets value to custom dropdown.
 */
function set_value_of_custom_dropdown(div, val) {
  // Don't do anything if the value is empty.
  if (val == null || val == '') {
    return;
  }

  var select = div.find('select');
  var custom_input = div.find('input');
  var in_dropdown = false;

  var options = select.children('option:not(:disabled)');
  options.each(function () {
    var option = $(this);
    var this_val = option.val();

    if (val == this_val) {
      option.prop('selected', true);
      custom_input.val('');
      in_dropdown = true;
      return false;
    }
  });

  if (!in_dropdown) {
    options.eq(-1).prop('selected', true);
    custom_input.val(val);
  }

  // Then, fire change.
  select.change();
}

/**
 * Get list of values inputed to fluid input rows.
 */
function get_values_from_fluid_rows(div) {
  var values = [];

  var rows = div.children('div:not([style*="display:none"])');

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
 * Sets the values inputed to fluid input rows.
 */
function set_values_of_fluid_rows(div, vals) {
  var rows = div.children('div:not([style*="display:none"])');
  var first_row = null;
  var default_rows = [];

  // Find first custom row and remove all additional rows if they have
  // a remove button. Otherwise, leave the row be.
  rows.each(function () {
    var row = $(this);
    if (get_custom_class(row).includes('_')) {
      if (first_row == null) {
        first_row = row;
        default_rows.push(row);
      } else {
        if (row.children('button').length > 0) {
          row.remove();
        } else {
          default_rows.push(row);
        }
      }
    }
  });

  var add_btn = first_row.children('button');

  // Then, add the number of rows we need.
  while (default_rows.length < vals.length) {
    add_btn.click();
    var new_div = div.children('div:not([style*="display:none"]):last');
    default_rows.push(new_div);
  }

  // Finally, populate the text inputs.
  for (var i = 0; i < vals.length; i++) {
    var row = default_rows[i];
    var row_vals = vals[i];
    var row_inputs = row.children('input');

    for (var j = 0; j < row_vals.length; j++) {
      var input = row_inputs.eq(j);
      var val = row_vals[j];

      if (val != null && val != '') {
        input.val(val);
      }
    }
  }
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

    // To enable, disable preset factor names.
    if ($(this).is('select')) {
      var select = $(this);
      var selected = select.children('option:selected');
      var val = selected.val();

      for (var factor_name in factor_names_to_class_names) {
        var class_name = factor_names_to_class_names[factor_name];
        var form_group = common_form.find('.' + class_name);
        var checkbox = form_group.find('input:checkbox');

        var common_form_class_name = 'sample_common_form';
        var specific_form_class_name = 'sample_specific_form';

        if (val == factor_name) {
          checkbox.prop('checked', false);
          checkbox.prop('disabled', true);
          remove_from_form(form_group, common_form_class_name);
          remove_from_form(form_group, specific_form_class_name);
        } else {
          checkbox.prop('disabled', false);
          refresh_checkbox(checkbox);
        }
        enable_disable_row(checkbox);
      }
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

      // First, remove all options and reset dropdown.
      select.children('option:not(:disabled)').remove();
      select.children('option:disabled').prop('selected', true);

      // Then, retrieve list of values.
      var values = get_values_from_fluid_rows(values_div);

      for (var i = 0; i < values.length; i++) {
        var value = values[i][0];

        if (value != null && value != '') {
          var option = $('<option>', {
            text: value
          });

          select.append(option);
        }
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
  var contributors_group = proj_form.find('.proj_contributors_group');
  var contributors_div = contributors_group.children('.contributors_inputs');
  set_contributors(contributors_div);

  // Set up Factor 1 name and values.
  var factor_card = proj_form.find('.factor_card');
  set_factor(factor_card);

  // Enable experimental design.
  var design_group = proj_form.find('.proj_experimental_design_group');
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
  var index = common_meta_order.indexOf(class_name);
  console.log(form_group);
  console.log(class_name);
  console.log(index);

  // If there is a select, we must save the select values.
  var select = form_group.find('select').eq(0);
  if (select.length > 0) {
    var selected = select.children('option:selected').val();
  }

  for (var id in sample_forms) {
    var form = sample_forms[id];
    var to_form = form.find('.' + to_form_class_name);

    // Make a copy and switch it up.
    var copy = form_group.clone(true);
    copy.find('*').each(function () {
      var ele = $(this);
      var ele_name = ele.attr('name');
      var ele_id = ele.attr('id');
      var ele_for = ele.attr('for');

      if (ele_name != null && ele_name != '' && ele_name.includes('_share_')) {
        ele.attr('name', ele_name.replace('_share_', '_' + id + '_'));
      }

      if (ele_id != null && ele_id != '' && ele_id.includes('_share_')) {
        ele.attr('id', ele_id.replace('_share_', '_' + id + '_'));
      }

      if (ele_for != null && ele_for != '' && ele_for.includes('_share_')) {
        ele.attr('for', ele_for.replace('_share_', '_' + id + '_'));
      }
    });

    // Deal with the copy that will be added to the sample.
    copy.children('div:first').remove();
    copy.children('div:first').removeClass('pl-0');
    copy.find('input,select,button,textarea').prop('disabled', disable);

    // Deal with select.
    var copy_select = copy.find('select').eq(0);
    if (copy_select.length > 0) {
      var options = copy_select.children('option:not(:disabled)');
      options.each(function () {
        var option = $(this);
        if (option.val() == selected) {
          option.prop('selected', true);
          return false;
        }
      });
    }

    // If this is a read type class, we have to do some additional work.
    if (class_name == 'sample_read_type_group') {
      // First, remove all event handlers from the copy.
      copy = copy.clone();

      var inputs = copy.children('div:last');
      var radios = inputs.find('input:radio');
      var radio_1 = radios.eq(0);
      var radio_2 = radios.eq(1);
      var single_collapse = inputs.children('.sample_read_type_single_collapse');
      var paired_collapse = inputs.children('.sample_read_type_paired_collapse');
      var paired_row = paired_collapse.find('div[style*="display:none"]');

      // Set up the single-end read listener.
      radio_1.click({
        'single_collapse': single_collapse,
        'paired_collapse': paired_collapse
      }, function (e) {
        var single_collapse = e.data.single_collapse;
        var paired_collapse = e.data.paired_collapse;

        if (this.checked) {
          if (paired_collapse.hasClass('show')) {
            paired_collapse.on('hidden.bs.collapse', {
              'single_collapse': single_collapse
            }, function (e) {
              var single_collapse = e.data.single_collapse;
              single_collapse.collapse('show');
              $(this).off('hidden.bs.collapse');
            });

            paired_collapse.collapse('hide');
          } else {
            single_collapse.collapse('show');
            paired_collapse.collapse('hide');
          }
        }
        paired_collapse.collapse('hide');
      });

      // Deal with paired end only if the sample has an even number
      // of reads.
      var reads = Object.keys(proj.samples[id].reads);
      console.log(reads);
      var n_reads = reads.length;
      if (n_reads % 2 == 0) {
        var n_pairs = n_reads / 2;
        reads = reads.sort();

        // Compute options.
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

        console.log(options);

        // Then, add necessary rows.
        for (var i = 0; i < n_pairs; i++) {
          var new_row = paired_row.clone();
          new_row.removeClass('mt-3');
          new_row.find('legend').text('Pair ' + (i+1));

          paired_collapse.append(new_row);
          new_row.show();
        }

        // Finally, add list of options for each select.
        paired_collapse.find('select').each(function () {
          for (var i = 0; i < options.length; i++) {
            var option = options[i];
            $(this).append(option.clone());
          }
        });

        // Set up paired-end listener.
        radio_2.click({
          'single_collapse': single_collapse,
          'paired_collapse': paired_collapse
        }, function (e) {
          var single_collapse = e.data.single_collapse;
          var paired_collapse = e.data.paired_collapse;

          if (this.checked) {
            if (single_collapse.hasClass('show')) {
              single_collapse.on('hidden.bs.collapse', {
                'paired_collapse': paired_collapse
              }, function (e) {
                var paired_collapse = e.data.paired_collapse;
                paired_collapse.collapse('show');
                $(this).off('hidden.bs.collapse');
              });

              single_collapse.collapse('hide');
            } else {
              paired_collapse.collapse('show');
              single_collapse.collapse('hide');
            }
          }
          single_collapse.collapse('hide');
        });
      } else {
        radio_2.prop('disabled', true);
      }

      var type = parseInt(inputs.find('input:radio:checked').val());
      if (type == 1) {
        single_collapse.collapse('show');
        paired_collapse.collapse('hide');
      } else {
        paired_collapse.collapse('show');
        single_collapse.collapse('hide');
      }
    }

    // First, construct an array of classes present in the form.
    var indices = [];
    for (var i = 0; i < common_meta_order.length; i++) {
      var temp_class = common_meta_order[i];
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
      var to_replace = to_form.find('.' + common_meta_order[index]);
      to_replace.after(copy);
      to_replace.remove();
    } else {
      // Otherwise, let's calculate where it should be added.
      for (var i = 0; i < indices.length; i++) {
        var temp_index = indices[i];

        // As soon as index < temp_index, we have to add it before.
        if (index < temp_index) {
          to_form.find('.' + common_meta_order[temp_index]).before(copy);
          break;
        } else if (i == (indices.length - 1)) {
          to_form.find('.' + common_meta_order[temp_index]).after(copy);
        }
      }
    }

    if (!disable) {
      copy.find('select').change();
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
 * Get custom form group from checkbox.
 */
function get_custom_group_from_checkbox(checkbox) {
  var form_group = checkbox;
  var class_name = "";

  while (!(class_name.includes('_') && class_name.includes('group'))) {
    form_group = form_group.parent();
    class_name = get_custom_class(form_group);
  }

  return form_group;
}

/**
 * Refresh which inputs are common and which are sample-specific.
 */
function refresh_checkbox(checkbox) {
  var form_group = get_custom_group_from_checkbox(checkbox);
  var class_name = get_custom_class(form_group);

  // Copy to different places depending on whether the checkbox is checked
  // or unchecked.
  var common_form_class_name = 'sample_common_form';
  var specific_form_class_name = 'sample_specific_form';

  // If this is a click event.
  // Deal with read type specially.
  if (checkbox.prop('checked')) {
    if (class_name == 'sample_read_type_group' && parseInt(form_group.find('input:radio:checked').val()) == 2) {
      copy_to_form(form_group, specific_form_class_name, false);
      remove_from_form(form_group, common_form_class_name);
    } else {
      copy_to_form(form_group, common_form_class_name, true);
      remove_from_form(form_group, specific_form_class_name);
    }
  } else {
    if (class_name != 'sample_characteristics_group') {
      copy_to_form(form_group, specific_form_class_name, false);
    }
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

  checkboxes.each(function () {
    var checkbox = $(this);
    refresh_checkbox(checkbox);
  });

  // Also, whenever an input or select is changed, fire the checkbox.
  var inputs = form.find('input:not(:checkbox),select,button,textarea');
  inputs.change(function () {
    var input = $(this);

    // Only fire the checkbox if this input is contained in the common form.
    if (input.parents('#sample_common_form').length > 0) {
      var custom_parent = get_closest_custom_parent(input);
      var checkbox = custom_parent.find('input:checkbox');

      while (custom_parent.length < 1 || !get_custom_class(custom_parent).includes('group')) {
        custom_parent = get_closest_custom_parent(custom_parent);
        checkbox = custom_parent.find('input:checkbox');
      }

      refresh_checkbox(checkbox);
    }
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
  var div_to_toggle = form.find('.sample_read_type_single_collapse');
  set_radio_collapse_toggle(single_hide_radio, single_show_radio, div_to_toggle);
}

/**
 * Set the common metadata form.
 */
function set_common_meta_input() {
  common_form = $('#sample_common_form');
  var form = common_form.children('form');

  // Set shared inputs.
  set_shared_inputs(form);

  // All samples must have even number of reads for the paired-end radio
  // to be active.
  var even = true;
  for (var id in proj.samples) {
    var sample = proj.samples[id];
    var n_reads = Object.keys(proj.samples[id].reads).length;
    if (n_reads % 2 != 0) {
      even = false;
    }
  }
  if (!even) {
    form.find('input:radio[value=2]').prop('disabled', true);
  }

  // Set checkboxes.
  set_common_checkboxes(form);

  // Set save & apply button.
  common_form.find('.save_btn').click(function () {
    save_proj();

    var meta = $('#sample_meta')
    $('#sample_meta').show();
    scroll_to_ele(meta);
  });
}
/*******************************************************************/
/* These are functions used to easily fetch data from form groups. */
/*******************************************************************/
/**
 * Gets value from input textbox.
 */
function get_value_from_group_textbox(form_group) {
  var inputs = form_group.children('div:last');
  var value = inputs.find('input:text,input[type=email]').val();

  return value;
}

/**
 * Gets value from input numberbox.
 */
function get_value_from_group_numberbox(form_group) {
  var inputs = form_group.children('div:last');
  var value = parseInt(inputs.find('input[type="number"]').val());

  return value;
}

/**
 * Gets value from input textarea.
 */
function get_value_from_group_textarea(form_group) {
  var inputs = form_group.children('div:last');
  var value = inputs.find('textarea').val();

  return value;
}

/**
 * Gets values from fluid rows.
 */
function get_values_from_group_fluid_rows(form_group) {
  var div = form_group.children('div:last');
  var values = get_values_from_fluid_rows(div);

  return values;
}

/**
 * Gets value from custom dropdown.
 */
function get_value_from_group_custom_dropdown(form_group) {
  var inputs = form_group.children('div:last');
  var value = get_value_from_custom_dropdown(inputs);

  return value;
}

/**
 * Gets value from factor group.
 */
function get_values_from_group_factor(form_group) {
  var value = get_value_from_group_dropdown(form_group);
  var factor_div = form_group.children('div:first');
  var factor = factor_div.children('label').text().split(': ')[1];

  if (factor == 'FACTOR_1') {
    factor = '';
  }

  var values = {
    'name': factor,
    'value': value
  };

  return values;
}

/**
 * Gets value from dropdown.
 */
function get_value_from_group_dropdown(form_group) {
  var inputs = form_group.children('div:last');
  var selected = inputs.find('option:selected');
  var value;

  if (selected.prop('disabled')) {
    value = '';
  } else {
    value = selected.val();
  }

  return value;
}

/**
 * Get values from factor card.
 */
function get_values_from_factor_card(factor_card) {
  var name_class = 'factor_name_inputs';
  var values_class = 'factor_values_inputs';

  var name_div = factor_card.find('.' + name_class);
  var values_div = factor_card.find('.' + values_class);

  var name = get_value_from_custom_dropdown(name_div);
  var values = get_values_from_fluid_rows(values_div);

  var result = {
    'name': name,
    'values': values
  };

  return result;
}

/**
 * Gets values from experimental design.
 */
function get_values_from_experimental_design(form_group) {
  var inputs_div = form_group.children('div:last');
  var factor = parseInt(inputs_div.find('input:radio:checked').val());
  var factor_cards = inputs_div.find('.factor_card');

  var factors = [];

  // There is always the first factor.
  var factor_1 = get_values_from_factor_card(factor_cards.eq(0));
  factors.push(factor_1);

  if (factor == 2) {
    var factor_2 = get_values_from_factor_card(factor_cards.eq(1));
    factors.push(factor_2);
  }

  return factors;
}

/**
 * Gets read length and standard deviation.
 */
function get_values_from_single_collapse(collapse) {
  var length_div = collapse.children('div:nth-of-type(1)');
  var stdev_div = collapse.children('div:nth-of-type(2)');

  var length = get_value_from_group_numberbox(length_div);
  var stdev = get_value_from_group_numberbox(stdev_div);

  var result = {
    'length': length,
    'stdev': stdev
  };

  return result;
}

/**
 * Gets read pairs.
 */
function get_values_from_paired_collapse(collapse) {
  var pair_divs = collapse.children('div:not(style*="display:none")');

  var pairs = [];

  pair_divs.each(function () {
    var pair_div = $(this);
    var inputs = pair_div.children('div:last');
    var pair_1 = inputs.children('select:first').val();
    var pair_2 = inputs.children('select:last').val();

    var pair = [pair_1, pair_2];

    pairs.push(pair);
  });

  return pairs;
}

/**
 * Gets values from read type.
 */
function get_values_from_read_type(form_group) {
  var inputs_div = form_group.children('div:last');
  var read_type = parseInt(inputs_div.find('input:radio:checked').val());

  var result = {};
  result['type'] = read_type;
  if (read_type == 1) {
    var single_collapse = form_group.find('.sample_read_type_single_collapse');
    var values = get_values_from_single_collapse(single_collapse);
    result['length'] = values.length;
    result['stdev'] = values.stdev;
  } else {
    var paired_collapse = form_group.find('.sample_read_type_paired_collapse');
    var values = get_values_from_paired_collapse(paired_collapse);
    result['pairs'] = values;
  }

  return result;
}
/*******************************************************************/

/*******************************************************************/
/*     These are functions used to set data to form groups.        */
/*******************************************************************/
/**
 * Sets value to input textbox.
 */
function set_value_of_group_textbox(form_group, val) {
  var inputs = form_group.children('div:last');
  var input = inputs.find('input:text,input[type=email]');
  input.val(val);
}

/**
 * Sets the value to input numberbox.
 */
function set_value_of_group_numberbox(form_group, val) {
  var inputs = form_group.children('div:last');
  var input = inputs.find('input[type="number"]');
  input.val(val);
}

/**
 * Sets the value to input textarea.
 */
function set_value_of_group_textarea(form_group, val) {
  var inputs = form_group.children('div:last');
  var input = inputs.find('textarea');
  input.val(val);
}

/**
 * Sets values to fluid rows.
 */
function set_values_of_group_fluid_rows(form_group, vals) {
  var div = form_group.children('div:last');
  set_values_of_fluid_rows(div, vals);
}

/**
 * Sets value of custom dropdown.
 */
function set_value_of_group_custom_dropdown(form_group, val) {
  var inputs = form_group.children('div:last');
  set_value_of_custom_dropdown(inputs, val);
}

/**
 * Sets value to dropdown.
 */
function set_value_of_group_dropdown(form_group, val) {
  var inputs = form_group.children('div:last');
  var options = inputs.find('option:not(:disabled)');

  options.each(function () {
    var option = $(this);
    var this_val = option.val();

    if (val == this_val) {
      option.prop('selected', true);
    }
  });
}

function set_values_of_group_factor(form_group, vals) {
  set_value_of_group_dropdown(form_group, vals.value);
}

/**
 * Set values to factor card.
 */
function set_values_of_factor_card(factor_card, vals) {
  var name_class = 'factor_name_inputs';
  var values_class = 'factor_values_inputs';

  var name_div = factor_card.find('.' + name_class);
  var values_div = factor_card.find('.' + values_class);

  set_value_of_custom_dropdown(name_div, vals.name);
  set_values_of_fluid_rows(values_div, vals.values);
}

/**
 * Sets values to experimental design.
 */
function set_values_of_experimental_design(form_group, vals) {
  var inputs_div = form_group.children('div:last');
  var radios = inputs_div.find('input:radio');
  var radio_1 = radios.eq(0);
  var radio_2 = radios.eq(1);
  var factor_cards = inputs_div.find('.factor_card');
  var factor = vals.length;

  // First factor is always populated.
  set_values_of_factor_card(factor_cards.eq(0), vals[0]);

  if (factor == 1) {
    radio_1.click();
  } else if (!radio_2.prop('disabled')) {
    radio_2.click();
    set_values_of_factor_card(factor_cards.eq(1), vals[1]);
  }
}

/**
 * Sets read length and standard deviation.
 */
function set_values_of_single_collapse(collapse, vals) {
  var length_div = collapse.children('div:nth-of-type(1)');
  var stdev_div = collapse.children('div:nth-of-type(2)');

  var length = vals.length;
  var stdev = vals.stdev;

  set_value_of_group_numberbox(length_div, length);
  set_value_of_group_numberbox(stdev_div, stdev);
}

/**
 * Sets read pairs.
 */
function set_values_of_paired_collapse(collapse, vals) {
  var pair_divs = collapse.children('div:not([style*="display:none"])');

  for (var i = 0; i < vals.length; i++) {
    var pair = vals[i];
    var pair_1 = pair[0];
    var pair_2 = pair[1];
    var pair_div = pair_divs.eq(i);
    var inputs = pair_div.children('div:last');
    var pair_1_select = inputs.children('select:first');
    var pair_2_select = inputs.children('select:last');

    if (pair_1 != null && pair_1 != '') {
      pair_1_select.children('option[value="' + pair_1 + '"]').prop('selected', true);
    } else {
      pair_1_select.children('option:disabled').prop('selected', true);
    }
    if (pair_2 != null && pair_2 != '') {
      pair_2_select.children('option[value="' + pair_2 + '"]').prop('selected', true);
    } else {
      pair_2_select.children('option:disabled').prop('selected', true);
    }
  }

}

/**
 * Sets values to read_type.
 */
function set_values_of_read_type(form_group, vals) {
  var inputs_div = form_group.children('div:last');
  var radios = inputs_div.find('input:radio');
  var radio_1 = radios.eq(0);
  var radio_2 = radios.eq(1);
  var read_type = vals.type;

  if (read_type == 1) {
    radio_1.click();
    var single_collapse = form_group.find('.sample_read_type_single_collapse');
    single_collapse.collapse('show');
    set_values_of_single_collapse(single_collapse, vals);
  } else {
    radio_2.click();
    var paired_collapse = form_group.find('.sample_read_type_paired_collapse');
    paired_collapse.collapse('show');
    set_values_of_paired_collapse(paired_collapse, vals.pairs);
  }
}
/*******************************************************************/


/*******************************************************************/
/*     These are functions used to save metadata form inputs.      */
/*******************************************************************/
var getters_and_setters = {
  group_textbox: {
    get: get_value_from_group_textbox,
    set: set_value_of_group_textbox
  },
  group_numberbox: {
    get: get_value_from_group_numberbox,
    set: set_value_of_group_numberbox
  },
  group_textarea: {
    get: get_value_from_group_textarea,
    set: set_value_of_group_textarea
  },
  group_fluid_rows: {
    get: get_values_from_group_fluid_rows,
    set: set_values_of_group_fluid_rows
  },
  group_dropdown: {
    get: get_value_from_group_dropdown,
    set: set_value_of_group_dropdown
  },
  group_custom_dropdown: {
    get: get_value_from_group_custom_dropdown,
    set: set_value_of_group_custom_dropdown
  },
  group_factor: {
    get: get_values_from_group_factor,
    set: set_values_of_group_factor
  },
  factor_card: {
    get: get_values_from_factor_card,
    set: set_values_of_factor_card
  },
  experimental_design: {
    get: get_values_from_experimental_design,
    set: set_values_of_experimental_design
  },
  read_type: {
    get: get_values_from_read_type,
    set: set_values_of_read_type
  }
};
var proj_meta_classes_to_functions = {
  proj_title_group: 'group_textbox',
  proj_abstract_group: 'group_textarea',
  proj_corresponding_group: 'group_textbox',
  proj_corresponding_email_group: 'group_textbox',
  proj_contributors_group: 'group_fluid_rows',
  proj_sra_center_code_group: 'group_textbox',
  proj_experimental_design_group: 'experimental_design'
};
var common_meta_classes_to_functions = {
  sample_genotype_group: 'group_textbox',
  sample_growth_conditions_group: 'group_textarea',
  sample_rna_extraction_group: 'group_textarea',
  sample_library_preparation_group: 'group_textarea',
  sample_miscellaneous_group: 'group_textarea',
  sample_organism_group: 'group_dropdown',
  sample_organism_strain_group: 'group_textbox',
  'sample_life-stage_group': 'group_custom_dropdown',
  sample_tissue_group: 'group_custom_dropdown',
  sample_characteristics_group: 'group_fluid_rows',
  sample_sequenced_molecules_group: 'group_custom_dropdown',
  sample_read_type_group: 'read_type'
};
var sample_meta_classes_to_functions = {
  sample_name_group: 'group_textbox',
  sample_description_group: 'group_textarea',
  sample_factors_1_group: 'group_factor',
  sample_factors_2_group: 'group_factor',
  sample_specific_characteristics_group: 'group_fluid_rows'
};


function get_proj_meta_inputs(card) {
  var inputs = {};

  for (var class_name in proj_meta_classes_to_functions) {
    var type = proj_meta_classes_to_functions[class_name];
    var form_group = card.find('.' + class_name);

    inputs[class_name] = getters_and_setters[type].get(form_group);
  }

  return inputs;
}

function set_proj_meta_inputs(card, inputs) {
  for (var class_name in proj_meta_classes_to_functions) {
    if (class_name in inputs) {
      var type = proj_meta_classes_to_functions[class_name];
      var form_group = card.find('.' + class_name);

      getters_and_setters[type].set(form_group, inputs[class_name]);
    }
  }

  // Then, fire some changes.
  card.find('input:text,select').change();
}

function set_common_meta_inputs(card, inputs) {
  for (var class_name in common_meta_classes_to_functions) {
    var form_group = card.find('.' + class_name);
    var checkbox = form_group.find('input:checkbox');
    var type = common_meta_classes_to_functions[class_name];

    if (class_name in inputs) {
      getters_and_setters[type].set(form_group, inputs[class_name]);

      // Check the checkbox.
      checkbox.prop('checked', false);
      checkbox.click();
    } else {
      // Unselect the checkbox.
      checkbox.prop('checked', true);
      checkbox.click();
    }
  }
}

function set_sample_meta_inputs(card, inputs) {
  for (var class_name in sample_meta_classes_to_functions) {
    var form_group = card.find('.' + class_name);
    var type = sample_meta_classes_to_functions[class_name];

    if (class_name in inputs) {
      getters_and_setters[type].set(form_group, inputs[class_name]);
    }
  }

  // Deal with common inputs.
  for (var class_name in common_meta_classes_to_functions) {
    var form_group = card.find('.' + class_name);
    var type = common_meta_classes_to_functions[class_name];

    var factor = form_group.parents('.sample_factors_card');
    var specific = form_group.parents('.sample_specific_card');

    if (class_name in inputs) {
      if (factor.length > 0 || specific.length > 0) {
        getters_and_setters[type].set(form_group, inputs[class_name]);
      }
    }
  }
}

function get_common_meta_inputs(card) {
  var inputs = {};

  for (var class_name in common_meta_classes_to_functions) {
    var type = common_meta_classes_to_functions[class_name];
    var form_group = card.find('.' + class_name);

    // Get the input only if the checkbox is checked!
    var checkbox_div = form_group.children('div:first');
    var checkbox = checkbox_div.find('input:checkbox');

    if (checkbox.prop('checked')) {
      inputs[class_name] = getters_and_setters[type].get(form_group);
    }
  }

  return inputs;
}

function get_sample_meta_inputs(card) {
  var inputs = {};

  for (var class_name in sample_meta_classes_to_functions) {
    var type = sample_meta_classes_to_functions[class_name];
    var form_group = card.find('.' + class_name);

    if (form_group.length > 0) {
      inputs[class_name] = getters_and_setters[type].get(form_group);
    }
  }

  for (var class_name in common_meta_classes_to_functions) {
    var type = common_meta_classes_to_functions[class_name];
    var form_group = card.find('.' + class_name);

    if (form_group.length > 0) {
      inputs[class_name] = getters_and_setters[type].get(form_group);
    }
  }

  return inputs;
}

/**
 * Save all inputs.
 */
function save_all_meta_inputs() {
  var proj_inputs = get_proj_meta_inputs($('#proj'));
  write_object_to_temp(proj_inputs, 'proj_inputs');

  var common_inputs = get_common_meta_inputs($('#sample_common_form'));
  write_object_to_temp(common_inputs, 'common_inputs');

  for (var id in sample_forms) {
    var form = sample_forms[id];
    var sample_inputs = get_sample_meta_inputs(form);
    write_object_to_temp(sample_inputs, 'sample_' + id + '_inputs');
  }
}

/**
 * Read all meta inputs.
 */
function set_all_meta_inputs() {
  var proj_inputs = $('#proj');
  read_object_from_temp('proj_inputs', function (obj, form) {
    set_proj_meta_inputs(form, obj);

    var common_inputs = $('#sample_common_form');
    read_object_from_temp('common_inputs', function (obj, form) {
      set_common_meta_inputs(form, obj);

      for (var id in sample_forms) {
        var sample_form = sample_forms[id];
        read_object_from_temp('sample_' + id + '_inputs', function (obj, form) {
          // Give it a timeout so that everything else has been set up.
          setTimeout(set_sample_meta_inputs, 2000, form, obj);
        }, sample_form);
      }
    }, common_inputs);
  }, proj_inputs);
}

/**
 * Convert all inputs into the proj object (i.e. the format Alaska can use).
 */
function convert_proj_meta_inputs(card) {
  var obj = {};
  obj['meta'] = {};
  obj.meta['corresponding'] = {};
  obj.meta['contributors'] = [];
  var inputs = get_proj_meta_inputs(card);

  for (var class_name in inputs) {
    var input = inputs[class_name];

    switch (class_name) {
      case 'proj_corresponding_group':
        obj.meta.corresponding['name'] = input;
        obj.meta.contributors.push(input);
        break;
      case 'proj_corresponding_email_group':
        obj.meta.corresponding['email'] = input;
        break;

      case 'proj_contributors_group':
        for (var i = 0; i < input.length; i++) {
          var contributor = input[i][0];
          obj.meta.contributors.push(contributor);
        }
        break;

      case 'proj_experimental_design_group':
        obj['design'] = input.length;

        var factors = [];
        for (var i = 0; i < input.length; i++) {
          var factor = {};
          factor['name'] = input[i].name;

          var values = [];
          for (var j = 0; j < input[i].values.length; j++) {
            var value = input[i].values[j][0];
            values.push(value);
          }
          factor['values'] = values;
          factors.push(factor);
        }
        obj['factors'] = factors;
        break;

      case 'proj_title_group':
        obj.meta['title'] = input;
        break;

      case 'proj_abstract_group':
        obj.meta['abstract'] = input;
        break;

      case 'proj_sra_center_code_group':
        obj.meta['SRA_center_code'] = input;
    }
  }

  return obj;
}

function convert_common_meta_inputs(card) {
}

function convert_sample_meta_inputs(card) {
  var obj = {};
  obj['meta'] = {};
  obj.meta['chars'] = {};
  var inputs = get_sample_meta_inputs(card);

  for (var class_name in inputs) {
    var input = inputs[class_name];

    switch (class_name) {
      case 'sample_specific_characteristics_group':
      case 'sample_characteristics_group':
        for (var i = 0; i < input.length; i++) {
          obj.meta.chars[input[i][0]] = input[i][1];
        }
        break;

      case 'sample_description_group':
        obj.meta['description'] = input;
        break;

      case 'sample_factors_1_group':
      case 'sample_factors_2_group':
        var name = input.name;
        var value = input.value;

        if (name != 'FACTOR_1' && name != 'FACTOR_2' && name != '') {
          obj.meta.chars[name] = value;
        }
        break;

      case 'sample_genotype_group':
        obj.meta.chars['genotype'] = input;
        break;

      case 'sample_growth_conditions_group':
        obj.meta.chars['growth conditions'] = input;
        break;

      case 'sample_library_preparation_group':
        obj.meta.chars['library preparation'] = input;
        break;

      case 'sample_life-stage_group':
        obj.meta.chars['life-stage'] = input;
        break;

      case 'sample_miscellaneous_group':
        obj.meta.chars['miscellaneous'] = input;
        break;

      case 'sample_name_group':
        obj['name'] = input;
        break;

      case 'sample_organism_group':
        var split = input.split('_');

        if (split.length >= 3) {
          var organism = split[0] + '_' + split[1];
          var ref_ver = split.slice(2).join('_');
          obj['organism'] = organism;
          obj['ref_ver'] = ref_ver;
        }
        break;

      case 'sample_organism_strain_group':
        obj.meta.chars['organism strain'] = input;
        break;

      case 'sample_read_type_group':
        var type = input.type;
        obj['type'] = type;

        if (type == 1) {
          obj['length'] = input.length;
          obj['stdev'] = input.stdev;
        } else if (type == 2) {
          obj['pairs'] = input.pairs;
        }
        break;

      case 'sample_rna_extraction_group':
        obj.meta.chars['rna extraction'] = input;
        break;

      case 'sample_sequenced_molecules_group':
        obj.meta.chars['sequenced molecules'] = input;
        break;

      case 'sample_tissue_group':
        obj.meta.chars['tissue'] = input;
        break;
    }
  }
  return obj;
}

/**
 * Directly modifies the global proj object.
 */
function convert_all_meta_inputs() {
  var proj_inputs = convert_proj_meta_inputs(proj_form);

  for (var cat in proj_inputs) {
    proj[cat] = proj_inputs[cat];
  }

  for (var id in sample_forms) {
    var sample_form = sample_forms[id];
    var sample_inputs = convert_sample_meta_inputs(sample_form);

    for (var cat in sample_inputs) {
      proj.samples[id][cat] = sample_inputs[cat];
    }
  }
}

/*******************************************************************/


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

    // Set the sample name.
    new_sample_form.find('.sample_name_group').find('input').val(name);

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
    set_reads_table(id, new_sample_form);

    // Characteristics.
    set_fluid_input_rows(new_sample_form.find('.sample_specific_characteristics_group'));

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
 * Gets control.
 */
function get_control(form_group) {
  var name = form_group.find('input').text();
  var value = form_group.find('select').children('option:selected').val();

  var result = {
    'name': name,
    'value': value
  };

  return result;
}

/**
 * Shows matching samples for given factor.
 */
function show_matching_controls(form_group) {
  var valid = false;
  var name = form_group.find('input').text();
  var value = form_group.find('select').children('option:selected').val();
  var sample_list = form_group.find('ul');

  var samples = chars_details_to_samples[name][value];
  for (var i = 0; i < samples.length; i++) {
    var sample = samples[i];
    var list_item = $('<li>', {
      text: proj.sample[id].name
    });
    sample_list.append(list_item);
    valid = true;
  }

  return valid;
}

/**
 * Sets the choose controls modal with the appropriate information.
 */
function set_choose_controls_modal(modal) {
  var design = proj.design;
  var factors = proj.factors;
  var validate_btn = modal.find('#validate_controls_btn');
  var start_btn = modal.find('#start_analysis_btn');
  var control_groups = modal.find('.proj_control_group');
  var control_group_1 = control_groups.eq(0);
  var control_group_2 = control_groups.eq(1);
  var tooltip = modal.find('#start_analysis_tooltip');
  tooltip.tooltip();

  // Deal with first factor.
  var control_group_1_divs = control_group_1.children('div');
  var control_1_name = control_group_divs.eq(0);
  var control_1_value = control_group_divs.eq(1);
  var control_1_value_select = control_1_value.find('select');
  var control_1_samples = control_group_divs.filter('[style*="display:none"]');
  control_1_name.find('input').val(factors[0].name);
  for (var i = 0; i < factors[0].values.length; i++) {
    var value = factors[0].values[i];
    var option = $('<option>', {
      text: value
    });
    control_1_value_select.append(option);
  }

  // Deal with second factor if design = 2.
  if (design == 2) {
    control_group_2.show();
    var control_group_2_divs = control_group_2.children('div');
    var control_2_name = control_group_divs.eq(0);
    var control_2_value = control_group_divs.eq(1);
    var control_2_samples = control_group_divs.filter('[style*="display:none"]');
    control_2_name.find('input').val(factors[1].name);
    for (var i = 0; i < factors[1].values.length; i++) {
      var value = factors[1].values[i];
      var option = $('<option>', {
        text: value
      });
      control_2_value.find('select').append(option);
    }
  }

  modal.find('select').change({
    'btn': start_btn,
    'tooltip': tooltip
  }, function (e) {
    var select = $(this);
    var control_group = select.parent().parent().parent();
    var controls_list = control_group.children('div:last');
    controls_list.hide();

    // Destroy all list items.
    controls_list.find('li').remove();

    // Disable start analysis button.
    var tooltip = e.data.tooltip;
    var btn = e.data.btn;
    tooltip.tooltip('enable');
    btn.css('pointer-events', 'none');
    btn.prop('disabled', true);
  });

  // Set verify button.
  validate_btn.click({
    'btn': start_btn,
    'tooltip': tooltip,
    'control_groups': control_groups
  }, function (e) {
    var control_groups = e.data.control_groups;
    var factor = proj.design;
    var btn = e.data.btn;
    var tooltip = e.data.tooltip;

    var valid = show_matching_controls(control_groups.eq(0));
    var controls = [get_control(control_groups.eq(0))];

    if (factor == 2) {
      valid = valid && show_matching_controls(control_groups.eq(1));
      controls.push(get_control(control_groups.eq(1)));
    }

    // If everything's good, enable start analysis button.
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
      write_proj(start_analysis);

      // Then, dismiss the project controls form and show progress screen.
      $('#choose_controls_modal').modal('hide');
      set_progress_bar_queued();
      goto_progress();
    });

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

//
// /**
//  * Sets controls to the global proj object.
//  */
// function set_controls(controls) {
//   var ctrls = {};
//   for (var i = 0; i < controls.length; i++) {
//     var name = controls[i].name;
//     var value = controls[i].value;
//
//     var samples = chars_details_to_samples[name][value];
//     for (var j = 0; j < samples.length; j++) {
//       var sample = samples[j];
//       ctrls[]
//     }
//   }
// }

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

}

// /**
//  * Sets global dictionary for meta input fields (proj + sample).
//  */
// function set_meta_input_fields() {
//   meta_input_fields = get_proj_input_fields();
//   meta_input_fields['samples'] = {};
//
//   for (var id in proj.samples) {
//     meta_input_fields.samples[id] = get_sample_input_fields(id);
//   }
// }
//
// /**
//  * Returns a dictionary for project input fields.
//  */
// function get_proj_input_fields() {
//   var proj_input_fields = {}
//   proj_input_fields['meta'] = {};
//   proj_input_fields.meta['title'] = proj_form.find('#proj_title');
//   proj_input_fields.meta['abstract'] = proj_form.find('#proj_abstract');
//   proj_input_fields.meta['corresponding'] = {
//     'email': proj_form.find('#proj_corresponding_email'),
//     'name': proj_form.find('#proj_corresponding_name')
//   };
//   proj_input_fields.meta['contributors'] = proj_contributor_fields;
//   proj_input_fields.meta['SRA_center_code'] = proj_form.find('#proj_sra_center_code');
//   proj_input_fields['design'] = proj_form.find('#proj_design');
//
//   return proj_input_fields;
// }
//
// /**
//  * Returns a dictionary for sample input fields.
//  */
// function get_sample_input_fields(id) {
//   var form = sample_forms[id];
//   var sample_input_fields = {};
//   sample_input_fields['meta'] = {};
//   sample_input_fields['name'] = form.find('#sample_name_' + id);
//   sample_input_fields.meta['description'] = form.find('#sample_description_' + id);
//   sample_input_fields.meta['contributors'] = sample_contributor_fields[id];
//   sample_input_fields.meta['source'] = form.find('#sample_source_' + id);
//   sample_input_fields.meta['chars'] = sample_characteristic_fields[id];
//   sample_input_fields['type'] = form.find('#read_type_' + id);
//   sample_input_fields['organism'] = form.find('#sample_organism_' + id);
//   sample_input_fields['length'] = form.find('#sample_length_' + id);
//   sample_input_fields['stdev'] = form.find('#sample_stdev_' + id);
//
//   return sample_input_fields;
// }

// /**
//  * Sets all the metadata with values from the form.
//  */
// function set_all_meta() {
//   // Set project meta.
//   set_proj_meta(get_proj_meta());
//
//   for (var id in sample_forms) {
//     set_sample_meta(id, get_sample_meta(id));
//   }
// }

// /**
//  * Set global proj dictionary with the values given.
//  */
// function set_proj_meta(meta) {
//   for (var cat in meta) {
//     var val = meta[cat];
//
//     switch (cat) {
//       case 'meta':
//         break;
//
//       case 'design':
//       default:
//         proj[cat] = val;
//     }
//   }
//
//   // Deal with meta field separately.
//   for (var cat in meta.meta) {
//     var val = meta.meta[cat];
//
//     switch (cat) {
//       case 'title':
//       case 'abstract':
//       case 'contributors':
//       case 'SRA_center_code':
//       case 'email':
//       default:
//         proj.meta[cat] = val;
//     }
//   }
// }

// /**
//  * Set the specified sample in the global proj dictionary with
//  * the values given.
//  */
// function set_sample_meta(id, meta) {
//   for (var cat in meta) {
//     var val = meta[cat];
//
//     switch (cat) {
//       case 'meta':
//         break;
//
//       // If reads is present, that means it is paired.
//       case 'reads':
//         var new_reads = [];
//         for (var i = 0; i < val.length; i++) {
//           var pair = val[i];
//           var read_1 = pair[0];
//           var read_2 = pair[1];
//           var new_pair = [proj.samples[id][cat][read_1],
//                             proj.samples[id][cat][read_2]];
//
//           new_reads.push(new_pair);
//         }
//         proj.samples[id][cat] = new_reads;
//         break;
//
//       case 'name':
//       case 'type':
//       case 'organism':
//       case 'ref_ver':
//       case 'length':
//       case 'stdev':
//       default:
//         proj.samples[id][cat] = val;
//     }
//   }
//
//   for (var cat in meta.meta) {
//     var val = meta.meta[cat];
//
//     switch (cat) {
//       case 'title':
//       case 'contributors':
//       case 'source':
//       case 'chars':
//       case 'description':
//         proj.samples[id].meta[cat] = val;
//     }
//   }
// }

// /**
//  * Get project metadata inputs.
//  */
// function get_proj_meta() {
//   var proj_meta = {};
//   proj_meta['meta'] = {};
//   proj_meta.meta['title'] = meta_input_fields.meta['title'].val();
//   proj_meta.meta['abstract'] = meta_input_fields.meta['abstract'].val();
//
//   // Get contributors.
//   proj_meta.meta['contributors'] = [];
//   for (var i = 0; i < proj_contributor_fields.length; i++) {
//     var field = proj_contributor_fields[i];
//     var contributor = field.children('input').val();
//
//     if (contributor != '' && contributor != null) {
//       proj_meta.meta['contributors'].push(contributor);
//     }
//   }
//   proj_meta.meta['email'] = meta_input_fields.meta['email'].val();
//   proj_meta.meta['SRA_center_code'] = meta_input_fields.meta['SRA_center_code'].val();
//   proj_meta['design'] = parseInt(meta_input_fields['design'].find('input:checked').val());
//
//   return proj_meta;
// }

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
 * Read and return object.
 */
function read_object_from_temp(fname, callback, form) {
  // Send ajax request.
  $.ajax({
    type: 'POST',
    url: 'read_proj.php',
    data: {
      'id': proj_id,
      'fname': fname,
    },
    success:function(out) {
      console.log(out);
      var obj = JSON.parse(out);

      if (typeof callback === 'function') {
        if (form != null) {
          callback(obj, form);
        } else {
          callback(obj);
        }
      }
    }
  });
}

/**
 * Write specified object to temporary directory.
 */
function write_object_to_temp(obj, fname, callback) {
  // Send ajax request.
  $.ajax({
    type: 'POST',
    url: 'jsonify.php',
    data: {
      'id': proj_id,
      'fname': fname,
      'json': JSON.stringify(obj, null, 4)
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
var factor_names_to_class_names = {
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
var proj_meta_inputs = {
  'proj_title_group': get_value_from_group_textbox,
  'proj_abstract_group': get_value_from_group_textarea,
  'proj_corresponding_group': get_value_from_group_textbox,
  'proj_corresponding_email_group': get_value_from_group_textbox,
  'proj_contributors_group': get_values_from_fluid_rows,
  'proj_sra_center_code_group': get_value_from_group_textbox,
  'proj_experimental_design_group': ''
};
var sample_common_meta_inputs = {

};
var sample_meta_inputs = {

};
var common_meta_order = [
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
  'sample_read_type_group',
  'sample_specific_characteristics_group'
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
