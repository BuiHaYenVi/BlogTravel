<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    $sql = "ALTER TABLE trips ALTER COLUMN category_tag TYPE TEXT;";
    $conn->exec($sql);

    echo "✅ Đã nâng cấp cột category_tag lên TEXT thành công.\n";

} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
}
