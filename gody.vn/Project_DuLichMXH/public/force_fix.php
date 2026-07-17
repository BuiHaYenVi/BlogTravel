<?php
require_once __DIR__ . '/app/config/database.php';
header('Content-Type: text/plain; charset=utf-8');

echo "--- BẮT ĐẦU CẬP NHẬT DATABASE ---\n";

try {
    $db = Database::getInstance()->getConnection();
    
    $sql = "
    ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE users ALTER COLUMN interests TYPE TEXT;
    ALTER TABLE users ALTER COLUMN bio TYPE TEXT;
    ";

    $db->exec($sql);
    echo "✅ Cập nhật cấu trúc bảng users thành công!\n";
    
    // Kiểm tra lại
    $stmt = $db->query("SELECT column_name FROM information_schema.columns WHERE table_name='users'");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Các cột hiện có: " . implode(", ", $columns) . "\n";

} catch (Exception $e) {
    echo "❌ LỖI: " . $e->getMessage() . "\n";
    echo "Chi tiết: " . $e->getTraceAsString() . "\n";
}
?>