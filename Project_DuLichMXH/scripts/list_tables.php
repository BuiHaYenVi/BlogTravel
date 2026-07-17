<?php
require_once __DIR__ . '/app/config/database.php';
try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $res = $conn->query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    while($row = $res->fetch(PDO::FETCH_ASSOC)) {
        echo $row['tablename'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
