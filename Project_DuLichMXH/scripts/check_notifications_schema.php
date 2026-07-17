<?php
require_once __DIR__ . '/app/config/database.php';
try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($columns, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
?>