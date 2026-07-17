<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

try {
    $db = Database::getInstance()->getConnection();
    
    echo "--- ĐANG FIX DATABASE BẢNG GROUPS ---\n";
    
    // 1. Chuyển đổi các cột dữ liệu dài sang TEXT
    $db->exec("ALTER TABLE groups ALTER COLUMN cover_image TYPE TEXT");
    echo "✅ Cập nhật cover_image thành TEXT thành công.\n";
    
    $db->exec("ALTER TABLE groups ALTER COLUMN description TYPE TEXT");
    echo "✅ Cập nhật description thành TEXT thành công.\n";
    
    // 2. Kiểm tra và thống nhất cột category (nếu thiếu)
    $result = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name='groups' AND column_name='category'");
    if ($result->rowCount() == 0) {
        $db->exec("ALTER TABLE groups ADD COLUMN category VARCHAR(100) DEFAULT 'General'");
        echo "✅ Đã thêm cột category.\n";
    }

    // 3. Kiểm tra cột owner_id
    $result = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name='groups' AND column_name='owner_id'");
    if ($result->rowCount() == 0) {
        // Thử tìm xem có cột nào khác không
        $checkOther = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name='groups' AND column_name IN ('user_id', 'creator_id')");
        $otherCol = $checkOther->fetch();
        if ($otherCol) {
            $oldCol = $otherCol['column_name'];
            $db->exec("ALTER TABLE groups RENAME COLUMN $oldCol TO owner_id");
            echo "✅ Đã đổi tên cột $oldCol thành owner_id.\n";
        } else {
            $db->exec("ALTER TABLE groups ADD COLUMN owner_id INTEGER");
            echo "✅ Đã thêm cột owner_id.\n";
        }
    } else {
        echo "ℹ️ Cột owner_id đã tồn tại.\n";
    }

    echo "--- HOÀN TẤT FIX DATABASE ---";

} catch (Exception $e) {
    echo "❌ LỖI: " . $e->getMessage() . "\n";
}
?>