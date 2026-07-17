<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

try {
    $db = Database::getInstance()->getConnection();
    
    // 1. Get recent posts
    $stmt = $db->query("SELECT id, title, cover_image, post_type, created_at FROM posts ORDER BY id DESC LIMIT 5");
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "--- RECENT POSTS ---\n";
    foreach ($posts as $post) {
        echo "ID: {$post['id']} | Title: {$post['title']} | Type: {$post['post_type']} | Cover: {$post['cover_image']} | Created: {$post['created_at']}\n";
        
        // Check post_media for each post
        $mediaStmt = $db->prepare("SELECT * FROM post_media WHERE post_id = :post_id");
        $mediaStmt->execute(['post_id' => $post['id']]);
        $media = $mediaStmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($media)) {
            echo "  -> No media files in post_media.\n";
        } else {
            echo "  -> Media files in post_media:\n";
            foreach ($media as $m) {
                echo "     - ID: {$m['id']} | URL: {$m['url']}\n";
            }
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
