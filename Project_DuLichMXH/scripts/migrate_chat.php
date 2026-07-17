<?php
require_once __DIR__ . '/app/config/database.php';
try {
    $db = Database::getInstance()->getConnection();
    echo "--- CREATING CHAT TABLES ---\n";
    
    // 1. Tạo bảng chats (Cuộc hội thoại)
    $db->exec("
        CREATE TABLE IF NOT EXISTS chats (
            id SERIAL PRIMARY KEY,
            user_one_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            user_two_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
            last_message_id INTEGER, -- Sẽ được cập nhật sau khi có tin nhắn
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_one_id, user_two_id)
        )
    ");
    echo "✅ Table 'chats' created or already exists.\n";

    // 2. Tạo bảng messages (Tin nhắn)
    $db->exec("
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            conversation_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
            sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message_text TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✅ Table 'messages' created or already exists.\n";

    // 3. Cập nhật foreign key cho last_message_id trong chats
    $db->exec("
        ALTER TABLE chats 
        ADD CONSTRAINT fk_last_message 
        FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL
    ");
    echo "✅ Added foreign key for last_message_id.\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
