<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Lấy danh sách tất cả các bảng
    $stmt = $db->query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $results = ['tables' => $tables, 'details' => []];
    
    foreach ($tables as $table) {
        $stmt = $db->prepare("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ?");
        $stmt->execute([$table]);
        $results['details'][$table] = $stmt->fetchAll();
    }
    
    echo json_encode($results, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>