<?php
# if there is an id
if (isset($_POST['id'])) {
  $id = $_POST['id'];
} else {
  throw new Exception("id not given");
}

# construct path to file
$path = "/alaska/root/projects/" . $id . "/1_qc/multiqc_report.html";
$target = "/var/www/html/multiqc_reports/" . $id;
if (!is_dir($target)) {
  mkdir($target, 0777, true);
}

# Sanity check, and then read.
if (!file_exists($target . "/multiqc_report.html")) {
  if (is_readable($path)) {
    echo symlink($path, $target);
  } else {
    throw new Exception("file is not readable");
  }
} else {
  echo false;
}
?>
