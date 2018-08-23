<?php
# First, check if we were given a path to a file.
if (isset($_POST['path'])) {
  $path = $_POST['path'];
} else {
  throw new Exception("no path given");
}

# Then, run the md5sum utility.
$cmd = "md5sum " . $path;
$out = shell_exec($cmd);

# Simply spit out the output.
echo $out;
?>
