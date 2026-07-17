<?php
require_once __DIR__ . '/app/Models/BaseModel.php';
require_once __DIR__ . '/app/Models/Story.php';

try {
    $dsn = "pgsql:host=127.0.0.1;port=5432;dbname=dulichmxh";
    $pdo = new PDO($dsn, "postgres", "2026");
    
    // Simulate query
    $userId = 4;
    $sql = "SELECT s.id, s.user_id, s.media_url, s.media_type, s.caption, s.created_at, s.expires_at,
                   u.username, u.full_name, u.avatar,
                   (SELECT COUNT(*) FROM story_likes WHERE story_id = s.id) as like_count,
                   EXISTS(SELECT 1 FROM story_likes WHERE story_id = s.id AND user_id = :user_id) as is_liked
            FROM stories s
            JOIN users u ON s.user_id = u.id
            WHERE s.is_active = TRUE 
              AND (s.is_deleted = FALSE OR s.is_deleted IS NULL)
              AND s.expires_at > NOW()
              AND (s.user_id = :user_id OR s.user_id IN (SELECT following_id FROM follows WHERE follower_id = :user_id))
            ORDER BY s.user_id, s.created_at ASC";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['user_id' => $userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($rows);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
