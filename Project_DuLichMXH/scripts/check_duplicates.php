<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->query("SELECT id, name, slug, travel_tips FROM locations WHERE name LIKE '%Bà Rịa%'");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    header('Content-Type: application/json');
    echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo $e->getMessage();
}
