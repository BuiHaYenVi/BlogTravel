<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

try {
    $db = Database::getInstance()->getConnection();
    
    // 1. Xem tất cả các bản ghi trong bảng reports
    $stmt = $db->query("SELECT * FROM reports LIMIT 10");
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📊 DANH SÁCH BẢN GHI TRONG BẢNG REPORTS:\n";
    if (empty($reports)) {
        echo "Không có báo cáo nào.\n";
    } else {
        foreach ($reports as $r) {
            echo "ID: {$r['id']}, Reporter ID: {$r['reporter_id']}, Type: {$r['reportable_type']}, Target ID: {$r['reportable_id']}, Status: {$r['status']}\n";
        }
    }
    
    // 2. Chạy thử câu truy vấn JOIN
    echo "\n🔍 CHẠY THỬ CÂU TRUY VẤN JOIN CỦA ADMIN:\n";
    $sql = "SELECT r.id, r.reporter_id, u.id as user_id, u.username, u.email 
            FROM reports r 
            LEFT JOIN users u ON r.reporter_id = u.id 
            LIMIT 10";
    $stmt = $db->query($sql);
    $joins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($joins as $j) {
        echo "Report ID: {$j['id']}, Reporter ID: {$j['reporter_id']}, User ID ở bảng users: " . ($j['user_id'] ?? 'NULL') . ", Username: " . ($j['username'] ?? 'NULL') . ", Email: " . ($j['email'] ?? 'NULL') . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
}
