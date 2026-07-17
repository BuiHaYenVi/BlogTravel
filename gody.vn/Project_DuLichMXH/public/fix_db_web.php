<?php
require_once __DIR__ . '/app/config/database.php';

echo "<h2>Đang cập nhật Database...</h2>";

try {
    $db = Database::getInstance()->getConnection();
    
    // 1. Chuyển đổi cover_image sang TEXT
    $db->exec("ALTER TABLE groups ALTER COLUMN cover_image TYPE TEXT");
    echo "✅ Cập nhật cover_image thành TEXT thành công.<br>";
    
    // 2. Kiểm tra cột người tạo
    $query = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name='groups' AND column_name='owner_id'");
    if ($query->rowCount() > 0) {
        $db->exec("ALTER TABLE groups RENAME COLUMN owner_id TO creator_id");
        echo "✅ Đã đổi tên owner_id thành creator_id thành công.<br>";
    } else {
        echo "ℹ️ Cột creator_id đã sẵn sàng.<br>";
    }
    
    echo "<h3>Hệ thống đã sẵn sàng! Hãy thử tạo nhóm lại.</h3>";

} catch (Exception $e) {
    echo "<h3 style='color:red'>❌ Lỗi: " . $e->getMessage() . "</h3>";
}
?>