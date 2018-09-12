<?php
# if there is an id
if (isset($_POST['id'])) {
  $id = $_POST['id'];
} else {
  throw new Exception("id not given");
}

# construct path to file
$path = "/alaska/root/projects/" . $id . "/1_qc/multiqc_report.html";

# Sanity check, and then read.
if (is_readable($path)) {
  readfile($path);
} else {
  throw new Exception("file is not readable");
}
?>
