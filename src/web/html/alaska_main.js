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
    return;
  }

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
      return get_import_export_popover_body(export_popover);
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
    var more_btn_id = more_div.children('button');

    var more_div_id = more_div.attr('id');
    var more_input_id = more_input.attr('id');
    var more_btn_id = more_btn_id.attr('id');

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
  var more_btn_id = more_div.children('button');

  var more_div_id = more_div.attr('id');
  var more_input_id = more_input.attr('id');
  var more_btn_id = more_btn_id.attr('id');

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
 * Set project meta input.
 */
function set_proj_meta_input() {
  var proj_contributor_0 = $('#proj_contributor_0_div');
  var add_contributor_btn = $('#proj_add_contributor_btn');

  proj_contributor_fields.push(proj_contributor_0);
  add_contributor_btn.click(add_contributor);
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

    // Set paired end listener.
    set_paired_end(id, sample_form);

    // Set the reads table for this sample.
    set_reads_table(id, sample_form);

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
 * Set meta input form.
 */
function set_meta_input() {
  // Deal with project meta input form first.
  set_proj_meta_input();

  // Then, set the samples metadata.
  set_samples_meta_input();
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
 * Sets the global contributors list.
 */
function set_contributors() {

}

/**
 * Gets query parameters from url.
 */
function get_url_params() {
  var url_params = new URLSearchParams(window.location.search);

  return url_params;
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
var names_to_ids;
var sorted_names;
var organisms;
var import_export_dropdown;
var proj_contributor_fields = [];
var sample_contributor_fields = {};

// To run when page is loaded.
$(document).ready(function() {
  url_params = get_url_params();

  console.log(url_params);

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

  // Fetch server status.
  get_server_status();
});
