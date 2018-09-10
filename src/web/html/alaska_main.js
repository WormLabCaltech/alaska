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
 * Go to meta input page.
 */
function goto_meta_input() {
  read_proj();
}

/**
 * Go to analysis status page.
 */
function goto_analysis_status() {

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
    case 0:
    case 1:
      console.log('status: created');
      goto_ftp_info();
      break;

    // Samples inferred
    case 2:
      console.log('status: samples inferred');
      goto_meta_input()
      break;
    case 3:
      console.log('status: set');
      break;
    case 4:
      console.log('status: finalized');
      break;
    case 4:
      console.log('status: in queue');
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
 * Sets the dropdown of available organisms.
 */
function set_organisms_dropdown() {
  var dropdown_id = 'sample_organism_SAMPLEID';
  var option_id = 'sample_organism_SAMPLEID_option';

  for (var id in sample_forms) {
    var new_dropdown_id = dropdown_id.replace('SAMPLEID', id);
    var new_option_id = option_id.replace('SAMPLEID', id);
    var dropdown = sample_forms[id].find('#' + new_dropdown_id);

    // Loop through each organism.
    for (var i = 0; i < organisms.length; i++) {
      var org = organisms[i];

      // Get clone of placeholder option.
      var option = dropdown.children('#' + new_option_id).clone();

      // Set the value and remove id (because we don't need the id).
      option.attr('value', org);
      option.attr('id', '');
      option.text(org);

      // Add it to the dropdown.
      dropdown.append(option);

      // Then, show it.
      option.show();
    }
  }
}


/**
 * Sets the internal list of available organisms.
 */
function set_organisms() {
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
      set_organisms_dropdown();
    }
  });
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
  // First, hide the import/export popover.
  var import_btn = $('#sample_import_outer_btn');
  var export_btn = $('#sample_export_outer_btn');
  import_btn.popover('hide');
  export_btn.popover('hide');

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
      show_sample_form(e.data.id, sample_forms[e.data.id]);
    });

    // Append to html and show.
    dropdown.append(dropdown_item);

    dropdown_item.show();
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
    paired = e.data.paired;
    if (this.checked) {
      paired.collapse('hide');
    }
  });
  paired_radio.click({'paired': paired}, function (e) {
    paired = e.data.paired;
    if (this.checked) {
      paired.collapse('show');
    }
  });
}

/**
 * Import data from sample.
 */
function import_sample() {

}

/**
 * Refreshes the names in the import/export dropdown.
 */
function refresh_import_export_samples() {
  var import_dropdown = $('#import_popover_dropdown');
  var export_dropdown = $('#export_popover_dropdown');

  for (var name in names_to_ids) {
    var id = names_to_ids[name];

    // These are samples that we will refresh in this iteration.
    var import_sample = import_dropdown.children('option[value="' + id + '"]');
    var export_sample = export_dropdown.children('option[value="' + id + '"]');

    // Refresh the text.
    import_sample.text(name);
    export_sample.text(name);
  }
}

/**
 * Set import/export samples list.
 */
function add_import_export_sample(name, id) {
  var import_dropdown = $('#import_popover_dropdown');
  var export_dropdown = $('#export_popover_dropdown');

  var option = $('<option>', {
    text: name,
    value: id,
  });

  import_dropdown.append(option.clone());
  export_dropdown.append(option.clone());

  set_import_export_popover_btn();
}

/**
 * Returns content for import/export popover title.
 */
function get_import_export_popover_title() {
  if (current_sample_form != null) {
    var id = current_sample_form.attr('id').replace('sample_', '');
    return proj.samples[id].name;
  }
  return '';
}

/**
 * Returns content for import/export popover body.
 */
function get_import_export_popover_body(popover) {
  if (current_sample_form != null) {
    var new_popover = popover.clone(true);
    var id = current_sample_form.attr('id').replace('sample_', '');

    var to_hide = new_popover.children('select').children('option[value="' + id + '"]');
    to_hide.prop('hidden', true);

    return new_popover.html();
  }

  return 'Please choose a sample first.';
}

