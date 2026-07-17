<?php
require_once __DIR__ . '/app/config/database.php';
try {
    $db = Database::getInstance()->getConnection();
    
    // 1. Kiểm tra cấu trúc bảng users để xem có email/password/status không
    echo "--- Table: users ---\n";
    $stmt = $db->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

    // 2. Kiểm tra bảng messages (nếu có)
    echo "\n--- Table: messages ---\n";
    $stmt = $db->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages'");
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (empty($res)) {
        echo "Table 'messages' does not exist.\n";
    } else {
        print_r($res);
    }

    // 3. Tìm các bảng có chứa từ 'chat' hoặc 'conversation'
    echo "\n--- Searching for chat-related tables ---\n";
    $stmt = $db->query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND (tablename LIKE '%chat%' OR tablename LIKE '%conv%')");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
