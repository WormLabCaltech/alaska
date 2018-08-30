<?php
# First, check if we were given an id.
if (isset($_POST['id'])) {
  $id = $_POST['id'];
} else {
  throw new Exception("no id given");
}

# Path to the projects folder.
$path = "/alaska/root/projects/";
$temp = "_temp";

# full path to output json
$path = $path . $id . "/" . $temp . "/" . $id . ".json";

# Sanity check, and then write the json.
if (is_readable($path)) {
  echo file_get_contents($path);
} else {
  throw new Exception("file is not readable");
}
?>
