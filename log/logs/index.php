<table>
<?php
  date_default_timezone_set('Europe/Vienna');

  function formatBytes($bytes, $precision = 2) {
    $units = array('B', 'KiB', 'MiB', 'GiB', 'TiB');

    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);

    // Uncomment one of the following alternatives
    $bytes /= pow(1024, $pow);

    return [round($bytes, $precision),$units[$pow]];
  }

  $files = array();
  if ($handle = opendir('.')) {
    while (false !== ($entry = readdir($handle))) {
      if (preg_match("/\.xes\.yaml$/",$entry)) {
        $stat = stat($entry);
        $yaml = yaml_parse_file($entry,0);
        if (isset($yaml['log']['trace']) && isset($yaml['log']['trace']['cpee:name'])) {
          $dt = new DateTime();
          $siz = formatBytes($stat['size']);
          $file = array();
          $file['info'] = $yaml['log']['trace']['cpee:name'];
          $file['name'] = $entry;
          $file['size'] = $siz[0];
          $file['sizeunits'] = $siz[1];

          $dt->setTimestamp($stat['mtime']);
          $file['modified'] = $dt->format("Y-m-d H:i:s");
          $file['modifieddate'] = intval($dt->format("Ymd"));

          $files[$stat['mtime']] = $file;
        }
      }
    }
    closedir($handle);
  }
  krsort($files);
  $dat = 99999999;
  $breakafter = "modifieddate";
  foreach($files as $file) {
    if ($dat > $file[$breakafter]) {
      if ($dat < 99999999) {
        echo "<tr>\n";
        echo "<td colspan='5'><hr/></td>\n";
        echo "</tr>\n";
      }
      $dat = $file[$breakafter];
    }
    echo "<tr>\n";
    echo "  <td>{$file['info']}</td>\n";
    echo "  <td><a href='{$file['name']}'>{$file['name']}</a></td>\n";
    echo "  <td style='text-align: right'>{$file['size']}</td>\n";
    echo "  <td>{$file['sizeunits']}</td>\n";
    echo "  <td>{$file['modified']}</td>\n";
    echo "</tr>\n";
  }
?>
</table>
