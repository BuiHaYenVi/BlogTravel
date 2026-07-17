<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'locations'");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Columns in 'locations' table:\n";
    print_r($columns);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
