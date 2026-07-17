<?php
require_once __DIR__ . '/app/config/database.php';
$db = Database::getInstance()->getConnection();
$tables = $db->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")->fetchAll(PDO::FETCH_COLUMN);
echo "Tables: " . implode(", ", $tables) . "\n";
if (in_array('trip_days', $tables)) {
    $cols = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'trip_days'")->fetchAll(PDO::FETCH_COLUMN);
    echo "trip_days columns: " . implode(", ", $cols) . "\n";
}
?>