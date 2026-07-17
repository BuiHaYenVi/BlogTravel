<?php
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/../app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    echo "--- CHẨN ĐOÁN BẢNG GROUPS ---\n";
    
    $sql = "SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'groups' 
            ORDER BY ordinal_position";
            
    $stmt = $db->query($sql);
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($columns)) {
        echo "❌ KHÔNG TÌM THẤY BẢNG 'groups'. Thử tìm bảng 'Groups' (có hoa thường)...\n";
        $stmt = $db->query("SELECT table_name FROM information_schema.tables WHERE table_name ILIKE 'groups'");
        $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
        print_r($tables);
    } else {
        echo "✅ Đã tìm thấy bảng 'groups'. Các cột hiện có:\n";
        foreach ($columns as $col) {
            echo "- {$col['column_name']} ({$col['data_type']}" . 
                 ($col['character_maximum_length'] ? " [{$col['character_maximum_length']}]" : "") . ")\n";
        }
    }
    
    echo "\n--- KIỂM TRA QUYỀN HẠN ---\n";
    $user = $db->query("SELECT current_user")->fetchColumn();
    echo "User hiện tại: $user\n";

} catch (Exception $e) {
    echo "❌ LỖI: " . $e->getMessage() . "\n";
}
?>