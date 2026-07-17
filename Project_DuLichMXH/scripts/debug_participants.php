<?php
require_once __DIR__ . '/app/config/database.php';
try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $res = $conn->query("SELECT * FROM trip_participants");
    $rows = $res->fetchAll();
    echo "Count: " . count($rows) . "\n";
    foreach($rows as $row) {
        print_r($row);
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
