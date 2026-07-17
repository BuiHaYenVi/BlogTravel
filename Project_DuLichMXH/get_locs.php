<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/app/Config/Database.php';

try {
    $db = \App\Config\Database::getInstance()->getConnection();
    $stmt = $db->query("SELECT id, name FROM locations WHERE type='province'");
    $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($locations, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
