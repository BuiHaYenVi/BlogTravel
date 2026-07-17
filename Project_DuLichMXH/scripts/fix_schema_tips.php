<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Thêm cột travel_tips nếu chưa có
    echo "Đang kiểm tra và thêm cột travel_tips...\n";
    $db->exec("ALTER TABLE locations ADD COLUMN IF NOT EXISTS travel_tips JSONB");
    
    echo "Thành công!\n";
} catch (Exception $e) {
    echo "Lỗi: " . $e->getMessage() . "\n";
}
