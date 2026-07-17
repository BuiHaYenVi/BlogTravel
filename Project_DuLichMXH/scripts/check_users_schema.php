<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

try {
    $db = Database::getInstance()->getConnection();
    
    // Lấy tên các cột của bảng users
    $stmt = $db->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📊 CÁC CỘT CỦA BẢNG USERS:\n";
    foreach ($columns as $c) {
        echo "- {$c['column_name']} ({$c['data_type']})\n";
    }
    
    // Xem thử dữ liệu của 1 user
    $stmt = $db->query("SELECT * FROM users LIMIT 1");
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "\n🔍 DỮ LIỆU THỬ CỦA 1 BẢN GHI USER:\n";
    print_r($user);
    
} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
}