/**
 * Set import/export button.
 */
function set_import_export_popover_btn() {
  // Set data input/export button.
  var import_btn = $('#sample_import_outer_btn');
  var export_btn = $('#sample_export_outer_btn');
  var import_popover = $('#import_popover');
  var export_popover = $('#export_popover');

  import_btn.popover({
    html: true,
    placement: "bottom",
    content: function() {
      return get_import_export_popover_body(import_popover);
    },
    title: function() {
      return get_import_export_popover_title();
    }
  });
  export_btn.popover({
    html: true,
    placement: "bottom",
    content: function() {
      return get_import_export_popover_body(export_popover);
    },
    title: function() {
      return get_import_export_popover_title();
    }
  });
  import_btn.on('show.bs.popover', function() {
    export_btn.popover('hide');
  });
  export_btn.on('show.bs.popover', function() {
    import_btn.popover('hide');
  });
}

/**
 * Remove contributor with index n.
 */
function remove_contributor(fields, n) {
  // Get the div of the contributor.
  var div = fields[n];

  // Set on-hide listener to destroy this div.
  div.on('hidden.bs.collapse', {'div': div, 'fields': fields, 'n': n},
  function (e) {
    var div = e.data.div;
    var fields = e.data.fields;
    var n = e.data.n;

    var contributors_div = div.parent();
    var more_div = contributors_div.children('div[style*="display:none"]');
    var more_input = more_div.children('input');
    var more_btn = more_div.children('button');

    var more_div_id = more_div.attr('id');
    var more_input_id = more_input.attr('id');
    var more_btn_id = more_btn.attr('id');

    // Remove item from the array. Then, delete it from DOM.
    fields.splice(n, 1);
    div.remove();

    // Then, update the ids of all the following elements.
    var n_contributors = fields.length;
    for (var i = n; i < n_contributors; i++) {
      var new_more_div_id = more_div_id.replace('num', i);
      var new_more_input_id = more_input_id.replace('num', i);
      var new_more_btn_id = more_btn_id.replace('num', i);

      var div = fields[i];
      div.attr('id', new_more_div_id);
      div.children('input').attr('id', new_more_input_id);
      div.children('button').attr('id', new_more_btn_id);
    }
  });

  // Hide collapse.
  div.collapse('hide');
}

/**
 * Set up the remove contributor button.
 */
function set_remove_contributor_button(button) {
  button.click(function () {
    var id = $(this).attr('id');
    var split = id.split('_');
    var n = split[split.length - 1];

    console.log(id);

    if (id.startsWith('proj')) {
      remove_contributor(proj_contributor_fields, n);
    } else if (id.startsWith('sample')) {
      var sample_id = split[split.length - 3];
      remove_contributor(sample_contributor_fields[sample_id], n);
    }
  });

}

/**
 * Add contributors.
 */
