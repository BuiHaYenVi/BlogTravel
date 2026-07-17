<?php
require_once __DIR__ . '/../app/config/database.php';

try {
    $db = Database::getInstance();
    
    $result = [
        'time' => date('Y-m-d H:i:s'),
        'columns' => $db->fetchAll("SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications'"),
        'latest_notifications' => $db->fetchAll("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5"),
        'users_sample' => $db->fetchAll("SELECT id, username FROM users LIMIT 5")
    ];
    
    file_put_contents(__DIR__ . '/debug_db.txt', print_r($result, true));
    echo "Check debug_db.txt";
} catch (Exception $e) {
    file_put_contents(__DIR__ . '/debug_db.txt', "Error: " . $e->getMessage());
}
?>