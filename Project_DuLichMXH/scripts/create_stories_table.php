<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/config/database.php';

use App\Config\Database;

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    // Tạo bảng stories
    $conn->exec("CREATE TABLE IF NOT EXISTS stories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        media_url VARCHAR(512) NOT NULL,
        media_type VARCHAR(20) NOT NULL,
        caption VARCHAR(256),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );");

    // Tạo index cho active feed (tin chưa hết hạn)
    $conn->exec("CREATE INDEX IF NOT EXISTS idx_stories_active_feed 
        ON stories (user_id, expires_at) 
        WHERE is_active = TRUE;");

    echo "✅ Đã tạo bảng stories và thiết lập chỉ mục thành công trong PostgreSQL.\n";

} catch (Exception $e) {
    echo "❌ Lỗi khi khởi tạo cơ sở dữ liệu: " . $e->getMessage() . "\n";
}