function add_contributor() {
  var btn = $(this);
  var contributors_div = btn.parent().parent();
  var more_div = contributors_div.children('div[style*="display:none"]');
  var more_input = more_div.children('input');
  var more_btn = more_div.children('button');

  var more_div_id = more_div.attr('id');
  var more_input_id = more_input.attr('id');
  var more_btn_id = more_btn.attr('id');

  var fields;
  if (more_div_id.startsWith('proj')) {
    fields = proj_contributor_fields;
  } else if (more_div_id.startsWith('sample')) {
    var split = more_div_id.split('_');
    var sample_id = split[split.length - 3];
    fields = sample_contributor_fields[sample_id];
  }

  // Current number of project contributor fields.
  var n_contributors = fields.length;

  // Make new div by cloning.
  var new_div = more_div.clone();

  // Then, change the ids.
  var new_more_div_id = more_div_id.replace('num', n_contributors);
  var new_more_input_id = more_input_id.replace('num', n_contributors);
  var new_more_btn_id = more_btn_id.replace('num', n_contributors);
  var new_more_input = new_div.children('input');
  var new_more_btn = new_div.children('button');
  new_div.attr('id', new_more_div_id);
  new_more_input.attr('id', new_more_input_id);
  new_more_btn.attr('id', new_more_btn_id);

  // Set up suggestions (if this is for a sample)
  if (more_div_id.startsWith('sample')) {
    new_more_input.focusin(function() {
      var split = $(this).attr('id').split('_');
      var id = split[split.length - 2];

      set_suggestions($(this), get_all_contributors_except(id));
    });
  }

  // Then, set the remove button handler.
  set_remove_contributor_button(new_more_btn);

  // Append the new field to DOM.
  contributors_div.append(new_div);
  new_div.show();
  new_div.addClass('d-flex');

  // Show the collapse.
  new_div.collapse('show');

  // Add the div to the global list of contributor fields.
  fields.push(new_div);
}

/**
 * Remove contributor with index n.
 */
function remove_characteristic(fields, n) {
  // Get the div of the contributor.
  var div = fields[n];

  // Set on-hide listener to destroy this div.
  div.on('hidden.bs.collapse', {'div': div, 'fields': fields, 'n': n},
  function (e) {
    var div = e.data.div;
    var fields = e.data.fields;
    var n = e.data.n;

    var characteristics_div = div.parent();
    var more_div = characteristics_div.children('div[style*="display:none"]');
    var more_div_id = more_div.attr('id');

    // Extract sample id.
    var split = more_div_id.split('_');
    var id = split[split.length - 3];

    var more_char_id = 'sample_characteristic_' + id + '_num';
    var more_detail_id = 'sample_detail_' + id + '_num';

    var more_btn = more_div.children('button');
    var more_btn_id = more_btn.attr('id');

    // Remove item from the array. Then, delete it from DOM.
    fields.splice(n, 1);
    div.remove();

    // Then, update the ids of all the following elements.
    var n_characteristics = fields.length;
    for (var i = n; i < n_characteristics; i++) {
      var new_more_div_id = more_div_id.replace('num', i);
      var new_more_char_id = more_char_id.replace('num', i);
      var new_more_detail_id = more_detail_id.replace('num', i);
      var new_more_btn_id = more_btn_id.replace('num', i);

      var div = fields[i];
      div.attr('id', new_more_div_id);
      div.children('#' + more_char_id).attr('id', new_more_char_id);
      div.children('#' + more_detail_id).attr('id', new_more_detail_id);
      div.children('button').attr('id', new_more_btn_id);
    }
  });

  // Hide collapse.
  div.collapse('hide');
}

/**
 * Set up the remove contributor button.
 */
function set_remove_characteristic_button(button) {
  button.click(function () {
    var id = $(this).attr('id');
    var split = id.split('_');
    var n = split[split.length - 1];

    console.log(id);

    var sample_id = split[split.length - 3];
    remove_characteristic(sample_characteristic_fields[sample_id], n);
  });
}

/**
 * Add contributors.
 */
