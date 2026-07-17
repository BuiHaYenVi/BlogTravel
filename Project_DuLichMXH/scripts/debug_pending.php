<?php
require_once __DIR__ . '/app/config/database.php';
require_once __DIR__ . '/app/models/Post.php';

header('Content-Type: application/json');

try {
    $db = Database::getInstance()->getConnection();
    
    // Lấy tất cả bài viết có trạng thái pending
    $sql = "SELECT p.*, u.username, u.full_name 
            FROM posts p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.status = 'pending' 
            ORDER BY p.created_at DESC";
            
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $pendingPosts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'total_pending' => count($pendingPosts),
        'data' => $pendingPosts
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
