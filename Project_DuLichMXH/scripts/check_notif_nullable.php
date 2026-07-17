<?php
require_once __DIR__ . '/app/config/database.php';
try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $res = $conn->query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'notifications'");
    while($row = $res->fetch()) {
        echo $row['column_name'] . ": " . $row['is_nullable'] . "\n";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