function add_characteristic() {
  var btn = $(this);
  var characteristics_div = btn.parent().parent();
  var more_div = characteristics_div.children('div[style*="display:none"]');
  var more_div_id = more_div.attr('id');

  // Extract sample id.
  var split = more_div_id.split('_');
  var id = split[split.length - 3];

  var more_char_id = 'sample_characteristic_' + id + '_num';
  var more_detail_id = 'sample_detail_' + id + '_num';

  var more_btn = more_div.children('button');
  var more_btn_id = more_btn.attr('id');

  var fields = sample_characteristic_fields[id];

  // Current number of project contributor fields.
  var n_characteristics = fields.length;

  // Make new div by cloning.
  var new_div = more_div.clone();

  // Then, change the ids.
  var new_more_div_id = more_div_id.replace('num', n_characteristics);
  var new_more_char_id = more_char_id.replace('num', n_characteristics);
  var new_more_detail_id = more_detail_id.replace('num', n_characteristics);
  var new_more_btn_id = more_btn_id.replace('num', n_characteristics);
  var new_more_char = new_div.children('#' + more_char_id);
  var new_more_detail = new_div.children('#' + more_detail_id);
  var new_more_btn = new_div.children('button');
  new_div.attr('id', new_more_div_id);
  new_more_char.attr('id', new_more_char_id);
  new_more_detail.attr('id', new_more_detail_id);
  new_more_btn.attr('id', new_more_btn_id);

  // Set up suggestions
  new_more_char.focusin(function() {
    var split = $(this).attr('id').split('_');
    var id = split[split.length - 2];
    var characteristics = get_all_characteristics_except(id);

    set_suggestions($(this), Object.keys(characteristics));
  });
  new_more_detail.focusin({char: new_more_char}, function(e) {
    var char = e.data.char.val();
    var characteristics = get_all_characteristics();

    if (char != '' && char != null && characteristics[char] != null) {
      set_suggestions($(this), characteristics[char]);
    }
  });


  // Then, set the remove button handler.
  set_remove_characteristic_button(new_more_btn);

  // Append the new field to DOM.
  characteristics_div.append(new_div);
  new_div.show();
  new_div.addClass('d-flex');

  // Show the collapse.
  new_div.collapse('show');

  // Add the div to the global list of contributor fields.
  fields.push(new_div);
}

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
      case 'summary':
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
function save_proj() {
  set_all_meta();
  write_proj();
}

/**
 * Set project meta input.
 */
function set_proj_meta_input() {
  proj_form = $('#proj');

  // Set the project id header
  proj_form.children('h4').text(proj_id);

  var proj_contributor_0 = proj_form.find('#proj_contributor_0_div');
  var add_contributor_btn = proj_form.find('#proj_add_contributor_btn');
  var save_changes_btn = proj_form.find('#proj_save_btn');

  proj_contributor_fields.push(proj_contributor_0);

  // Button handlers.
  add_contributor_btn.click(add_contributor);
  save_changes_btn.click(save_proj);
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
  var sample_form_id = 'sample_SAMPLEID'

  // Set sorted names.
  set_sorted_names();

  // Add samples in sorted order (by name).
  for (var i = 0; i < sorted_names.length; i++) {
    var name = sorted_names[i];
    var id = names_to_ids[name];
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

    // Add first contributor field to the list of fields.
    var sample_contributor_0 = sample_form.find('#sample_contributor_' + id + '_0_div');
    var add_contributor_btn = sample_form.find('#sample_add_contributor_' + id + '_btn');
    sample_contributor_fields[id] = [sample_contributor_0];
    add_contributor_btn.click(add_contributor);

    var sample_contributor_0_input = sample_contributor_0.children('input');
    sample_contributor_0_input.focusin({'id':id}, function(e) {
      var id = e.data.id;
      set_suggestions($(this), get_all_contributors_except(id));
    });

    // Add the first characteristic field to the list of fields.
    var sample_characteristic_0 = sample_form.find('#sample_characteristic_' + id + '_0_div');
    var add_characteristic_btn = sample_form.find('#sample_add_characteristic_' + id + '_btn');
    sample_characteristic_fields[id] = [sample_characteristic_0];
    add_characteristic_btn.click(add_characteristic);

    var char_id = 'sample_characteristic_' + id + '_0';
    var detail_id = 'sample_detail_' + id + '_0';
    var sample_characteristic_0_char = sample_characteristic_0.children('#' + char_id);
    var sample_characteristic_0_detail = sample_characteristic_0.children('#' + detail_id);
    sample_characteristic_0_char.focusin({'id':id}, function(e) {
      var id = e.data.id;
      var characteristics = get_all_characteristics_except(id);

      set_suggestions($(this), Object.keys(characteristics));
    });
    sample_characteristic_0_detail.focusin({char: sample_characteristic_0_char}, function(e) {
      var char = e.data.char.val();
      var characteristics = get_all_characteristics();

      if (char != '' && char != null && characteristics[char] != null) {
        set_suggestions($(this), characteristics[char]);
      }
    });

    // Set paired end listener.
    set_paired_end(id, sample_form);

    // Set the reads table for this sample.
    set_reads_table(id, sample_form);

    // Save changes button.
    var save_changes_btn = sample_form.find('#sample_' + id + '_save_btn');
    save_changes_btn.click(save_proj);

    // Add this project to the import/export samples list.
    add_import_export_sample(name, id);

    sample_forms[id] = sample_form;

    // Append new form.
    $('#sample_card').append(sample_form);
  }

  // Set organisms dropdown.
  set_organisms();

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
      var option = $('<option>', {
        text: char,
        value: char
      });
      dropdown.append(option);
    }
  }
}

