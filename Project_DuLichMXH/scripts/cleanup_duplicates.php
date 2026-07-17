<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    // Xóa các bản ghi trùng lặp có chứa ký tự đặc biệt trong slug
    $db->exec("DELETE FROM locations WHERE slug LIKE '%–%'");
    echo "Đã dọn dẹp các bản ghi trùng lặp.\n";
} catch (Exception $e) {
    echo $e->getMessage();
}
