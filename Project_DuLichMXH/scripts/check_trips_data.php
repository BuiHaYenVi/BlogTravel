<?php
require_once __DIR__ . '/app/config/database.php';
try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $count = $conn->query("SELECT count(*) FROM trips")->fetchColumn();
    echo "Trips count: " . $count . "\n";
    
    $res = $conn->query("SELECT id, title, status FROM trips LIMIT 10");
    while($row = $res->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
