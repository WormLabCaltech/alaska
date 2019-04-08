/**
 * alaska_main.js
 * Author: Kyung Hoi (Joseph) Min
 * Contact: kmin@caltech.edu
 *
 * This Javascript file is responsible for all non-static elements of the
 * Alaska portal.
 *
 */

/**
 * Sets the server status badge to either online or offline.
 */
function set_badge(on) {
  $('#server_status_badge').removeClass();
  $('#server_status_badge').addClass('badge');
  $('#server_status_badge').addClass('badge-pill');
  if (on) {
    $('#server_status_badge').addClass('badge-success');
    $('#server_status_badge').text('Online');

    // Now that it's online, enable the new project button!
    // (Only if the check isn't shown.)
    if ($('#success_check').is(':hidden')) {
      $('#new_proj_btn').css('pointer-events', 'auto');
      $('#new_proj_btn').prop('disabled', false);
    }

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
  var target = 'cgi_request.php';
  var data = {
    action: 'is_online'
  };
  var callback = parse_server_status;
  send_ajax_request(target, data, callback, true);
}

/**
 * Go to ftp upload page.
 */
function goto_ftp_info() {
  $('#success_check').show();
  $('#new_proj_btn').prop('disabled', true);

  // Send ajax request to get ftp password.
  var target = 'cgi_request.php';
  var data = {
    action: 'get_ftp_info',
    id: proj_id
  };
  var callback = parse_ftp_info;
  send_ajax_request(target, data, callback, true);

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
  $('#progress_bar_container').show();
  var progress_container = $('#progress_container');
  var html = progress_container.html();
  progress_container.html(html.replace(new RegExp('PROJECT_ID', 'g'), proj_id));
  progress_container.show();

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
      $('#meta_container').hide();
      $('#main_content_div').hide();
      $('#ftp_info_div').hide();
      $('#raw_reads_div').hide();
      $('#fetch_failed_div').hide();
    }
  });

  // Set retry button.
  progress_container.find('#retry_btn').click(function () {
    var target = 'cgi_request.php';
    var data = {
      action: 'do_all',
      id: proj_id
    };
    $(this).hide();
    send_ajax_request(target, data, null, false);
    if (project_progress_interval == null) {
      project_progress_interval = setInterval(update_progress, 10000);
    }
  });

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
  $('#all_download_btn').click(function () {
      window.open('download.php?id=' + proj_id + '&type=all', '_blank');
  });
  $('#info_download_btn').click(function () {
      window.open('download.php?id=' + proj_id + '&type=info', '_blank');
  });

  // Set sleuth server open button listener.
  progress_container.find('#diff_server_btn').click(function () {
    var target = 'cgi_request.php';
    var data = {
      id: proj_id,
      action: 'open_sleuth_server'
    };
    var btn = $(this);
    var spinner = btn.children('div:last');
    var width = btn.width();
    set_loading_spinner(btn, spinner);
    var callback = parse_sleuth_server;
    send_ajax_request(target, data, callback, true, btn, spinner, width);
  });

  // Set compile button.
  progress_container.find('#geo_compile_btn').click(function () {
    // Hide modal.
    $('#geo_compile_modal').modal('hide');

    // Set loading spinner.
    var btn = $('#geo_compile_modal_btn');
    var spinner = btn.children('.loading_spinner');
    set_loading_spinner(btn, spinner);

    var target = 'cgi_request.php';
    var data = {
      id: proj_id,
      action: 'prepare_geo'
    }
    send_ajax_request(target, data, null, true);
  });

  // Set submit button.
  progress_container.find('#geo_submit_btn').click({
    progress_container: progress_container
  }, function (e) {
    var progress_container = e.data.progress_container;
    var groups = {
      geo_username: progress_container.find('.geo_username_group'),
      ftp_host: progress_container.find('.ftp_host_group'),
      ftp_username: progress_container.find('.ftp_username_group'),
      ftp_password: progress_container.find('.ftp_password_group')
    };
    // Make new object.
    var obj = {
      geo_username: '',
      ftp_host: '',
      ftp_username: '',
      ftp_password: ''
    };

    // Fetch inputs.
    var valid = true;
    for (var key in groups) {
      var group = groups[key];
      group.find('input').removeClass('is-invalid');
      var val = get_value_from_group_textbox(group);

      if (val != null && val != '') {
        obj[key] = val;
      } else {
        group.find('input').addClass('is-invalid');
        valid = false;
      }
    }

    if (valid) {
      // Dismiss modal.
      var btn = $('#geo_submit_modal_btn');
      var spinner = btn.children('.loading_spinner');
      set_loading_spinner(btn, spinner);
      progress_container.find('#geo_submit_modal').modal('hide');
      function callback() {
        var target = 'cgi_request.php';
        var data = {
          id: proj_id,
          action: 'submit_geo'
        }
        send_ajax_request(target, data, null, false);
      }

      write_object_to_temp(obj, 'ftp_info', callback);
    }
  });

  // Set output listeners for live output.
  set_output_listeners(progress_container);

  // Set the progress page to the given progress.
  set_progress(status);

  // Then, call update_progress regularly.
  if (project_progress_interval == null) {
    project_progress_interval = setInterval(update_progress, 10000);
  }
}

function get_output(type, textarea, ul) {
  var target = 'get_output.php';
  var data = {
    'type': type,
    'id': proj_id
  };
  var callback = parse_output_textarea;
  send_ajax_request(target, data, callback, true, textarea, ul);
}

function set_output_listener_for_collapse(collapse, type, textarea, ul, badge,
                                          t=1000) {
  collapse.on('show.bs.collapse', {
    'type': type,
    'badge': badge,
    'textarea': textarea,
    't': t
  }, function (e) {
    var type = e.data.type;
    var badge = e.data.badge;
    var textarea = e.data.textarea;
    var t = e.data.t;

    // Set up interval only when the process is running.
    if (badge.hasClass('badge-info') && output_intervals[type] == null) {
      output_intervals[type] = setInterval(get_output, t, type, textarea, ul);
    } else {
      get_output(type, textarea, ul);
    }
  });
  collapse.on('hide.bs.collapse', {
    'type': type
  }, function (e) {
    var type = e.data.type;
    if (output_intervals[type] != null) {
      clearInterval(output_intervals[type]);
      output_intervals[type] = null;
    }
  });

}

/**
 * Sets listeners for each of the three live output views.
 */
function set_output_listeners(progress_container) {
  var qc_output_collapse = progress_container.find('#qc_output_collapse');
  var quant_output_collapse = progress_container.find('#quant_output_collapse');
  var diff_output_collapse = progress_container.find('#diff_output_collapse');

  var qc_ul = progress_container.find('#qc_list');
  var quant_ul = progress_container.find('#quant_list');
  var diff_ul = progress_container.find('#diff_list');

  var qc_textarea = progress_container.find('#qc_textarea');
  var quant_textarea = progress_container.find('#quant_textarea');
  var diff_textarea = progress_container.find('#diff_textarea');

  var qc_status_badge = progress_container.find('#qc_status_badge');
  var quant_status_badge = progress_container.find('#quant_status_badge');
  var diff_status_badge = progress_container.find('#diff_status_badge');

  set_output_listener_for_collapse(qc_output_collapse, 'qc', qc_textarea,
                                   qc_ul, qc_status_badge);
  set_output_listener_for_collapse(quant_output_collapse, 'quant',
                                   quant_textarea, quant_ul, quant_status_badge);
  set_output_listener_for_collapse(diff_output_collapse, 'diff', diff_textarea,
                                   diff_ul, diff_status_badge);
}

/**
 * Update progress.
 */
function update_progress() {
  var target = 'cgi_request.php';
  var data = {
    action: 'get_proj_status',
    id: proj_id
  };
  var callback = update_proj_status;
  send_ajax_request(target, data, callback, true);
}


/**
 * Sets the progress page to the given status.
 * This function assumes the project has been queued.
 */
