<?php
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/../app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    echo "--- BẮT ĐẦU SỬA BẢNG GROUPS ---\n";
    
    // 1. Thêm cột category
    try {
        $db->exec("ALTER TABLE groups ADD COLUMN category VARCHAR(100) DEFAULT 'General'");
        echo "✅ Đã thêm cột category thành công.\n";
    } catch (Exception $e) {
        echo "ℹ️ Cột category có thể đã tồn tại: " . $e->getMessage() . "\n";
    }
    
    // 2. Chuyển đổi sang TEXT để chứa ảnh/mô tả dài
    $db->exec("ALTER TABLE groups ALTER COLUMN cover_image TYPE TEXT");
    $db->exec("ALTER TABLE groups ALTER COLUMN description TYPE TEXT");
    echo "✅ Đã chuyển cover_image và description sang kiểu TEXT.\n";
    
    // 3. Đảm bảo có cột owner_id
    $result = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name='groups' AND column_name='owner_id'");
    if ($result->rowCount() == 0) {
        $db->exec("ALTER TABLE groups ADD COLUMN owner_id INTEGER");
        echo "✅ Đã thêm cột owner_id.\n";
    }

    echo "--- HOÀN TẤT ---";

} catch (Exception $e) {
    echo "❌ LỖI: " . $e->getMessage() . "\n";
}
?>