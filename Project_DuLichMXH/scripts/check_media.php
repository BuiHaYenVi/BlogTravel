<?php
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

try {
    $db = Database::getInstance()->getConnection();
    echo "--- KIỂM TRA DỮ LIỆU BÀI VIẾT VÀ ẢNH ---\n";

    $stmt = $db->query("SELECT id, content FROM posts ORDER BY id DESC LIMIT 5");
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($posts as $p) {
        echo "Post ID: {$p['id']} - Content: " . mb_substr($p['content'], 0, 30) . "...\n";
        
        $stmtMedia = $db->prepare("SELECT * FROM post_media WHERE post_id = ?");
        $stmtMedia->execute([$p['id']]);
        $media = $stmtMedia->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($media)) {
            echo "   -> Không có ảnh nào trong DB.\n";
        } else {
            foreach ($media as $m) {
                echo "   -> Media ID: {$m['id']}, URL: {$m['url']}\n";
            }
        }
    }

} catch (Exception $e) {
    echo "❌ LỖI: " . $e->getMessage() . "\n";
}
