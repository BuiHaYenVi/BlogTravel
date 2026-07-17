<?php
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "--- BẮT ĐẦU CẬP NHẬT CẤU TRÚC ĐĂNG BÀI ---\n";

    // 1. Thêm group_id vào bảng posts nếu chưa có
    try {
        $db->exec("ALTER TABLE posts ADD COLUMN group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE");
        echo "✅ Đã thêm cột group_id vào bảng posts.\n";
    } catch (Exception $e) {
        echo "ℹ️ Cột group_id có thể đã tồn tại.\n";
    }

    // 2. Tạo bảng post_media nếu chưa có
    $db->exec("CREATE TABLE IF NOT EXISTS post_media (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'image',
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "✅ Đã đảm bảo bảng post_media tồn tại.\n";

    // 3. Đảm bảo bảng likes tồn tại (nếu cần cho bài viết)
    $db->exec("CREATE TABLE IF NOT EXISTS likes (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, post_id)
    )");
    echo "✅ Đã đảm bảo bảng likes tồn tại.\n";

    // 4. Tạo thư mục upload nếu chưa có
    $uploadDir = __DIR__ . '/public/uploads/posts/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
        echo "✅ Đã tạo thư mục public/uploads/posts/.\n";
    }

    echo "--- HOÀN TẤT CẬP NHẬT ---";

} catch (Exception $e) {
    echo "❌ LỖI: " . $e->getMessage() . "\n";
}
