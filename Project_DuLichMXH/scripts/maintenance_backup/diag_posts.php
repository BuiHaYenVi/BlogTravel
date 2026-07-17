<?php
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/../app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "--- CHẨN ĐOÁN BẢNG POSTS ---\n";
    
    $sql = "SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'posts' 
            ORDER BY ordinal_position";
            
    $stmt = $db->query($sql);
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($columns)) {
        echo "❌ KHÔNG TÌM THẤY BẢNG 'posts'.\n";
    } else {
        echo "✅ Các cột hiện có trong 'posts':\n";
        foreach ($columns as $col) {
            echo "- {$col['column_name']} ({$col['data_type']})\n";
        }
    }

} catch (Exception $e) {
    echo "❌ LỖI: " . $e->getMessage() . "\n";
}
?>