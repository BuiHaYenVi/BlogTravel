<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/Config/Database.php';

try {
    $db = \App\Config\Database::getInstance()->getConnection();
    $counts = $db->query("SELECT type, count(*) as total FROM locations GROUP BY type")->fetchAll(PDO::FETCH_ASSOC);
    echo "Summary counts:\n";
    print_r($counts);
    
    $provinces = $db->query("SELECT name FROM locations WHERE type = 'province' ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
    echo "\nProvinces found (" . count($provinces) . "):\n";
    foreach ($provinces as $p) {
        echo "- " . $p['name'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
