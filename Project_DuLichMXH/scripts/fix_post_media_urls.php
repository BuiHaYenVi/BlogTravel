<?php
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

try {
    $db = Database::getInstance()->getConnection();
    echo "--- CẬP NHẬT ẢNH MOCK TRONG DATABASE ---\n";
    
    // Danh sách ảnh Unsplash phong cảnh và du lịch tuyệt đẹp
    $unsplashUrls = [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', // Bãi biển
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800', // Con đường sa mạc
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', // Hồ và núi
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800'  // Thuyền buồm
    ];
    
    $stmt = $db->query("SELECT id, url FROM post_media WHERE url LIKE '%example.com%' OR url LIKE '%example.jpg%'");
    $medias = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($medias)) {
        echo "Không tìm thấy ảnh mock nào cần cập nhật.\n";
    } else {
        $updateStmt = $db->prepare("UPDATE post_media SET url = ? WHERE id = ?");
        foreach ($medias as $index => $m) {
            $newUrl = $unsplashUrls[$index % count($unsplashUrls)];
            $updateStmt->execute([$newUrl, $m['id']]);
            echo "Đã cập nhật Media ID: {$m['id']} từ '{$m['url']}' thành '{$newUrl}'\n";
        }
        echo "✅ Cập nhật hoàn tất.\n";
    }
} catch (Exception $e) {
    echo "❌ LỖI: " . $e->getMessage() . "\n";
}
?>
