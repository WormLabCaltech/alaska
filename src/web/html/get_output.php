<?php
# if there is an id
if (isset($_POST['id'])) {
  $id = $_POST['id'];
  echo "received id $id\n";
} else {
  throw new Exception("id not given");
}

# make sure there is an action
if (isset($_POST['type'])) {
  $type = $_POST['type'];
  echo "received type $action\n";
} else {
  # if there is no action, this script was called incorrectly
  throw new Exception("action not given");
}

# construct path to file
$path = "/alaska/root/projects/" . $id;
switch ($type) {
  case "qc":
    $path = $path . "/1_qc/qc_out.txt";
    break;
  case "quant":
    $path = $path . "/2_alignment/kallisto_out.txt";
    break;
  case "diff":
    $path = $path . "/3_diff_exp/sleuth_out.txt";
    break;
  default:
    throw new Exception("unrecognized type");
}

# Sanity check, and then read.
if (is_readable($path)) {
  echo file_get_contents($path);
} else {
  throw new Exception("file is not readable");
}
?>
