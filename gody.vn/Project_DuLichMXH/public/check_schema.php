<?php
require_once __DIR__ . '/../app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    $q = $db->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='tags'");
    $columns = $q->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode([
        'status' => 'success',
        'columns' => $columns
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
