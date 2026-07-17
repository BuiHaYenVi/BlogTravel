<?php
// Đường dẫn đúng từ public/ đến app/config/database.php
require_once __DIR__ . '/../app/config/database.php';

try {
    $db = Database::getInstance();
    
    // Test query
    $roles = $db->fetchAll("SELECT * FROM roles");
    
    echo "<h1>✅ Kết nối thành công!</h1>";
    echo "<h2>Danh sách Roles:</h2>";
    echo "<ul>";
    foreach ($roles as $role) {
        echo "<li><strong>{$role['name']}</strong> - Level: {$role['level']}</li>";
    }
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<h1>❌ Lỗi:</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?>