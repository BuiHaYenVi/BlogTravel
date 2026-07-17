<?php
header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/../app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "--- BẮT ĐẦU CẬP NHẬT CẤU TRÚC BẢNG POSTS (V3) ---\n";

    // Danh sách các cột cần có cho hệ thống Blog và Post
    $columns = [
        'user_id' => 'INTEGER REFERENCES users(id) ON DELETE CASCADE',
        'group_id' => 'INTEGER REFERENCES groups(id) ON DELETE CASCADE',
        'location_id' => 'INTEGER REFERENCES locations(id) ON DELETE SET NULL',
        'title' => 'VARCHAR(512)',
        'slug' => 'VARCHAR(512)',
        'content' => 'TEXT',
        'short_intro' => 'TEXT',
        'cover_image' => 'VARCHAR(512)',
        'post_type' => "VARCHAR(50) DEFAULT 'blog'",
        'status' => "VARCHAR(50) DEFAULT 'published'",
        'start_date' => 'DATE',
        'end_date' => 'DATE',
        'duration_days' => 'INTEGER',
        'budget' => 'DECIMAL(15,2)',
        'currency' => "VARCHAR(10) DEFAULT 'VND'",
        'meta_title' => 'VARCHAR(255)',
        'meta_description' => 'TEXT',
        'published_at' => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'created_at' => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'updated_at' => 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        'view_count' => 'INTEGER DEFAULT 0',
        'like_count' => 'INTEGER DEFAULT 0',
        'comment_count' => 'INTEGER DEFAULT 0',
        'original_post_id' => 'INTEGER REFERENCES posts(id) ON DELETE SET NULL'
    ];

    foreach ($columns as $col => $type) {
        try {
            // Kiểm tra xem cột đã tồn tại chưa
            $check = $db->prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'posts' AND column_name = ?");
            $check->execute([$col]);
            if (!$check->fetch()) {
                $db->exec("ALTER TABLE posts ADD COLUMN $col $type");
                echo "✅ Đã thêm cột: $col\n";
            } else {
                echo "ℹ️ Cột $col đã tồn tại.\n";
            }
        } catch (Exception $e) {
            echo "❌ Lỗi khi thêm cột $col: " . $e->getMessage() . "\n";
        }
    }

    // 1. Đảm bảo bảng tags tồn tại
    $db->exec("CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(50) DEFAULT 'hashtag',
        post_count INTEGER DEFAULT 0,
        is_trending BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "✅ Đã kiểm tra bảng tags.\n";

    // 2. Đảm bảo bảng post_tags (bảng trung gian) tồn tại
    $db->exec("CREATE TABLE IF NOT EXISTS post_tags (
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, tag_id)
    )");
    echo "✅ Đã kiểm tra bảng post_tags.\n";

    // 3. Đảm bảo bảng post_media tồn tại
    $db->exec("CREATE TABLE IF NOT EXISTS post_media (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'image',
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "✅ Đã kiểm tra bảng post_media.\n";

    // 4. Đảm bảo bảng likes tồn tại
    $db->exec("CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
    )");
    echo "✅ Đã kiểm tra bảng likes.\n";

    echo "--- HOÀN TẤT CẬP NHẬT (V4) ---";

} catch (Exception $e) {
    echo "❌ LỖI HỆ THỐNG: " . $e->getMessage() . "\n";
}
?>