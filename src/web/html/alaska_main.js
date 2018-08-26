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


  // Then, set the rows.
  var row_id = 'name_input_row_SAMPLEID';
  var folder_id = 'name_input_folder_SAMPLEID';
  var name_id = 'name_input_SAMPLEID';

  for (var id in proj.samples) {

    var new_folder_id = folder_id.replace('SAMPLEID', id);
    var new_name_id = name_id.replace('SAMPLEID', id);

    var row = $('#' + row_id).clone();
    var def = proj.samples[id].name;

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
function show_sample_form(form) {
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
  var dropdown_item_id = 'show_sample_SAMPLEID';

  for (var id in forms) {
    var new_dropdown_item_id = dropdown_item_id.replace('SAMPLEID', id);

    var dropdown_item = $('#' + dropdown_item_id).clone();

    // Change id, text.
    dropdown_item.attr('id', new_dropdown_item_id);
    dropdown_item.text(proj.samples[id].name);

    // Append to global variable.
    dropdown_items[id] = dropdown_item;

    // Set on click handler.
    dropdown_item.click({'id': id}, function (e) {
      console.log('clicked ' + e.data.id);
      show_sample_form(sample_forms[e.data.id]);
    });

    // Append to html and show.
    dropdown.append(dropdown_item);
    dropdown_item.show();
  }
}

/*
 * Set meta input form.
 */
function set_meta_input() {
  var sample_form_id = 'sample_SAMPLEID'

  for (var id in proj.samples) {
    var new_sample_form_id = sample_form_id.replace('SAMPLEID', id);

    var sample_form = $('#' + sample_form_id).clone(true);

    // Change sample form id.
    sample_form.attr('id', new_sample_form_id);

    // Replace all instances of SAMPLEID to the id.
    var html = sample_form.html();
    sample_form.html(html.replace(new RegExp('SAMPLEID', 'g'), id));

    // Change the header to be the id.
    sample_form.find('#sample_id_' + id).text(id);
    sample_form.find('#sample_name_' + id).val(proj.samples[id].name);

    sample_forms[id] = sample_form;

    // Append new form.
    $('#sample_card').append(sample_form);
  }

  // Then, set the button handler.
  var dropdown = $('#sample_choices');
  set_choose_sample_button(dropdown, sample_forms);
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
}

/**
 * Fetch custom sample names and replace the default names.
 */
function fetch_sample_names() {
  var input_id = 'name_input_SAMPLEID';

  for (var id in proj.samples) {
    var input = $('#' + input_id.replace('SAMPLEID', id));
    proj.samples[id].name = input.val();
  }
}

/*
 * Set and show meta input form.
 */
function meta_input() {
  fetch_sample_names();

  set_meta_input();

  show_meta_input();
}

// Global variables.
var proj_id;
var proj;
var ftp_pw;
var raw_reads_div;
var dropdown_items = {};
var proj_form;
var current_sample_form;
var sample_forms = {};

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

  bind_raw_reads();
  $('#refetch_reads_btn_2').click(refetch_reads);
  raw_reads_div = $('#raw_reads_div').clone(true);

  // Bind infer samples button.
  $('#infer_samples_btn').click(infer_samples);

  // Bind done button for inputing sample names.
  $('#sample_names_btn').click(meta_input);

  // Fetch server status.
  get_server_status();
});
