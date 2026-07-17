<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Utils\JWTHandler;
use App\Models\Report;

try {
    $dsn = "pgsql:host=127.0.0.1;port=5432;dbname=dulichmxh";
    $pdo = new PDO($dsn, "postgres", "2026");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Lấy thông tin user gửi báo cáo
    $stmt = $pdo->query("SELECT id, username, role_id FROM users WHERE username = 'haisike' LIMIT 1");
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        throw new Exception("User 'haisike' not found in database.");
    }
    echo "Found user: {$user['username']} (ID: {$user['id']}, Role: {$user['role_id']})\n";

    // 2. Tạo JWT Token
    $token = JWTHandler::generateToken([
        'id' => $user['id'],
        'username' => $user['username'],
        'role_id' => $user['role_id']
    ]);
    echo "Generated JWT Token: " . substr($token, 0, 30) . "...\n";

    // 3. Lấy 1 Story bất kỳ để báo cáo
    $stmt = $pdo->query("SELECT id, user_id FROM stories WHERE is_active = TRUE LIMIT 1");
    $story = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$story) {
        // Tạo câu story ảo hoặc lấy câu story is_active = FALSE
        $stmt = $pdo->query("SELECT id, user_id FROM stories LIMIT 1");
        $story = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$story) {
            throw new Exception("No stories found in stories table. Please create a story first.");
        }
        // Kích hoạt lại story này để kiểm tra
        $pdo->prepare("UPDATE stories SET is_active = TRUE WHERE id = ?")->execute([$story['id']]);
        echo "No active story found. Reactivated story ID: {$story['id']}\n";
    } else {
        echo "Found active story to report: ID {$story['id']} (Owner ID: {$story['user_id']})\n";
    }

    // Xóa báo cáo cũ của user này với story này nếu có để tránh lỗi 409 (đã báo cáo)
    $stmt = $pdo->prepare("DELETE FROM reports WHERE reporter_id = ? AND reportable_type = 'story' AND reportable_id = ?");
    $stmt->execute([$user['id'], $story['id']]);
    echo "Cleared old reports from reporter {$user['id']} on story {$story['id']}.\n";

    // 4. Gửi HTTP Request (POST /api/reports) dùng cURL
    $url = "http://127.0.0.1:90/Project_DuLichMXH/public/api/reports";
    $payload = json_encode([
        'reportable_type' => 'story',
        'reportable_id' => $story['id'],
        'reason' => 'inappropriate',
        'description' => 'Test báo cáo story tin ngắn'
    ]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ]);
    
    echo "Sending cURL POST request to {$url}...\n";
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "HTTP Status Code: {$httpCode}\n";
    echo "Response Payload: {$response}\n";

    // 5. Kiểm tra thông báo Admin đã lưu vào DB
    echo "\nChecking database for the new admin notification:\n";
    $stmt = $pdo->query("SELECT id, type, data, created_at FROM admin_notifications ORDER BY id DESC LIMIT 1");
    $notif = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($notif) {
        echo "Notification ID: {$notif['id']}\n";
        echo "Notification Type: {$notif['type']}\n";
        echo "Notification Data: " . $notif['data'] . "\n";
        echo "Created At: {$notif['created_at']}\n";
    } else {
        echo "No admin notification found!\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