function set_progress(status) {
  var progress_container = $('#progress_container');
  var project_status_badge = progress_container.find('#project_status_badge');
  var project_download_btn = progress_container.find('#project_download_btn');
  var error_modal = $('#progress_error_modal');
  var error = false;

  // Set the project status badge
  if (status >= progress.diff_finished) {
    set_progress_badge(project_status_badge, 'finished');
    project_download_btn.prop('disabled', false);
  } else if (status >= progress.qc_started) {
    set_progress_badge(project_status_badge, 'started');
    project_download_btn.prop('disabled', true);
  } else if (status > 0) {
    set_progress_badge(project_status_badge, 'queued');
    project_download_btn.prop('disabled', true);
  } else {
    set_progress_badge(project_status_badge, 'error');
    // Show the retry button.
    progress_container.find('#retry_btn').show();
    project_download_btn.prop('disabled', true);
    error = true;
    status = -status;

    // Show error modal.
    error_modal.modal('show');

    // Clear progress update interval.
    clearInterval(project_progress_interval);
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
    'diff_output_collapse',
    'all_download_btn',
    'geo_compile_modal_btn',
    'geo_submit_modal_btn'
  ];

  // Construct elements dictionary
  elements = {};
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    elements[id] = progress_container.find('#' + id);
  }

  // Deal with enabling buttons first.
  switch (status) {
    case progress.geo_submitted:
    case progress.geo_submitting:
    case progress.geo_compiled:
    case progress.geo_compiling:
      elements.geo_compile_modal_btn.prop('disabled', true);
    case progress.server_open:
    case progress.diff_finished:
      elements.diff_server_btn.prop('disabled', false);
      elements.diff_download_btn.prop('disabled', false);
      elements.all_download_btn.prop('disabled', false);
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
    case progress.qc_error:
    case progress.qc_queued:
      elements.qc_output_btn.prop('disabled', true);
    case progress.qc_started:
      elements.qc_report_btn.prop('disabled', true);
      elements.qc_download_btn.prop('disabled', true);
    case progress.qc_finished:
    case progress.quant_error:
    case progress.quant_queued:
      elements.quant_output_btn.prop('disabled', true);
    case progress.quant_started:
      elements.quant_download_btn.prop('disabled', true);
    case progress.quant_finished:
    case progress.diff_error:
    case progress.diff_queued:
      elements.diff_output_btn.prop('disabled', true);
    case progress.diff_started:
      elements.diff_download_btn.prop('disabled', true);
      elements.diff_server_btn.prop('disabled', true);
      elements.all_download_btn.prop('disabled', true);
      elements.geo_compile_modal_btn.prop('disabled', true);
      elements.geo_submit_modal_btn.prop('disabled', true);
      break;
    case progress.diff_finished:
    case progress.server_open:
      elements.geo_compile_modal_btn.prop('disabled', false);
      elements.geo_compile_modal_btn.children('.success_check').hide();
      elements.geo_compile_modal_btn.children('.loading_spinner').hide();

      elements.geo_submit_modal_btn.prop('disabled', true);
      elements.geo_submit_modal_btn.children('.success_check').hide();
      elements.geo_submit_modal_btn.children('.loading_spinner').hide();
      break;
    case progress.geo_compiling:
      elements.geo_compile_modal_btn.prop('disabled', true);
      elements.geo_compile_modal_btn.children('.success_check').hide();
      elements.geo_compile_modal_btn.children('.loading_spinner').show();

      elements.geo_submit_modal_btn.prop('disabled', true);
      elements.geo_submit_modal_btn.children('.success_check').hide();
      elements.geo_submit_modal_btn.children('.loading_spinner').hide();
      break;
    case progress.geo_compiled:
      elements.geo_compile_modal_btn.prop('disabled', true);
      elements.geo_compile_modal_btn.children('.loading_spinner').hide();
      elements.geo_compile_modal_btn.children('.success_check').show();

      elements.geo_submit_modal_btn.prop('disabled', false);
      elements.geo_submit_modal_btn.children('.success_check').hide();
      elements.geo_submit_modal_btn.children('.loading_spinner').hide();
      break;
    case progress.geo_submitting:
      elements.geo_compile_modal_btn.prop('disabled', true);
      elements.geo_compile_modal_btn.children('.success_check').show();
      elements.geo_compile_modal_btn.children('.loading_spinner').hide();

      elements.geo_submit_modal_btn.prop('disabled', true);
      elements.geo_submit_modal_btn.children('.success_check').hide();
      elements.geo_submit_modal_btn.children('.loading_spinner').show();
      break;
    case progress.geo_submitted:
      elements.geo_compile_modal_btn.prop('disabled', true);
      elements.geo_compile_modal_btn.children('.success_check').show();
      elements.geo_compile_modal_btn.children('.loading_spinner').hide();

      elements.geo_submit_modal_btn.prop('disabled', true);
      elements.geo_submit_modal_btn.children('.loading_spinner').hide();
      elements.geo_submit_modal_btn.children('.success_check').show();
      break;
  }

  // Finally, set status badges.
  if (status < progress.qc_started) {
    set_progress_badge(elements.qc_status_badge, 'queued');
    set_progress_badge(elements.quant_status_badge, 'queued');
    set_progress_badge(elements.diff_status_badge, 'queued');
    set_progress_bar_queued();
  } else if (status < progress.quant_started) {
    set_progress_badge(elements.quant_status_badge, 'queued');
    set_progress_badge(elements.diff_status_badge, 'queued');
    set_progress_bar_qc();
  } else if (status < progress.diff_started) {
    set_progress_badge(elements.diff_status_badge, 'queued');
    set_progress_bar_quant();
  } else {
    set_progress_bar_diff();
  }

  if (status >= progress.diff_finished) {
    set_progress_badge(elements.qc_status_badge, 'finished');
    set_progress_badge(elements.quant_status_badge, 'finished');
    set_progress_badge(elements.diff_status_badge, 'finished');
    set_progress_bar_done();
  } else if (status >= progress.quant_finished) {
    set_progress_badge(elements.qc_status_badge, 'finished');
    set_progress_badge(elements.quant_status_badge, 'finished');
  } else if (status >= progress.qc_finished) {
    set_progress_badge(elements.qc_status_badge, 'finished');
  }

  if (!error) {
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
  } else {
    switch (-status) {
      case progress.qc_error:
        set_progress_badge(elements.qc_status_badge, 'error');
        break;
      case progress.quant_error:
        set_progress_badge(elements.quant_status_badge, 'error');
        break;
      case progress.diff_error:
        set_progress_badge(elements.diff_status_badge, 'error');
        break;
    }
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

  bar.children().removeClass('progress-bar-striped progress-bar-animated');
  bar.children().removeClass('bg-secondary border-right border-dark');

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
 * Get project status.
 */
function get_proj_status() {
  var target = 'cgi_request.php';
  var data = {
    action: 'get_proj_status',
    id: proj_id
  };
  var callback = parse_proj_status;
  send_ajax_request(target, data, callback, true);
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

  var target = 'cgi_request.php';
  var data = {
    action: 'test_copy_reads',
    id: proj_id
  };
  var callback = parse_copy_test;
  send_ajax_request(target, data, callback, false, spinner, success);
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
  // If we are testing, keep testing variable.
  if (testing) {
    history.pushState(null, '', '/?id=' + id + '&testing=true');
  } else {
    history.pushState(null, '', '/?id=' + id);
  }
  $('#proj_url').text(window.location.href);

  // Set click handler for "View supported structures" button and
  // "View FTP info" button.
  $('#read_example_btn').click(function () {
    // Enable View FTP info button
    var btn = $('#ftp_info_btn');
    btn.css('pointer-events', 'auto');
    btn.prop('disabled', false);

    // Dispose tooltip.
    btn.parent().tooltip('dispose');
  });

  $('#ftp_info_btn').click(function () {
    // Enable fetch reads button
    var btn = $('#fetch_reads_btn');
    btn.css('pointer-events', 'auto');
    btn.prop('disabled', false);

    // Dispose tooltip.
    btn.parent().tooltip('dispose');
  });

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
  var target = 'cgi_request.php';
  var data = {
    action: 'new_proj'
  };
  var callback = parse_new_proj;
  send_ajax_request(target, data, callback, true, spinner);
}

/**
 * Get the md5 sum of the given file.
 */
function get_md5(md5_id, spinner_id, path) {
  console.log(path);

  var target = 'md5sum.php';
  var data = {
    'path': path
  };
  var callback = parse_md5;
  send_ajax_request(target, data, callback, true, md5_id, spinner_id);
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
 * Fetch files in raw reads folder.
 */
function fetch_reads() {
  var target = 'cgi_request.php';
  var data = {
    action: 'fetch_reads',
    id: proj_id
  };
  var callback = parse_reads;
  send_ajax_request(target, data, callback, true);
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
  first.on('hidden.bs.modal', {
    'second': second
  }, function (e) {
    var second = e.data.second;
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

/**
 * Sets the organisms inputs listeners.
 */
function set_organisms_inputs_listeners(organisms, genus_select, species_select,
                                        version_select) {
  // Set input listener for the genus select, so that if the genus is
  // changed, the species select is enabled/disabled accordingly.
  genus_select.change({
    'organisms': organisms,
    'species_select': species_select,
    'version_select': version_select
  }, function(e) {
    var select = $(this);
    var organisms = e.data.organisms;
    var species_select = e.data.species_select;
    var version_select = e.data.version_select;

    // Get currently selected genus.
    var genus = select.val();

    // If the selected genus is not null or empty, set the species select.
    if (genus != null && genus != '' && genus in organisms) {
      // Enable the select.
      species_select.prop('disabled', false);

      // Remove all elements already in the select.
      species_select.children('option:not(:disabled)').remove();

      // Then, add the correct elements.
      for (var species in organisms[genus]) {
        var option = $('<option>', {text: species});
        species_select.append(option);
      }
    } else {
      species_select.prop('disabled', true);
    }

    // Disable version select.
    version_select.prop('disabled', true);

    // Reset choice.
    species_select.children('option:disabled').prop('selected', true);
    version_select.children('option:disabled').prop('selected', true);

    // Fire change on species select.
    // species_select.change();
  });

  // Set input listener for the version select, so that if the species is changed,
  // the version select is enabled/disabled accordingly.
  species_select.change({
    'organisms': organisms,
    'genus_select': genus_select,
    'version_select': version_select
  }, function(e) {
    var select = $(this);
    var organisms = e.data.organisms;
    var genus_select = e.data.genus_select;
    var version_select = e.data.version_select;

    // Get currently selected genus.
    var genus = genus_select.val();
    var species = select.val();

    // If the selected genus is not null or empty, set the species select.
    if (genus != null && genus != '' && genus in organisms
        && species != null && species != '' && species in organisms[genus]) {
      // Enable the select.
      version_select.prop('disabled', false);

      // Remove all elements already in the select.
      version_select.children('option:not(:disabled)').remove();

      // Then, add the correct elements.
      for (var i = 0; i < organisms[genus][species].length; i++) {
        var version = organisms[genus][species][i]
        var option = $('<option>', {text: version});
        version_select.append(option);
      }
    } else {
      version_select.prop('disabled', true);
    }

    // Reset choice.
    version_select.children('option:disabled').prop('selected', true);
  });
}

/**
 * Populates the given select with the global organisms variable.
 */
function populate_organisms_inputs(inputs, organisms) {
  // Extract genus, species, and version selects.
  var genus_select = inputs.children('select:nth-of-type(1)');
  var species_select = inputs.children('select:nth-of-type(2)');
  var version_select = inputs.children('select:nth-of-type(3)');

  // Add all the genus's to the genus select.
  for (var genus in organisms) {
    var option = $('<option>', {text: genus});
    genus_select.append(option);
  }

  set_organisms_inputs_listeners(organisms, genus_select, species_select,
                                      version_select);
}

/**
 * Sets the internal list of available organisms.
 */
function set_organisms_select(inputs, cb) {
  var target = 'cgi_request.php';
  var data = {
    action: 'get_organisms'
  };
  if (typeof cb === 'function') {
    function callback(out, inputs, cb) {
      parse_organisms(out, inputs);
      cb();
    }
    send_ajax_request(target, data, callback, true, inputs, cb);
  } else {
    var callback = parse_organisms;
    send_ajax_request(target, data, callback, true, inputs);
  }
}

/**
 * Infer samples.
 */
function infer_samples() {
  // Show the loading spinner.
  var button = $('#infer_samples_btn');
  var spinner = $('#infer_samples_loading_spinner');
  var width = button.width();
  set_loading_spinner(button, spinner);

  // Send fetch_reads request.
  var target = 'cgi_request.php';
  var data = {
    action: 'infer_samples',
    id: proj_id
  };
  var callback = parse_infer_samples;
  send_ajax_request(target, data, callback, true, button, spinner, width);
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

    // Hide all the open popovers.
    for (var i = 0; i < shown_popovers.length; i++) {
      var popover = shown_popovers[i];
      popover.popover('hide');
    }

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

    var size = proj.samples[id].reads[path].size + ' bytes';
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


/**
 * Read project from temporary json.
 */
function read_proj() {
  var target = 'read_proj.php';
  var data = {
    id: proj_id
  };
  var callback = parse_read_proj;
  send_ajax_request(target, data, callback, true);
}

/**
 * Save project to temporary json.
 */
function save_proj(callback, ...args) {
  save_all_meta_inputs();

  if (callback != null) {
    args.unshift(callback);
    write_proj.apply(this, args);
  } else {
    write_proj();
  }
}

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
  var parent = btn.parent();
  var input = parent.children('input');
  var contributor = input.val();

  if (contributor == null || contributor == '') {
    btn.tooltip('show');
    return;
  }

  // Reset input.
  input.val('');

  var grandparent = parent.parent();
  var div = grandparent.children('div[style*="display:none"]');

  // Make a copy of this new div.
  var new_div = div.clone();
  var new_input = new_div.children('input');
  new_input.val(contributor);

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
  var inputs = div.children('input');
  inputs.val('');

  // Set it up so that this div is destroyed when it is hidden.
  div.on('hidden.bs.collapse', function () {
    $(this).remove();
  });

  // Then, hide the div so that it is destroyed.
  div.collapse('hide');

  // Fire change for these inputs.
  btn.change();
}

/**
 * Adds an input row.
 */
function add_input_row() {
  var btn = $(this);
  var parent = btn.parent();
  var inputs = parent.children('input');

  // Get input values. Note that there may be more than one input.
  var input_vals = [];
  inputs.each(function () {
      input_vals.push($(this).val());
      $(this).val('');
  });

  // If any of the inputs are empty, don't add the new row.
  for (var i = 0; i < input_vals.length; i++) {
      if (input_vals[i] == null || input_vals[i] == '') {
        btn.tooltip('show');
        return;
      }
  }

  var grandparent = parent.parent();
  var div = grandparent.children('div[style*="display:none"]');

  // Clone a new row.
  var new_div = div.clone(true);

  // Set the input values.
  new_div.children('input').each(function () {
    $(this).val(input_vals.shift());
  });

  // Set up remove button.
  var remove_btn = new_div.children('button');
  remove_btn.click(remove_input_row);

  // Then, add it to the DOM and show it.
  grandparent.append(new_div);
  new_div.show();
  new_div.addClass('d-flex');

  // Show the new contributor row.
  new_div.collapse('show');

  // Fire change for these inputs.
  remove_btn.change();
}

/**
 * Sets functionality for adding/removing input rows.
 */
function set_fluid_input_rows(div) {
  var button = div.find('.add_btn');

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

function set_dropdown(select, choices) {
  for (var i = 0; i < choices.length; i++) {
    var choice = choices[i];
    var option = $('<option>', {
      text: choice
    });
    select.append(option);
  }
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

      // Push to array only if there is at least one element.
      if (col_values.length > 0) {
        values.push(col_values);
      }
    }
  });

  return values;
}

/**
 * Sets the values inputed to fluid input rows.
 * This function assumes the rows are in their initial state.
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

  var inputs = first_row.children('input');
  var add_btn = first_row.children('button');

  // Then, add the number of rows we need.
  for (var i = 0; i < vals.length; i++) {
    var j = 0;
    var val = vals[i];

    inputs.each(function () {
      $(this).val(val[j]);
      j++;
    });

    add_btn.click();
  }

  // while (default_rows.length < vals.length) {
  //   add_btn.click();
  //   var new_div = div.children('div:not([style*="display:none"]):last');
  //   default_rows.push(new_div);
  // }
  //
  // // Finally, populate the text inputs.
  // for (var i = 0; i < vals.length; i++) {
  //   var row = default_rows[i];
  //   var row_vals = vals[i];
  //   var row_inputs = row.children('input');
  //
  //   for (var j = 0; j < row_vals.length; j++) {
  //     var input = row_inputs.eq(j);
  //     var val = row_vals[j];
  //
  //     if (val != null && val != '') {
  //       input.val(val);
  //     }
  //   }
  // }
}

/**
 * Gets values from organisms dropdowns as a dictionary of genus, species, and
 * version.
 */
function get_values_from_organism_dropdowns(div) {
  var inputs = div.find('.sample_organism_inputs');
  var genus_select = inputs.children('select:nth-of-type(1)');
  var species_select = inputs.children('select:nth-of-type(2)');
  var version_select = inputs.children('select:nth-of-type(3)');

  // Get values.
  var genus = genus_select.val();
  var species = species_select.val();
  var version = version_select.val();

  // Construct dictionary.
  var organism = {
    'genus': genus,
    'species': species,
    'version': version
  };

  return organism;
}

/**
 * Sets values of organism dropdowns.
 */
function set_values_of_organism_dropdowns(div, vals) {
  var inputs = div.find('.sample_organism_inputs');
  var genus_select = inputs.children('select:nth-of-type(1)');
  var species_select = inputs.children('select:nth-of-type(2)');
  var version_select = inputs.children('select:nth-of-type(3)');

  // Get values.
  var genus = vals.genus;
  var species = vals.species;
  var version = vals.version;

  // Set genus dropdown.
  var found = false;
  var options = genus_select.children('option:not(:disabled)');
  if (genus == null || genus == '') {
    genus_select.children('option:disabled').prop('selected', true);
  } else {
    options.each(function () {
      var option = $(this);
      var this_val = option.val();

      if (genus == this_val) {
        option.prop('selected', true);
        return false;
      }
    });
  }
  genus_select.change();

  // Set species dropdown.
  var options = species_select.children('option:not(:disabled)');
  if (species == null || species == '') {
    species_select.children('option:disabled').prop('selected', true);
  } else {
    options.each(function () {
      var option = $(this);
      var this_val = option.val();

      if (species == this_val) {
        option.prop('selected', true);
        return false;
      }
    });
  }
  species_select.change();

  // Set version dropdown.
  var options = version_select.children('option:not(:disabled)');
  if (version == null || version == '') {
    version_select.children('option:disabled').prop('selected', true);
  } else {
    options.each(function () {
      var option = $(this);
      var this_val = option.val();

      if (version == this_val) {
        option.prop('selected', true);
        return false;
      }
    });
  }
  version_select.change();
}


/**
 * Sets listener to change content of the given sample factor group depending on
 * the values of the factor card.
 */
function set_factor_card_to_sample_listener(factor_card,
                                            sample_factor_group_class_name) {
  var name_div = factor_card.find('.factor_name_inputs');
  var values_div = factor_card.find('.factor_values_inputs');

  var name_inputs = name_div.find('select,input');
  var values_inputs = values_div.find('select,input,button');

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

  // To enable, disable preset factor names.
  name_div.find('select').change(function () {
    var select = $(this);
    var selected = select.children('option:not(:disabled):selected');
    var val = selected.val();

    // Skip if null.
    if (val == null) {
      return;
    }

    for (var factor_name in factor_names_to_class_names) {
      var class_name = factor_names_to_class_names[factor_name];
      var form_group = common_form.find('.' + class_name);
      var checkbox = form_group.find('input:checkbox');

      var common_form_class_name = 'sample_common_form';
      var specific_form_class_name = 'sample_specific_form';

      if (val == factor_name) {
        checkbox.prop('disabled', true);
      } else {
        checkbox.prop('disabled', false);
      }
      refresh_checkbox(checkbox);
      enable_disable_row(checkbox);
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
function set_factor_to_sample_listeners(design_1_radio, design_2_radio,
                                        design_inputs) {
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
 * Enable all popover and tooltips in the given element.
 */
function enable_popovers_tooltips(ele) {
  ele.find('[data-toggle="tooltip"]').tooltip();
  ele.find('[data-toggle="popover"]').popover();
}

/**
 * Show 'Saved!' tooltip of button and automatically hide it after some delay.
 * Then, execute func
 */
function show_saved(btn, func, ...args) {
  btn.tooltip('show');

  // Function to hide and enable button.
  function reset_btn(btn, ele) {
    btn.tooltip('hide');
    btn.prop('disabled', false);

    func.apply(this, args);
  }

  // Schedule tooltip to be hidden.
  setTimeout(reset_btn, 1000, btn);
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
  div_to_toggle.children('h6').text('Contrast Factor 2');
  div_to_toggle.addClass('collapse');
  design_inputs.append(div_to_toggle);
  set_radio_collapse_toggle(factor_hide_radio, factor_show_radio, div_to_toggle);

  // Then, we must also set up listeners to show/hide appropriate factor 1
  // and factor 2 information for each sample.
  set_factor_to_sample_listeners(factor_hide_radio, factor_show_radio, design_inputs);

  proj_form.find('.save_btn').click(function () {
    var btn = $(this);

    // Disable this button.
    btn.prop('disabled', true);

    // Function to show next form.
    function show_next_form() {
      var header = $('#sample_meta_header');
      header.show();
      $('#sample_meta_common').show();
      scroll_to_ele(header);
    }

    save_proj(show_saved, btn, show_next_form);
  });

  // Disable 2-factor design if there are less than 8 samples.
  if (Object.keys(proj.samples).length < 8) {
    factor_show_radio.prop('disabled', true);
  }

  // Enable popovers and tooltips.
  enable_popovers_tooltips(proj_form);
}

/**
 * Enables/disables row depending on whether the checkbox is checked.
 */
function enable_disable_row(checkbox) {
    var form_group = checkbox.parent().parent().parent();
    var class_name = get_custom_class(form_group);

    var inputs = form_group.find('input:not(:checkbox)');
    var textareas = form_group.find('textarea');
    var selects = form_group.find('select');
    var buttons = form_group.find('button');

    if (checkbox.prop('checked') && !checkbox.prop('disabled')) {
      // Enable everything.
      inputs.prop('disabled', false);
      textareas.prop('disabled', false);
      selects.prop('disabled', false);
      selects.change();
      buttons.prop('disabled', false);
    } else {
      // Disable everything.
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
  var select = form_group.find('select');

  // If there is a select, we must save the select values.
  // var selects = form_group.find('select');
  // var selected = [];
  // selects.each(function () {
  //   selected.push($(this).val());
  // });

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

    // Select the correct organism.
    if (class_name == 'sample_organism_group') {
      var group_name = common_meta_classes_to_functions[class_name];
      var input = getters_and_setters[group_name].get(form_group)

      var genus_select = copy.find('select:nth-of-type(1)');
      var species_select = copy.find('select:nth-of-type(2)');
      var version_select = copy.find('select:nth-of-type(3)');

      // Set input listeners.
      set_organisms_inputs_listeners(organisms, genus_select, species_select,
                                      version_select);

      genus_select.children('option:not(:disabled)').each(function () {
        var option = $(this);
        var this_val = option.val();

        if (input.genus == this_val) {
          option.prop('selected', true);
          return false;
        }
      });
      species_select.children('option:not(:disabled)').each(function () {
        var option = $(this);
        var this_val = option.val();

        if (input.species == this_val) {
          option.prop('selected', true);
          return false;
        }
      });
      version_select.children('option:not(:disabled)').each(function () {
        var option = $(this);
        var this_val = option.val();

        if (input.version == this_val) {
          option.prop('selected', true);
          return false;
        }
      });
    } else if (select.length > 0) {
      var selected = select.val();
      var copy_select = copy.find('select');
      var options = copy_select.children('option:not(:disabled)');
      options.each(function () {
        var option = $(this);
        if (option.val() == selected) {
          option.prop('selected', true);
          return false;
        }
      });
    }

    // Deal with select.
    // var copy_selects = copy.find('select');
    // copy_selects.each(function (index, value) {
    //   var options = $(this).children('option:not(:disabled)');
    //   options.each(function () {
    //     var option = $(this);
    //     if (option.val() == selected) {
    //       option.prop('selected', true);
    //       return false;
    //     }
    //   });
    // });

    // If this is a read type class, we have to do some additional work.
    if (class_name == 'sample_read_type_group') {
      // First, remove all event handlers from the copy.
      copy = copy.clone();

      var inputs = copy.children('div:last');
      var radios = inputs.find('input:radio');
      var radio_1 = radios.eq(0);
      var radio_2 = radios.eq(1);
      var single_collapse = inputs.children('.sample_read_type_single_'
                                            + 'collapse');
      var paired_collapse = inputs.children('.sample_read_type_paired_'
                                            + 'collapse');
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

    if (!disable && class_name != 'sample_organism_group') {
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
  if (checkbox.prop('disabled')) {
    // If the checkbox is disabled, remove from both forms!
    remove_from_form(form_group, common_form_class_name);
    remove_from_form(form_group, specific_form_class_name);
  } else if (checkbox.prop('checked')) {
    if (class_name == 'sample_read_type_group'
        && parseInt(form_group.find('input:radio:checked').val()) == 2) {
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

      while (custom_parent.length < 1
             || !get_custom_class(custom_parent).includes('group')) {
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
function set_shared_inputs(form, cb) {
  var organism_inputs = form.find('.sample_organism_inputs');
  var lifestage_dropdown = form.find('.sample_life-stage_inputs');
  var tissue_dropdown = form.find('.sample_tissue_inputs');
  var chars_inputs = form.find('.sample_characteristics_inputs');
  var sequencing_platform_select = form.find('.sample_sequencing_platform_'
                                             + 'select')
  var sequenced_molecules_dropdown = form.find('.sample_sequenced_molecules_'
                                               + 'inputs');

  set_organisms_select(organism_inputs, cb);
  set_custom_dropdown(lifestage_dropdown, life_stages);
  set_custom_dropdown(tissue_dropdown, tissues);
  set_fluid_input_rows(chars_inputs);
  set_dropdown(sequencing_platform_select, sequencing_platforms);
  set_custom_dropdown(sequenced_molecules_dropdown, sequenced_molecules);

  // Then, set up div toggle for single-end reads, which need read lenght and
  // standard deviation.
  var single_show_radio = form.find('.sample_read_type_single');
  var single_hide_radio = form.find('.sample_read_type_paired');
  var div_to_toggle = form.find('.sample_read_type_single_collapse');
  set_radio_collapse_toggle(single_hide_radio, single_show_radio,
                            div_to_toggle);
}

/**
 * Set the common metadata form.
 */
function set_common_meta_input(cb) {
  common_form = $('#sample_common_form');
  var form = common_form.children('form');

  // Construct new callback function so that the dropdowns to select organism
  // fires change for genus/species/version before change for copying the
  // field to sample meta.
  if (typeof cb == 'function') {
    function callback() {
      set_common_checkboxes(form);
      cb();
    }
  } else {
    function callback() {
      set_common_checkboxes(form);
    }
  }

  // Set shared inputs.
  set_shared_inputs(form, callback);

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

  // Set save & apply button.
  common_form.find('.save_btn').click(function () {
    var btn = $(this);

    btn.prop('disabled', true);

    // Function to show next form.
    function show_next_form() {
      var meta = $('#sample_meta')
      meta.show();
      $('#meta_footer').show();
      scroll_to_ele(meta);
    }

    save_proj(show_saved, btn, show_next_form);

  });

  // Enable popovers and tooltips.
  enable_popovers_tooltips(common_form);
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
  var pair_divs = collapse.children('div:not([style*="display:none"])');

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
      pair_1_select.children('option[value="' + pair_1 + '"]').prop('selected',
                                                                    true);
    } else {
      pair_1_select.children('option:disabled').prop('selected', true);
    }
    if (pair_2 != null && pair_2 != '') {
      pair_2_select.children('option[value="' + pair_2 + '"]').prop('selected',
                                                                    true);
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
  },
  organism: {
    get: get_values_from_organism_dropdowns,
    set: set_values_of_organism_dropdowns
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
  sample_organism_group: 'organism',
  sample_organism_strain_group: 'group_textbox',
  'sample_life-stage_group': 'group_custom_dropdown',
  sample_tissue_group: 'group_custom_dropdown',
  sample_characteristics_group: 'group_fluid_rows',
  sample_sequencing_platform_group: 'group_dropdown',
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

      // Fire change for inputs.
      form_group.find('button').change();
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

function validate_proj_meta_inputs(inputs, proj_form) {
  var valid = true;
  var failed_fields = {};

  for (var class_name in proj_meta_classes_to_functions) {
    var val = inputs[class_name];
    var form_group = proj_form.find('.' + class_name);
    var form_inputs = form_group.find('input:text,textarea,input[type=email]'
                                      + ',input[type="number"],select');
    form_inputs = form_inputs.filter(':not([style*="display:none"])');
    form_inputs.removeClass('is-invalid');

    failed_fields[class_name] = [];
    switch (class_name) {
      case 'proj_title_group':
      case 'proj_abstract_group':
      case 'proj_corresponding_group':
        if (val == null || val == '') {
          form_inputs.addClass('is-invalid');
          valid = false;
          failed_fields[class_name].push('Can not be empty or blank.');
        }
        break;

      case 'proj_corresponding_email_group':
        if (val == null || val == '' || !isEmail(val)) {
          form_inputs.addClass('is-invalid');
          valid = false;
          failed_fields[class_name].push('Must be a valid email.');
        }
        break;

      case 'proj_experimental_design_group':
        var factor_cards = form_group.find('.factor_card');

        var names = {};
        for (var i = 0; i < val.length; i++) {
          var factor = val[i];
          var factor_card = factor_cards.eq(i);
          var name_group = factor_card.find('.factor_name_group');
          var values_group = factor_card.find('.factor_values_group');

          var name_inputs = name_group.find('select,input:text');
          var values_inputs = values_group.find('input:text:not([style*="'
                                                + 'display:none"])');


          if (factor.name == null || factor.name == '') {
            name_inputs.addClass('is-invalid');
            valid = false;
            failed_fields[class_name].push('Factor name for factor ' + (i+1)
                                           + ' can not be empty or blank.');
          } else {
            // Check that no two factors are the same.
            if (factor.name in names) {
              names[factor.name].addClass('is-invalid');
              name_inputs.addClass('is-invalid');
              valid = false;
              failed_fields[class_name].push('Every factor name must be '
                                             + 'unique, but there are '
                                             + 'multiple factors with the '
                                             + 'name ' + factor.name);
            } else {
              names[factor.name] = name_inputs;
            }
          }

          if(factor.values == null || factor.values.length < 2) {
            name_inputs.addClass('is-invalid');
            valid = false;
            failed_fields[class_name].push('Factor ' + (i+1) + ' does not '
                                           + 'have at least two values.');
          }

          // Check that no two values are the same.
          var values = {};
          for (var j = 0; j < factor.values.length; j++) {
            var value_input = values_inputs.eq(j);
            var value = factor.values[j][0];
            if (value == null || value == '') {
              value_input.addClass('is-invalid');
              valid = false;
              failed_fields[class_name].push('Factor ' + (i+1) + ' has an '
                                             + 'empty or blank value.');
            } else {
              if (value in values) {
                values[value].addClass('is-invalid');
                value_input.addClass('is-invalid');
                valid = false;
                failed_fields[class_name].push('Factor ' + (i+1) + ' has '
                                               + 'multiple idenical values: '
                                               + value);
              } else {
                values[value] = value_input;
              }
            }
          }
        }
        break;
    }
  }

  if (valid) {
    return {};
  } else {
    return failed_fields;
  }
}

function validate_common_meta_inputs(inputs, common_form) {
  var valid = true;
  var failed_fields = {};

  for (var class_name in common_meta_classes_to_functions) {
    var form_group = common_form.find('.' + class_name);
    var form_inputs = form_group.find('input:text,textarea,input[type=email],'
                                      + 'input[type="number"],select');
    form_inputs = form_inputs.filter(':not([style*="display:none"])');
    form_inputs.removeClass('is-invalid');

    // Only validate if the checkbox is checked and not disabled.
    var checkbox = form_group.children('div:first').find('input:checkbox');
    if (!checkbox.prop('disabled') && checkbox.prop('checked')) {
      var val = inputs[class_name];

      failed_fields[class_name] = [];
      switch (class_name) {
        case 'sample_genotype_group':
        case 'sample_growth_conditions_group':
        case 'sample_rna_extraction_group':
        case 'sample_library_preparation_group':
        case 'sample_life-stage_group':
        case 'sample_tissue_group':
        case 'sample_sequenced_molecules_group':
        case 'sample_sequencing_platform_group':
          if (val == null || val == '') {
            form_inputs.addClass('is-invalid');
            valid = false;
            failed_fields[class_name].push('Can not be empty or blank.');
          }
          break;

        case 'sample_organism_group':
          if (val.genus == null || val.genus == '' || val.species == null
              || val.species == '' || val.version == null
              || val.version == '') {
              form_inputs.addClass('is-invalid');
              valid = false;
              failed_fields[class_name].push('Organism must be selected completely.');
            }
          break;

        case 'sample_read_type_group':
          var type = val.type;
          if (type == 1) {
            var single_group = form_group.find('.sample_read_type_single_'
                                               + 'collapse');
            var single_inputs = single_group.find('input[type="number"]');
            var length = val.length;
            if (length == null || length == '' || isNaN(length) || length == 0) {
              single_inputs.eq(0).addClass('is-invalid');
              valid = false;
              failed_fields[class_name].push('Read length can not be empty, '
                                             + 'blank, or zero.');
            }

            var stdev = val.stdev;
            if (stdev == null || stdev == '' || isNaN(stdev) || stdev == 0) {
              single_inputs.eq(1).addClass('is-invalid');
              valid = false;
              failed_fields[class_name].push('Read standard deviation can not '
                                             + 'be empty, blank, or zero.');
            }
          }
          break;

        case 'sample_characteristics_group':
          var rows = form_group.find('.sample_characteristics_row');
          for (var i = 0; i < val.length; i++) {
            var row = rows.eq(i);

            if (val[i].length == 1) {
              row.find('input:text').addClass('is-invalid');
              valid = false;
              failed_fields[class_name].push('Characteristic ' + val[i][0]
                                             + ' does not have a value.');
            }
          }
          break;
      }

    }
  }

  if (valid) {
    return {};
  } else {
    return failed_fields;
  }
}

function validate_sample_meta_inputs(inputs, sample_form) {
  var valid = true;
  var failed_fields = {};

  for (var class_name in sample_meta_classes_to_functions) {
    var val = inputs[class_name];
    var form_group = sample_form.find('.' + class_name);
    var form_inputs = form_group.find('input:text,textarea,input[type=email],'
                                      + 'input[type="number"],select');
    form_inputs = form_inputs.filter(':not([style*="display:none"])');
    form_inputs.removeClass('is-invalid');

    failed_fields[class_name] = [];
    switch (class_name) {
      case 'sample_description_group':
        if (val == null || val == '') {
          form_inputs.addClass('is-invalid');
          valid = false;
          failed_fields[class_name].push('Can not be empty or blank.');
        }
        break;

      case 'sample_factors_1_group':
      case 'sample_factors_2_group':
        var name = val.name;
        var value = val.value;

        if (name != 'FACTOR_1' && name != 'FACTOR_2' && name != null
            && name != '') {
          if (value == null || value == '') {
            form_inputs.addClass('is-invalid');
            valid = false;
            failed_fields[class_name].push('No value selected for factor '
                                           + name + '.');
          }
        }
        break;

      case 'sample_specific_characteristics_group':
        var rows = form_group.find('.sample_characteristics_row');
        for (var i = 0; i < val.length; i++) {
          var row = rows.eq(i);

          if (val[i].length == 1) {
            row.find('input:text').addClass('is-invalid');
            valid = false;
            failed_fields[class_name].push('Characteristic ' + val[i][0]
                                           + ' does not have a value.');
          }
        }
        break;
    }
  }

  for (var class_name in common_meta_classes_to_functions) {
    var val = inputs[class_name];
    var form_group = sample_form.find('.' + class_name);
    var form_inputs = form_group.find('input:text,textarea,input[type=email],'
                                      + 'input[type="number"],select');
    form_inputs = form_inputs.filter(':not([style*="display:none"])');
    form_inputs.removeClass('is-invalid');

    // Only validate common inputs in the sample-specific metadata card.
    var specific = form_group.parents('.sample_specific_card');

    if (specific.length > 0) {
      failed_fields[class_name] = [];
      switch (class_name) {
        case 'sample_genotype_group':
        case 'sample_growth_conditions_group':
        case 'sample_rna_extraction_group':
        case 'sample_library_preparation_group':
        case 'sample_organism_group':
        case 'sample_life-stage_group':
        case 'sample_tissue_group':
        case 'sample_sequenced_molecules_group':
          if (val == null || val == '') {
            form_inputs.addClass('is-invalid');
            valid = false;
            failed_fields[class_name].push('Can not be empty or blank.');
          }
          break;

        case 'sample_read_type_group':
          var type = val.type;
          if (type == 1) {
            var single_group = form_group.find('.sample_read_type_single_'
                                               + 'collapse');
            var single_inputs = single_group.find('input[type="number"]');
            var length = val.length;
            if (length == null || length == '' || length == 0) {
              single_inputs.eq(0).addClass('is-invalid');
              valid = false;
              failed_fields[class_name].push('Read length can not be empty, '
                                             + 'blank, or zero.');
            }

            var stdev = val.stdev;
            if (stdev == null || stdev == '' || stdev == 0) {
              single_inputs.eq(1).addClass('is-invalid');
              valid = false;
              failed_fields[class_name].push('Read standard deviation can not '
                                             + 'be empty, blank, or zero.');
            }
          } else if (type == 2) {
            var reads = {};
            for (var i = 0; i < reads.pairs.length; i++) {
              for (var j = 0; j < reads.pairs[i].length; j++) {
                var read = reads.pairs[i][j];
                var select = form_group.find('option[value="' + read +'"]');

                if (!(read in reads)) {
                  reads[read] = select;
                } else {
                  select.addClass('is-invalid');
                  reads[read].addClass('is-invalid');
                  valid = false;
                  failed_fields[class_name].push('A read can not be assigned '
                                                 + 'to multiple pairs.');
                }
              }
            }
          }
          break;

        case 'sample_characteristics_group':
          var rows = form_group.find('.sample_characteristics_row');
          for (var i = 0; i < val.length; i++) {
            var row = rows.eq(i);

            if (val[i].length == 1) {
              row.find('input:text').addClass('is-invalid');
              valid = false;
              failed_fields[class_name].push('Characteristic ' + val[i][0]
                                             + ' does not have a value.');
            }
          }
          break;
      }
    }
  }
  if (valid) {
    return {};
  } else {
    return failed_fields;
  }
}


var class_names_to_labels = {
  proj_title_group: 'Title',
  proj_abstract_group: 'Abstract',
  proj_corresponding_group: 'Corresponding contributor',
  proj_corresponding_email_group: 'Email',
  proj_contributors_group: 'Contributors',
  proj_sra_center_code_group: 'SRA center code',
  proj_experimental_design_group: 'Experimental design',
  sample_genotype_group: 'Genotype',
  sample_growth_conditions_group: 'Growth conditions',
  sample_rna_extraction_group: 'RNA extraction',
  sample_library_preparation_group: 'Library preparation',
  sample_miscellaneous_group: 'miscellaneous',
  sample_organism_group: 'Organism',
  sample_organism_strain_group: 'Organism strain',
  'sample_life-stage_group': 'Life-stage',
  sample_tissue_group: 'Tissue',
  sample_characteristics_group: 'Misc. characteristics',
  sample_sequencing_platform_group: 'Sequencing platform',
  sample_sequenced_molecules_group: 'Sequenced molecules',
  sample_read_type_group: 'Read type',
  sample_name_group: 'Name',
  sample_description_group: 'Description',
  sample_factors_1_group: 'Factor 1',
  sample_factors_2_group: 'Factor 2',
  sample_specific_characteristics_group: 'Additional Characteristics'
};

function add_check_meta_details(modal_body, details_div, title_class,
                                title_icon_class, title_text, failed_inputs) {
  var new_details_div = details_div.clone();
  var title = new_details_div.children('div:first');
  title.addClass(title_class);
  title.children('i').addClass(title_icon_class);
  title.append(title_text);

  var details_list = new_details_div.children('ul');
  for (var class_name in failed_inputs) {
    var descriptions = failed_inputs[class_name];

    if (descriptions.length > 0) {
      var list_item = $('<li>', {
        text: class_names_to_labels[class_name]
      });
      var list = $('<ul>');

      for (var i = 0; i < descriptions.length; i++) {
        var description = descriptions[i];
        var sub_item = $('<li>', {
          text: description
        });
        list.append(sub_item);
      }

      details_list.append(list_item);
      details_list.append(list);
    }
  }
  modal_body.append(new_details_div);
  new_details_div.show();
}

function validate_all_meta_inputs(modal) {
  var valid = true;
  var modal_body = modal.find('.modal-body');
  var details_divs = modal_body.children('.check_meta_details');

  // Remove.
  details_divs.filter(':not([style*="display:none"])').remove();

  var details_div = details_divs.filter('[style*="display:none"]');

  // First, validate project metadata.
  var proj_inputs = get_proj_meta_inputs(proj_form);
  var failed_inputs = validate_proj_meta_inputs(proj_inputs, proj_form);

  // Some inputs failed, so we need to add the failed descriptions to the
  // modal.
  if (Object.keys(failed_inputs).length > 0) {
    valid = false;
    var title_icon_class = 'fa-cube';
    var title_text = 'Project Metadata Form';
    var title_class = 'alert-primary';
    add_check_meta_details(modal_body, details_div, title_class,
                           title_icon_class, title_text, failed_inputs);
  }

  // Common inputs.
  var common_inputs = get_common_meta_inputs(common_form);
  failed_inputs = validate_common_meta_inputs(common_inputs, common_form);

  if (Object.keys(failed_inputs).length > 0) {
    valid = false;
    title_icon_class = 'fa-share-alt';
    title_text = 'Common Metadata Form';
    title_class = 'alert-info';
    add_check_meta_details(modal_body, details_div, title_class,
                           title_icon_class, title_text, failed_inputs);
  }

  for (var id in sample_forms) {
    var sample_form = sample_forms[id];
    var sample_inputs = get_sample_meta_inputs(sample_form);
    failed_inputs = validate_sample_meta_inputs(sample_inputs, sample_form);

    if (Object.keys(failed_inputs).length > 0) {
      valid = false;
      title_icon_class = 'fa-cubes';
      title_text = 'Sample Metadata Form: ' + proj.samples[id].name;
      title_class = 'alert-warning';
      add_check_meta_details(modal_body, details_div, title_class,
                             title_icon_class, title_text, failed_inputs);
    }
  }

  return valid;
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
 * Fill forms with test metadata.
 */
function fill_with_test_metadata() {
  set_proj_meta_inputs(proj_form, test_proj_inputs);
  set_common_meta_inputs(common_form, test_common_inputs);

  for (var name in test_samples_inputs) {
    var test_sample_inputs = test_samples_inputs[name];
    var sample_form = sample_forms[names_to_ids[name]];

    set_sample_meta_inputs(sample_form, test_sample_inputs);
  }
}

/**
 * Read all meta inputs.
 */
function set_all_meta_inputs() {
  var proj_inputs = $('#proj');
  var common_inputs = $('#sample_common_form');
  read_object_from_temp('proj_inputs', function (obj, form) {
    set_proj_meta_inputs(form, obj);

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

  // Re-fire factor change.
  proj_inputs.find('.proj_experimental_design_group').find('select').change();
  setTimeout(function () {
    common_inputs.find('.sample_characteristics_group').find('button').change();
  }, 4000);
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
        obj.meta.contributors.unshift(input);
        break;
      case 'proj_corresponding_email_group':
        obj.meta.corresponding['email'] = input;
        break;

      case 'proj_contributors_group':
        for (var i = 0; i < input.length; i++) {
          var contributor = input[i][0];

          if (contributor != null && contributor != '') {
            if (!obj.meta.contributors.includes(contributor)) {
              obj.meta.contributors.push(contributor);
            }
          }
        }
        break;

      case 'proj_experimental_design_group':
        obj['design'] = input.length;

        var factors = {};
        for (var i = 0; i < input.length; i++) {
          name = input[i].name;

          var values = [];
          for (var j = 0; j < input[i].values.length; j++) {
            var value = input[i].values[j][0];
            values.push(value);
          }
          factors[name] = values;
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
        obj['organism'] = input;
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

      case 'sample_sequencing_platform_group':
        obj.meta['platform'] = input;
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
        } else if (!characteristics[char].includes(detail) && detail != ''
                   && detail != null) {
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

    // Set the reads table for this sample.
    set_reads_table(id, new_sample_form);

    // Characteristics.
    var char_group = new_sample_form.find('.sample_specific_'
                                          + 'characteristics_group');
    set_fluid_input_rows(char_group.find('.sample_characteristics_inputs'));

    // Save changes button.
    var save_changes_btn = new_sample_form.find('.save_btn');
    save_changes_btn.click(function () {
        var btn = $(this);
        btn.prop('disabled', true);

        save_proj(show_saved, btn);
    });

    // Set up copy buttons.
    var copy_btns = new_sample_form.find('.copy_btn');
    copy_btns.each(function () {
      set_copy_btn($(this), id);
    })

    // Append new form.
    $('#sample_card').append(new_sample_form);
  }

  // Then, set the button handler.
  var dropdown = $('#sample_choices');
  set_choose_sample_button(dropdown, sample_forms);

  // Enable popovers and tooltips.
  enable_popovers_tooltips(sample_form);
}

/**
 * Set up copy button to show a popover.
 */
function set_copy_btn(copy_btn, id_to_ignore) {
  // Extract the data-group HTML attribute.
  var group = copy_btn.data('group');

  // This is the DOM element that will be placed as the content of the div.
  var wrapper = $('<div>');
  var content = $('<div class="btn-group-toggle" data-toggle="buttons" '
                  + 'data-group=' + group + '></div>');

  // This is a template of the label and input to copy.
  var label = $('<label class="btn btn-sm btn-outline-primary mr-2"></label>');
  var input = $('<input type="checkbox" name="copy" autocomplete="off">');

  // Loop through each sample and make a button for each, except the one
  // corresponding to id_to_ignore.
  for (var i = 0; i < sorted_names.length; i++) {
    var name = sorted_names[i];
    var id = names_to_ids[name];

    if (id != id_to_ignore) {
      // Make a copy of the input and label and set attributes.
      var label_copy = label.clone();
      var input_copy = input.clone();
      input_copy.val(id);

      label_copy.append(input_copy);
      label_copy.append(name);
      content.append(label_copy);
    }
  }
  // Add button to actually do the copying.
  wrapper.append(content);
  wrapper.append($('<hr>'));
  wrapper.append($('<button class="btn btn-warning copy_btn" ' +
                   'data-group=' + group + '>Copy to selected samples</button>'))

  // Set up the popover.
  // Note that we need to add a listener for when the popover if shown to
  // appropriately implement the actual copy functionality.
  copy_btn.popover({
    'title': 'Please select the samples to copy this input to',
    'content': wrapper.html(),
    // We can't set the trigger to be 'focus' because then the buttons within
    // the popover are not clickable.
    // 'trigger': 'focus',
    'html': true
  }).on('shown.bs.popover', function (e) {
    var popover = $('#' + $(e.target).attr('aria-describedby'));
    popover.find('.copy_btn').click(copy_input);

    // Add this popover as one of the shown popovers.
    // When the current sample form is changed, we also have to loop through
    // this list to close all opened popovers.
    shown_popovers.push($(this));
  });
}

/**
 * Helper function that actually implements the copying.
 * This function is called by the copy button located WITHIN THE POPOVER.
 */
function copy_input() {
  var copy_btn = $(this);
  var popover_body = copy_btn.parents('.popover-body')
  var group = copy_btn.data('group');

  // Get the input to copy.
  var input_group = current_sample_form.find('.' + group);
  var group_type = sample_meta_classes_to_functions[group];
  var val = getters_and_setters[group_type].get(input_group);

  // Construct a list of sample ids to copy it to.
  var ids_to_copy = [];
  var active_labels = popover_body.find('label.active');
  active_labels.each(function () {
    var label = $(this);
    var checkbox = label.children('input');
    ids_to_copy.push(checkbox.val());
  });

  // Output list of selected ids for debugging.
  console.log(ids_to_copy);

  // Copy the value to these samples.
  for (var i = 0; i < ids_to_copy.length; i++) {
    var id = ids_to_copy[i];
    var sample_form = sample_forms[id];

    var input_group_to_copy = sample_form.find('.' + group);
    getters_and_setters[group_type].set(input_group_to_copy, val);
  }

  // Finally, disable this button to let the user know the values have
  // been copied.
  copy_btn.text('Copied!');
  copy_btn.prop('disabled', true);
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
function set_choose_controls_modal(modal, factors) {
  // First, let's set the header.
  var header = modal.find('.choose_controls_header');
  var form = modal.find('.proj_control_form');
  header.text(header.text().replace('FACTOR', Object.keys(factors).length
                                              + '-factor'));

  // Set up common listener first.
  var validate_btn = modal.find('#validate_controls_btn');
  var start_btn = modal.find('#start_analysis_btn');
  var start_tooltip = modal.find('#start_analysis_tooltip');
  var control_group = modal.find('.proj_control_group[style*="'
                                 + 'display:none"]').clone();
  var samples_group = modal.find('.proj_control_samples_group');

  // Initialize tooltip.
  start_tooltip.tooltip();

  // If the select changes, we need to disable the start button and enable
  // the tooltip.
  var select = control_group.find('select');
  select.change({
    'btn': start_btn,
    'tooltip': start_tooltip,
  }, function (e) {
    var btn = e.data.btn;
    var tooltip = e.data.tooltip;
    var select = $(this);
    var samples_group = select.parent().parent().parent().children('.proj_'
                                                + 'control_samples_group');

    btn.prop('disabled', true);
    btn.css('pointer-events', 'none');
    tooltip.tooltip('enable');
    samples_group.collapse('hide');
  });

  // Set up each factor.
  var control_groups = [];
  var factor_num = 0;
  for (var factor_name in factors) {
    factor_num++;
    var factor_values = factors[factor_name];
    var new_control_group = control_group.clone(true);
    control_groups.push(new_control_group);

    // Then, change the text of each legend to match this factor.
    var legends = new_control_group.find('legend');
    legends.each(function () {
      var legend = $(this);
      legend.text(legend.text().replace('FACTOR_NUM', 'Factor ' + factor_num));
    });

    // Then, set the input and select.
    var name_group = new_control_group.find('.proj_control_name_group');
    name_group.find('input:text:disabled').val(factor_name);
    var values_group = new_control_group.find('.proj_control_values_group');
    for (var j = 0; j < factor_values.length; j++) {
      var value = factor_values[j];
      var option = $('<option>', {
        text: value
      });
      values_group.find('select').append(option);
    }

    // Append the new factor and show it.
    form.append(new_control_group);
    new_control_group.show();
  }

  // Bind the validate button.
  validate_btn.click({
    'control_groups': control_groups,
    'btn': start_btn,
    'tooltip': start_tooltip
  }, function (e) {
    var valid = true;
    var controls = {};
    var control_groups = e.data.control_groups;

    for (var i = 0; i < control_groups.length; i++) {
      var control_group = control_groups[i];

      // Get the name and selected value from the control group.
      var name_input = control_group.find('input:text:disabled');
      var name = name_input.val();
      var value_select = control_group.find('select');
      var value = value_select.children('option:selected'
                                        + ':not(:disabled)').val();

      // If the value is null or empty, the user did not make a selection.
      if (value == null || value == '') {
        value_select.addClass('is-invalid');
        valid = false;
      } else {
        value_select.removeClass('is-invalid');
        controls[name] = value;

        // Add the list of project that match this control.
        var samples_group = control_group.find('.proj_control_samples_group');
        var samples_list = samples_group.children('ul');
        samples_list.children('li').remove();
        var samples = chars_details_to_samples[name][value];
        var sample_names = [];
        for (var j = 0; j < samples.length; j++) {
          var id = samples[j];
          sample_names.push(proj.samples[id].name);
        }

        sample_names.sort();
        for (var j = 0; j < sample_names.length; j++) {
          var li = $('<li>', {
            text: sample_names[j]
          });
          samples_list.append(li);
        }

        samples_group.collapse('show');
      }
    }

    // Only if the form is valid, set the controls of the global proj object.
    var btn = e.data.btn;
    var tooltip = e.data.tooltip;
    if (valid) {
      proj['controls'] = controls;

      btn.prop('disabled', false);
      btn.css('pointer-events', 'auto');
      tooltip.tooltip('disable');
    } else {
      btn.prop('disabled', true);
      btn.css('pointer-events', 'none');
      tooltip.tooltip('enable');
    }
  });

  // Bind the start analysis button.
  start_btn.click({
    'modal': modal
  }, function (e) {
    console.log('start analysis');
    $(this).prop('disabled', true);
    var modal = e.data.modal;
    write_proj();
    start_analysis(function () {
      modal.modal('hide');
      get_proj_status();
    });
  });
}

/**
 * Set and finalize project. Then, start analysis.
 */
function start_analysis(cb) {
  var target = 'cgi_request.php';
  var data = {
    action: 'set_proj',
    id: proj_id
  };
  function callback(cb) {
    var target = 'cgi_request.php';
    var data = {
      action: 'finalize_proj',
      id: proj_id
    };
    function callback(cb) {
      var target = 'cgi_request.php';
      var data = {
        action: 'do_all',
        id: proj_id
      };
      var callback = cb;
      send_ajax_request(target, data, callback, false);
    }
    send_ajax_request(target, data, callback, false, cb);
  }
  send_ajax_request(target, data, callback, false, cb);
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

  // Then, convert to proj object.
  convert_all_meta_inputs();

  // Verify.
  var check_meta_modal = $('#check_meta_modal');
  var choose_controls_modal = $('#choose_controls_modal');
  var valid = validate_all_meta_inputs(check_meta_modal);

  // Depending on whether or not all the input is valid,
  // show different modal.
  if (valid) {
    var new_modal = choose_controls_modal.clone();

    set_chars_details_to_samples();
    set_choose_controls_modal(new_modal, proj.factors);
    new_modal.modal('show');
  } else {
    check_meta_modal.modal('show');
  }
}

/**
 * Set meta input form.
 */
function set_meta_input(cb) {
  // Then, set the samples metadata.
  set_samples_meta_input();

  // We have to set the common meta input form after setting up the samples
  // because this function assumes that the global sample_forms variable
  // is populated.
  set_common_meta_input(cb);

  // Deal with project meta input form last.
  set_proj_meta_input();

  // set_meta_input_fields();

  // Then, add listener to verify metadata button.
  $('#verify_meta_btn').click(show_verify_meta_modal);

  // Set listener for fill with test metadata button.
  $('#test_metadata_btn').click(fill_with_test_metadata);
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
  $('#meta_container').show();
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
      var target = 'cgi_request.php';
      var data = {
        id: proj_id,
        action: 'set_proj'
      };
      send_ajax_request(target, data, null, false);
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
 * Helper function to test whether a string is an email.
 */
function isEmail(email) {
  var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
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
  sample_meta.meta['description'] = sample_input_fields.meta['description']
                                                       .val();

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
  sample_meta['type'] = parseInt(sample_input_fields['type']
                                 .find('input:checked').val());

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
function read_object_from_temp(fname, cb, form) {
  var target = 'read_proj.php';
  var data = {
    'id': proj_id,
    'fname': fname,
  };
  var callback = parse_temp_obj;
  send_ajax_request(target, data, callback, true, cb, form);
}

/**
 * Write specified object to temporary directory.
 */
function write_object_to_temp(obj, fname, callback) {
  var target = 'jsonify.php';
  var data = {
    'id': proj_id,
    'fname': fname,
    'json': JSON.stringify(obj, null, 4)
  };
  send_ajax_request(target, data, callback, false);
}

/**
 * Writes the global proj variable as json to the project temp
 * directory.
 */
function write_proj(callback, ...args) {
  var target = 'jsonify.php';
  var data = {
    id: proj_id,
    json: JSON.stringify(proj, null, 4)
  };
  first_args = [target, data, callback, false];
  send_ajax_request.apply(this, first_args.concat(args));
}

/******* Server output parsers ************************************/
function parse_server_status(out) {
  if (out.includes("true")) {
    set_badge(true);
  } else {
    set_badge(false);
  }
}

function parse_new_proj(out, spinner) {
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

function get_id_pw(out) {
  // Split response to lines.
  var split = out.split('\n');

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

function parse_ftp_info(out) {
  // Parse pw.
  var split = out.split('\n');
  var pw = split[split.length - 3];
  show_ftp_info(proj_id, pw);
}

function parse_copy_test(spinner, success) {
  spinner.hide();
  success.show();
}

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
      // 'scrollY': 500,
      'columnDefs':[{
        'targets':[2,3],
        'orderable': false
      }]
    });
  }
}

function parse_md5(out, md5_id, spinner_id) {
  // Remove the spinner.
  $('#' + spinner_id).hide();

  // Get md5 from output.
  md5 = out.split('  ')[0];
  $('#' + md5_id).text(md5);
}


function parse_infer_samples(out, button, spinner, width) {
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

  // Make sure there are at least 4 samples.
  if (Object.keys(proj.samples).length < 4) {
    // Reset start annotation button.
    button.prop('disabled', false);
    spinner.hide();
    button.width(width);

    var first = $('#infer_samples_modal');
    var second = $('#sample_count_modal');

    first.on('hidden.bs.modal', {
      'second': second
    }, function (e) {
      var second = e.data.second;
      second.modal('show');
      $(this).off('hidden.bs.modal');
    });

    first.modal('hide');
  } else {
    set_sample_name_input(proj);
    show_sample_name_input();
  }
}

function parse_organisms(out, inputs) {
  var split = out.substring(out.indexOf('{'));
  var split2 = split.split('END');
  var dump = split2[0];

  organisms = JSON.parse(dump);

  // Set the dropdowns.
  populate_organisms_inputs(inputs, organisms);
}

function parse_read_proj(out) {
  proj = JSON.parse(out);

  set_meta_input(set_all_meta_inputs);

  show_meta_input();

}

function parse_temp_obj(out, callback, form) {
  var obj = JSON.parse(out);

  if (typeof callback === 'function') {
    if (form != null) {
      callback(obj, form);
    } else {
      callback(obj);
    }
  }}

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

    case progress.diff_error:
    case progress.quant_error:
    case progress.qc_error:
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
    case progress.geo_compiling:
    case progress.geo_compiled:
    case progress.geo_submitting:
    case progress.geo_submitted:
      goto_progress(status);
      break;

  }
}

function update_proj_status(out) {
  var split = out.split('\n');
  var status = parseInt(split[split.length - 3]);

  set_progress(status);

  if (status >= progress.diff_finished || status < 0) {
    clearInterval(project_progress_interval);
    project_progress_interval = null;
  }
}


function parse_output_textarea(out, textarea, ul) {
  textarea.val(out);
  textarea.scrollTop(textarea[0].scrollHeight);

  // Replace contents of the ul with the commands (lines that start with '##')
  var ul_id = ul.attr('id');
  var new_ul = $('<ul style="font-size:0.8em">');
  new_ul.attr('id', ul_id);

  // Loop through each line of the output.
  var split = out.split('\n');
  for (var i = 0 ; i < split.length; i++) {
    var line = split[i];
    if (line.startsWith('##')) {
      // Allow the browser to line break any time after a slash '/' or comma ','
      line = line.replace(new RegExp('/', 'g'), '/<wbr>');
      line = line.replace(new RegExp(',', 'g'), ',<wbr>');

      new_ul.append($('<li>' + line.substring(3, line.length) + '</li>'));
    }
  }

  // Replace.
  ul.replaceWith(new_ul);
}

function parse_sleuth_server(out, btn, spinner, width) {
  var split = out.split('\n');
  var line = split[split.length - 3];
  var split2 = line.split(' ');
  var port = parseInt(split2[split2.length - 1]);

  function open_sleuth_window(port, btn, spinner, width) {
    console.log(port);

    btn.prop('disabled', false);
    spinner.hide();
    btn.width(width);

    var url = 'http://' + window.location.hostname + ':' + port + '/';
    var win = window.open(url, '_blank');

    // Check if popup has been blocked. If it has, notify the user
    // to allow popups, or to click on a link that will direct them to the
    // sleuth page.
    if (win == null || typeof(win) == 'undefined') {
      var modal = $('#popup_modal');
      url_element = modal.find('#sleuth_url');
      url_element.text(url);
      url_element.attr('href', url);

      modal.modal('show');
    }
  }

  if (out.includes('already open')) {
    setTimeout(open_sleuth_window, 1500, port, btn, spinner, width);
  } else {
    setTimeout(open_sleuth_window, 8000, port, btn, spinner, width);
  }
}

/**
 * Sends request.
 */
function send_ajax_request(target, data, callback, include_out, ...args) {
  // Send ajax request.
  $.ajax({
    type: 'POST',
    url: target,
    'data': data,
    success:function(out) {
      console.log(out);

      if (out.includes('ERROR')) {
        var modal = $('#error_modal');
        modal.find('#error_output').val(out);
        modal.modal('show');
      } else {

        if (typeof callback === 'function') {
          if (include_out) {
            args.unshift(out);
          }
          callback.apply(this, args);
        }
      }
    }
  });
}

// Global variables.
var proj_id;
var proj;
var organisms;
var meta_input_fields;
var ftp_pw;
var raw_reads_div;
var controls_modal;
var dropdown_items = {};
var shown_popovers = [];
var proj_form;
var common_form;
var current_sample_form;
var sample_forms = {};
var names_to_ids;
var sorted_names;
var import_export_dropdown;
var proj_contributor_fields = [];
var proj_factor_0_fields = [];
var proj_factor_1_fields = [];
var sample_characteristic_fields = {};
var sample_pair_fields = {};
var chars_to_samples = {};
var chars_details_to_samples = {};
var commands = {};
var progress = {
    'diff_error':     -12,
    'quant_error':     -9,
    'qc_error':        -6,
    'error':           -1,
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
    'server_open':      14,
    'geo_compiling':    15,
    'geo_compiled':     16,
    'geo_submitting':   17,
    'geo_submitted':    18
};
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
];
var sequencing_platforms = [
  'Illumina Genome Analyzer',
  'Illumina Genome Analyzer II',
  'Illumina Genome Analyzer IIx',
  'Illumina HiSeq 2500',
  'Illumina HiSeq 2000',
  'Illumina HiSeq 1500',
  'Illumina HiSeq 1000',
  'Illumina MiSeq',
  'Illumina HiScanSQ',
  'Illumina NextSeq 500',
  'NextSeq 500',
  'HiSeq X Ten',
  'HiSeq X Five',
  'Illumina HiSeq 3000',
  'Illumina HiSeq 4000',
  'NextSeq 550',
  // AB SOLiD System
  // AB SOLiD System 2.0
  // AB SOLiD System 3.0
  // AB SOLiD 3 Plus System
  // AB SOLiD 4 System
  // AB SOLiD 4hq System
  // AB SOLiD PI System
  'AB 5500 Genetic Analyzer',
  'AB 5500xl Genetic Analyzer',
  'AB 5500xl-W Genetic Analysis System',
  '454 GS',
  '454 GS 20',
  '454 GS FLX',
  '454 GS FLX+',
  '454 GS Junior',
  '454 GS FLX Titanium',
  'Helicos HeliScope',
  'PacBio RS',
  'PacBio RS II',
  'Complete Genomics',
  'Ion Torrent PGM',
  'Ion Torrent Proton',
];
var sequenced_molecules = [
  'Poly-A Purified',
  'Total RNA',
  'Tissue-specific tagged poly-A RNA',
  'Tissue-specific tagged total RNA'
];
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
  'sample_sequencing_platform_group',
  'sample_sequenced_molecules_group',
  'sample_read_type_group',
  'sample_specific_characteristics_group'
];

var test_proj_inputs = {
    "proj_title_group": "test title",
    "proj_abstract_group": "test abstract",
    "proj_corresponding_group": "test corresponding contributor",
    "proj_corresponding_email_group": "testemail@email.com",
    "proj_contributors_group": [
        [
            "test contributor 1"
        ],
        [
            "test contributor 2"
        ],
        [
            "test contributor 3"
        ]
    ],
    "proj_sra_center_code_group": "test sra center code",
    "proj_experimental_design_group": [
        {
            "name": "test factor 1",
            "values": [
                [
                    "value1"
                ],
                [
                    "value2"
                ]
            ]
        }
    ]
};
var test_common_inputs = {
    "sample_genotype_group": "shared genotype",
    "sample_growth_conditions_group": "shared growth conditions",
    "sample_rna_extraction_group": "shared rna extraction",
    "sample_library_preparation_group": "shared library prep",
    "sample_miscellaneous_group": "shared misc",
    "sample_organism_group": {
      'genus': 'caenorhabditis',
      'species': 'elegans',
      'version': '266'
    },
    "sample_organism_strain_group": "shared strain",
    "sample_life-stage_group": "Young Adult",
    "sample_tissue_group": "Whole Organism (Multi-worm)",
    "sample_characteristics_group": [
        [
            "shared characteristic 1 name",
            "shared characteristic 1 value"
        ],
        [
            "shared characteristic 2 name",
            "shared characteristic 2 value"
        ]
    ],
    "sample_sequencing_platform_group": "Illumina Genome Analyzer",
    "sample_sequenced_molecules_group": "Total RNA",
    "sample_read_type_group": {
        "type": 1,
        "length": 200,
        "stdev": 60
    }
};
var test_samples_inputs = {
  'wt1': {
      "sample_name_group": "wt1",
      "sample_description_group": "wt1 description",
      "sample_factors_1_group": {
          "name": "test factor 1",
          "value": "value2"
      },
      "sample_factors_2_group": {
          "name": "FACTOR_2",
          "value": ""
      },
      "sample_specific_characteristics_group": [
          [
              "e",
              "f"
          ],
          [
              "g",
              "h"
          ]
      ],
      "sample_genotype_group": "shared genotype",
      "sample_growth_conditions_group": "shared growth conditions",
      "sample_rna_extraction_group": "shared rna extraction",
      "sample_library_preparation_group": "shared library prep",
      "sample_miscellaneous_group": "shared misc",
      "sample_organism_group": {
        'genus': 'caenorhabditis',
        'species': 'elegans',
        'version': '266'
      },
      "sample_organism_strain_group": "shared strain",
      "sample_life-stage_group": "Young Adult",
      "sample_tissue_group": "Whole Organism (Multi-worm)",
      "sample_characteristics_group": [
          [
              "shared characteristic 1 name",
              "shared characteristic 1 value"
          ],
          [
              "shared characteristic 2 name",
              "shared characteristic 2 value"
          ]
      ],
      "sample_sequenced_molecules_group": "Total RNA",
      "sample_read_type_group": {
          "type": 1,
          "length": 200,
          "stdev": 60
      }
  },
  'wt2': {
      "sample_name_group": "wt2",
      "sample_description_group": "wt2 description",
      "sample_factors_1_group": {
          "name": "test factor 1",
          "value": "value2"
      },
      "sample_factors_2_group": {
          "name": "FACTOR_2",
          "value": ""
      },
      "sample_specific_characteristics_group": [
          [
              "i",
              "j"
          ]
      ],
      "sample_genotype_group": "shared genotype",
      "sample_growth_conditions_group": "shared growth conditions",
      "sample_rna_extraction_group": "shared rna extraction",
      "sample_library_preparation_group": "shared library prep",
      "sample_miscellaneous_group": "shared misc",
      "sample_organism_group": {
        'genus': 'caenorhabditis',
        'species': 'elegans',
        'version': '266'
      },
      "sample_organism_strain_group": "shared strain",
      "sample_life-stage_group": "Young Adult",
      "sample_tissue_group": "Whole Organism (Multi-worm)",
      "sample_characteristics_group": [
          [
              "shared characteristic 1 name",
              "shared characteristic 1 value"
          ],
          [
              "shared characteristic 2 name",
              "shared characteristic 2 value"
          ]
      ],
      "sample_sequenced_molecules_group": "Total RNA",
      "sample_read_type_group": {
          "type": 1,
          "length": 200,
          "stdev": 60
      }
  },
  'mt1': {
      "sample_name_group": "mt1",
      "sample_description_group": "mt1 description",
      "sample_factors_1_group": {
          "name": "test factor 1",
          "value": "value1"
      },
      "sample_factors_2_group": {
          "name": "FACTOR_2",
          "value": ""
      },
      "sample_specific_characteristics_group": [
          [
              "additional char 1",
              "additional char 1 value"
          ],
          [
              "additional char 2",
              "additional char 2 value"
          ]
      ],
      "sample_genotype_group": "shared genotype",
      "sample_growth_conditions_group": "shared growth conditions",
      "sample_rna_extraction_group": "shared rna extraction",
      "sample_library_preparation_group": "shared library prep",
      "sample_miscellaneous_group": "shared misc",
      "sample_organism_group": {
        'genus': 'caenorhabditis',
        'species': 'elegans',
        'version': '266'
      },
      "sample_organism_strain_group": "shared strain",
      "sample_life-stage_group": "Young Adult",
      "sample_tissue_group": "Whole Organism (Multi-worm)",
      "sample_characteristics_group": [
          [
              "shared characteristic 1 name",
              "shared characteristic 1 value"
          ],
          [
              "shared characteristic 2 name",
              "shared characteristic 2 value"
          ]
      ],
      "sample_sequenced_molecules_group": "Total RNA",
      "sample_read_type_group": {
          "type": 1,
          "length": 200,
          "stdev": 60
      }
  },
  'mt2': {
      "sample_name_group": "mt2",
      "sample_description_group": "mt2 description",
      "sample_factors_1_group": {
          "name": "test factor 1",
          "value": "value1"
      },
      "sample_factors_2_group": {
          "name": "FACTOR_2",
          "value": ""
      },
      "sample_specific_characteristics_group": [
          [
              "a",
              "b"
          ],
          [
              "c",
              "d"
          ]
      ],
      "sample_genotype_group": "shared genotype",
      "sample_growth_conditions_group": "shared growth conditions",
      "sample_rna_extraction_group": "shared rna extraction",
      "sample_library_preparation_group": "shared library prep",
      "sample_miscellaneous_group": "shared misc",
      "sample_organism_group": {
        'genus': 'caenorhabditis',
        'species': 'elegans',
        'version': '266'
      },
      "sample_organism_strain_group": "shared strain",
      "sample_life-stage_group": "Young Adult",
      "sample_tissue_group": "Whole Organism (Multi-worm)",
      "sample_characteristics_group": [
          [
              "shared characteristic 1 name",
              "shared characteristic 1 value"
          ],
          [
              "shared characteristic 2 name",
              "shared characteristic 2 value"
          ]
      ],
      "sample_sequenced_molecules_group": "Total RNA",
      "sample_read_type_group": {
          "type": 1,
          "length": 200,
          "stdev": 60
      }
  }
}


// Global variables for holding interval ids.
var project_progress_interval;
var output_intervals = {};

// Global variable to indicate if this is a testing environment.
var testing = false;

// To run when page is loaded.
$(document).ready(function() {
  var pathname = window.location.pathname;
  // Do these only if we are at the home page.
  if (pathname.includes('about.html')) {

  } else if (pathname.includes('faq.html')) {

  } else {
    // Fetch server status.
    get_server_status();

    // initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // initialize popovers
    $('[data-toggle="popover"]').popover();

    // Add on click handler for start project button.
    $('#new_proj_btn').click(new_proj);

    raw_reads_div = $('#raw_reads_div').clone(true);
    controls_modal = $('#choose_controls_modal').clone(true);

    // Otherwise, assume we are at home.
    url_params = get_url_params();
    console.log(url_params);
    if (url_params.has('testing')) {
      if (url_params.get('testing') == 'true') {
        console.log('testing: true');
        testing = true;
      }
    }
    // If we are given an id, we need to resume where we left off with that
    // project.
    if (url_params.has('id')) {
      proj_id = url_params.get('id');

      // Go to whatever step we need to go to.
      get_proj_status();
    }
  }

  // Enable all testing elements.
  if (testing) {
    $('.testing').show();
  }
});
