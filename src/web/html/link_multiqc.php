<?php
# if there is an id
if (isset($_POST['id'])) {
  $id = $_POST['id'];
} else {
  throw new Exception("id not given");
}

# construct path to file
$path = "/alaska/root/projects/" . $id . "/1_qc/multiqc_report.html";
$target = "/var/www/html/multiqc_reports/" . $id . "/multiqc_report.html";
echo posix_getpwuid(posix_geteuid())['name'];
echo is_writeable("/var/www/html/") ? "true" : "false";

if (!is_dir($target)) {
  echo (mkdir($target, 0777, true)) ? "true" : "false";
}

# Sanity check, and then read.
if (!file_exists($target)) {
  if (is_readable($path)) {
    echo (symlink($path, $target)) ? "true" : "false";
  } else {
    throw new Exception("file is not readable");
  }
} else {
  echo "true";
}
?>
