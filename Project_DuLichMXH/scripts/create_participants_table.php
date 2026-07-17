<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    $conn->exec("CREATE TABLE IF NOT EXISTS trip_participants (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(trip_id, user_id)
    );");

    echo "✅ Đã tạo bảng trip_participants thành công.\n";

} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
}
