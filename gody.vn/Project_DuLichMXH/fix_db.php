<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // 1. Chuyển đổi cover_image sang TEXT để chứa được Base64
    $db->exec("ALTER TABLE groups ALTER COLUMN cover_image TYPE TEXT");
    echo "✅ Đã cập nhật cột cover_image thành TEXT\n";
    
    // 2. Kiểm tra và đồng bộ tên cột người dùng
    $result = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name='groups' AND column_name='owner_id'");
    if ($result->rowCount() > 0) {
        $db->exec("ALTER TABLE groups RENAME COLUMN owner_id TO creator_id");
        echo "✅ Đã đổi tên owner_id thành creator_id\n";
    } else {
        echo "ℹ️ Cột creator_id đã tồn tại hoặc owner_id không tồn tại.\n";
    }

} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
}
?>