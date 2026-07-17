<?php
require_once __DIR__ . '/../app/models/Notification.php';
require_once __DIR__ . '/../app/config/database.php';

try {
    $notif = new Notification();
    
    // Tìm 2 user đầu tiên để test
    $db = Database::getInstance();
    $users = $db->fetchAll("SELECT id FROM users LIMIT 2");
    
    if (count($users) < 2) {
        die("Cần ít nhất 2 users trong DB để test");
    }
    
    $recipient = $users[0]['id'];
    $actor = $users[1]['id'];
    
    $id = $notif->create([
        'user_id' => $recipient,
        'actor_id' => $actor,
        'type' => 'follow',
        'target_id' => $actor,
        'target_type' => 'user'
    ]);
    
    echo "✅ Đã tạo thông báo test thành công. ID: $id. <br>";
    echo "Người nhận (Recipient ID): $recipient <br>";
    echo "Người thực hiện (Actor ID): $actor <br>";
    echo "Hãy đăng nhập vào user ID $recipient để kiểm tra.";

} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage();
}
?>