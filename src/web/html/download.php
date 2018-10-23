<?php
# if there is an id
if (isset($_GET['id'])) {
  $id = $_GET['id'];
} else {
  throw new Exception("id not given");
}
if (isset($_GET['type'])) {
  $type = $_GET['type'];
} else {
  throw new Exception("type not given");
}

# construct path to file
$path = "/alaska/root/projects/" . $id;
switch ($type) {
  case 'qc':
    $file = "1_qc.tar.gz";
    $path = $path . "/" . $file;
    break;
  case 'quant':
    $file = "2_alignment.tar.gz";
    $path = $path . "/" . $file;
    break;
  case 'diff':
    $file = "3_diff_exp.tar.gz";
    $path = $path . "/" . $file;
    break;
  case 'all':
    $file = $id . ".tar.gz";
    $path = $path . "/" . $id . ".tar.gz";
    break;
}


# Sanity check, and then read.
if (is_readable($path)) {
  header("Cache-Control: public");
  header("Content-Description: File Transfer");
  header("Content-Disposition: attachment; filename=" . $file . "");
  header("Content-Transfer-Encoding: binary");
  readfile($path);
} else {
  throw new Exception("file is not readable");
}
?>
