<?php
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    $tables = ['comments', 'comment_likes', 'posts', 'users'];
    
    foreach ($tables as $table) {
        echo "--- KIỂM TRA BẢNG: $table ---\n";
        $sql = "SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = :table 
                ORDER BY ordinal_position";
        $stmt = $db->prepare($sql);
        $stmt->execute(['table' => $table]);
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($columns)) {
            echo "❌ KHÔNG TÌM THẤY BẢNG '$table'\n";
            if ($table === 'comment_likes') {
                echo "💡 GỢI Ý: Chạy SQL sau để tạo bảng:\n";
                echo "CREATE TABLE comment_likes (\n  id SERIAL PRIMARY KEY,\n  comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,\n  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,\n  created_at TIMESTAMP DEFAULT NOW(),\n  UNIQUE(comment_id, user_id)\n);\n";
            }
        } else {
            echo "✅ Bảng tồn tại. Các cột:\n";
            foreach ($columns as $col) {
                echo "- {$col['column_name']} ({$col['data_type']})\n";
            }
        }
        echo "\n";
    }

    // Kiểm tra thử 1 câu query lấy comment
    echo "--- TEST QUERY LẤY COMMENT (Post ID giả định: 1) ---\n";
    try {
        $postId = 1; 
        $sql = "SELECT c.*, u.username 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                WHERE c.post_id = :pid AND c.status = 'active'";
        $stmt = $db->prepare($sql);
        $stmt->execute(['pid' => $postId]);
        $res = $stmt->fetchAll();
        echo "Query test thành công. Số lượng found: " . count($res) . "\n";
    } catch (Exception $e) {
        echo "❌ QUERY TEST THẤT BẠI: " . $e->getMessage() . "\n";
    }

} catch (Exception $e) {
    echo "❌ LỖI HỆ THỐNG: " . $e->getMessage() . "\n";
}
?>