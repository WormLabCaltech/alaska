<?php
# First, check if we were given an id.
if (isset($_POST['id'])) {
  $id = $_POST['id'];
} else {
  throw new Exception("no id given");
}

# Then, check if we were given a stringified json.
if (isset($_POST['json'])) {
  $json = $_POST['json'];
} else {
  throw new Exception("no json received");
}

# Path to the projects folder.
$path = "/alaska/root/projects/";
$temp = "_temp";

# full path to output json
$path = $path . $id . "/" . $temp . "/" . $id . ".json";
echo $path . "\n";
echo $json;

if (is_writable($path)) {
  echo "writable";
}

# Sanity check, and then write the json.
if (json_decode($json) != null) {
  $file = fopen($path, 'w');
  fwrite($file, $json);
  fclose($file);
} else {
  throw new Exception("invalid json");
}
?>
