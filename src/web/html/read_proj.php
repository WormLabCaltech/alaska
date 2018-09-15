<?php
# First, check if we were given an id.
if (isset($_POST['id'])) {
  $id = $_POST['id'];
} else {
  throw new Exception("no id given");
}

if (isset($_POST['fname'])) {
  $fname = $_POST['fname'];
} else {
  $fname = $id;
}

# Path to the projects folder.
$path = "/alaska/root/projects/";
$temp = "_temp";

# full path to output json
$path = $path . $id . "/" . $temp . "/" . $fname . ".json";

# Sanity check, and then read json.
if (is_readable($path)) {
  echo file_get_contents($path);
} else {
  throw new Exception("file is not readable");
}
?>