/**
 * Sets detail selection dropdown options for the control modal.
 */
function set_detail_options(dropdown, characteristic) {
  for (var detail in chars_details_to_samples[characteristic]) {
    // Valid option only if there are more than one detail.
    if (Object.keys(chars_details_to_samples[characteristic]).length > 1) {
      var option = $('<option>', {
        text: detail,
        value: detail
      });
      dropdown.append(option);
    }
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
  var control_0 = modal.find('#proj_control_0');
  var control_1 = modal.find('#proj_control_1');
  var controls = [control_0, control_1];

  // Set characteristic and detail dropdowns.
  for (var i = 0; i < controls.length; i++) {
    var ctrl = controls[i];

    var char_id = 'proj_control_char_' + i;
    var detail_id = 'proj_control_detail_' + i;
    var char = ctrl.find('#' + char_id);
    var detail = ctrl.find('#' + detail_id);

    set_characteristic_options(char);

    // Then, bind to change.
    char.change({'detail': detail}, function (e) {
      var val = $(this).children('option:selected').val();

      set_detail_options(e.data.detail, val);
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
  // Deal with project meta input form first.
  set_proj_meta_input();

  // Then, set the samples metadata.
  set_samples_meta_input();

  set_meta_input_fields();

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
  $('#meta_container').show();
}

/**
 * Fetch custom sample names and replace the default names.
 */
function fetch_sample_names() {
  var input_id = 'name_input_SAMPLEID';

  for (var id in proj.samples) {
    var input = $('#' + input_id.replace('SAMPLEID', id));
    var val = input.val();

    // If the input is empty, just use default (i.e. do nothing).
    if (input.val() != '') {
      proj.samples[id].name = input.val();
    }
  }
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
  fetch_sample_names();

  set_meta_input();

  show_meta_input();
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
      case 'summary':
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
  proj_input_fields.meta['summary'] = proj_form.find('#proj_summary');
  proj_input_fields.meta['contributors'] = proj_contributor_fields;
  proj_input_fields.meta['email'] = proj_form.find('#proj_email');
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
      case 'summary':
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
  proj_meta.meta['summary'] = meta_input_fields.meta['summary'].val();

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
function write_proj() {
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
    }
  });

}

// Global variables.
var proj_id;
var proj;
var meta_input_fields;
var ftp_pw;
var raw_reads_div;
var controls_modal;
var dropdown_items = {};
var proj_form;
var current_sample_form;
var sample_forms = {};
var names_to_ids;
var sorted_names;
var organisms;
var import_export_dropdown;
var proj_contributor_fields = [];
var sample_contributor_fields = {};
var sample_characteristic_fields = {};
var sample_pair_fields = {};
var chars_to_samples = {};
var chars_details_to_samples = {};

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
