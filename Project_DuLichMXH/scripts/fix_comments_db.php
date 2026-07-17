<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "--- BẮT ĐẦU CẬP NHẬT CẤU TRÚC DATABASE BÌNH LUẬN ---\n";

    // 1. Tạo bảng comment_likes nếu chưa có
    echo "Đang tạo bảng comment_likes...\n";
    $db->exec("CREATE TABLE IF NOT EXISTS comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(comment_id, user_id)
    )");

    // 2. Kiểm tra và thêm cột parent_id vào bảng comments nếu chưa có (để hỗ trợ reply)
    echo "Kiểm tra cột parent_id trong bảng comments...\n";
    $db->exec("ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE");

    echo "✅ Cập nhật Database thành công!\n";
} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
}
?>