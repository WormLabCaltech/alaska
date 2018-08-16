<?php
# function to call cgi_request.sh and send the request
function cgi_request($action, $id) {
    $script_path = '/alaska/scripts/cgi_request.sh';

    # construct command
    $cmd = $script_path . ' ' . $action;

    # if there is an id, put that in too
    if (!is_null($id)) {
      $cmd .= ' --id ' . $id;
    }

    # now, run the command and get output
    $out = shell_exec($cmd);

    # simply spit out the output
    echo $out;
}

# if there is an id
if (isset($_POST['id'])) {
  $id = $_POST['id'];
  echo "received id $id";
} else {
  $id = NULL;
  echo "no id received";
}

# make sure there is an action
if (isset($_POST['action'])) {
  $action = $_POST['action'];
  echo "received action $action";

  #
} else {
  # if there is no action, this script was called incorrectly
  throw new Exception("action not given");
}
?>