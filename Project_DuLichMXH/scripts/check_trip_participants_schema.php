<?php
require_once __DIR__ . '/app/config/database.php';
try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    $res = $conn->query("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'trip_participants'");
    while($row = $res->fetch()) {
        echo $row['column_name'] . ": " . $row['is_nullable'] . " (Default: " . $row['column_default'] . ")\n";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
