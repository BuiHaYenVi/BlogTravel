<?php
require 'vendor/autoload.php';
$m = new App\Models\AdminSystemModel();
try {
    $res = $m->processReport(2, 'resolve', 'test');
    var_dump($res);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
