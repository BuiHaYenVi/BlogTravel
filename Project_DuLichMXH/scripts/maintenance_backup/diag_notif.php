<?php
require_once __DIR__ . '/../app/config/database.php';
require_once __DIR__ . '/../app/utils/Response.php';

try {
    $db = Database::getInstance();
    
    // 1. Kiểm tra cấu trúc bảng
    $sql = "SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'notifications'
            ORDER BY ordinal_position";
    $columns = $db->fetchAll($sql);
    
    // 2. Kiểm tra dữ liệu mới nhất
    $sqlData = "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5";
    $latest = $db->fetchAll($sqlData);
    
    // 3. Kiểm tra số lượng user
    $sqlUsers = "SELECT id, username FROM users LIMIT 5";
    $users = $db->fetchAll($sqlUsers);

    echo "<h3>Cấu trúc bảng notifications:</h3><pre>";
    print_r($columns);
    echo "</pre>";

    echo "<h3>Dữ liệu 5 thông báo mới nhất:</h3><pre>";
    print_r($latest);
    echo "</pre>";

    echo "<h3>Dữ liệu 5 users:</h3><pre>";
    print_r($users);
    echo "</pre>";

} catch (Exception $e) {
    echo "Lỗi: " . $e->getMessage();
}
?>