<?php
require_once __DIR__ . '/app/config/database.php';

echo "<h2>Đang cập nhật cấu trúc bảng Users...</h2>";

try {
    $db = Database::getInstance()->getConnection();
    
    // 1. Kiểm tra và thêm cột location nếu chưa có
    $queryLocation = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='location'");
    if ($queryLocation->rowCount() == 0) {
        $db->exec("ALTER TABLE users ADD COLUMN location VARCHAR(255)");
        echo "✅ Đã thêm cột location.<br>";
    } else {
        echo "ℹ️ Cột location đã tồn tại.<br>";
    }
    
    // 2. Kiểm tra và thêm cột interests nếu chưa có
    $queryInterests = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='interests'");
    if ($queryInterests->rowCount() == 0) {
        $db->exec("ALTER TABLE users ADD COLUMN interests TEXT");
        echo "✅ Đã thêm cột interests.<br>";
    } else {
        echo "ℹ️ Cột interests đã tồn tại.<br>";
    }

    echo "<h3>Cập nhật hoàn tất!</h3>";

} catch (Exception $e) {
    echo "<h3 style='color:red'>❌ Lỗi: " . $e->getMessage() . "</h3>";
}
?>