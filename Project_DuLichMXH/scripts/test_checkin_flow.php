<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Utils\JWTHandler;

try {
    $dsn = "pgsql:host=127.0.0.1;port=5432;dbname=dulichmxh";
    $pdo = new PDO($dsn, "postgres", "2026");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Get haisike's user info
    $stmt = $pdo->query("SELECT id, username, role_id FROM users WHERE username = 'haisike' LIMIT 1");
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        throw new Exception("User 'haisike' not found in database.");
    }
    echo "=== USER INFO ===\n";
    echo "Username: {$user['username']} (ID: {$user['id']})\n\n";

    // 2. Generate JWT token
    $token = JWTHandler::generateToken([
        'id' => $user['id'],
        'username' => $user['username'],
        'role_id' => $user['role_id']
    ]);

    // Test destination ID
    $testDestId = 15; // Let's use 15 for testing

    // 3. Clear any existing check-in row for this test destination to start clean
    $stmt = $pdo->prepare("DELETE FROM checkins WHERE user_id = ? AND destination_id = ?");
    $stmt->execute([$user['id'], $testDestId]);
    echo "=== STEP 0: CLEANUP ===\n";
    echo "Deleted any pre-existing check-in for user {$user['id']} at destination {$testDestId}.\n\n";

    // 4. Verify initial database state (should be empty)
    $stmt = $pdo->prepare("SELECT status FROM checkins WHERE user_id = ? AND destination_id = ?");
    $stmt->execute([$user['id'], $testDestId]);
    $initialStatus = $stmt->fetchColumn();
    echo "=== STEP 1: INITIAL DB STATE ===\n";
    echo "Status in database: " . ($initialStatus ?: "NULL (No record)") . "\n\n";

    // 5. Send POST to toggle checkin (visited)
    $url = "http://127.0.0.1:90/Project_DuLichMXH/public/api/checkins/toggle";
    $payload = json_encode([
        'destination_id' => $testDestId,
        'status' => 'visited'
    ]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ]);
    
    echo "=== STEP 2: SEND TOGGLE 'visited' REQUEST ===\n";
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "HTTP Status Code: {$httpCode}\n";
    echo "Response Payload: {$response}\n\n";

    // 6. Verify database state after checking-in
    $stmt = $pdo->prepare("SELECT * FROM checkins WHERE user_id = ? AND destination_id = ?");
    $stmt->execute([$user['id'], $testDestId]);
    $checkinRecord = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "=== STEP 3: DB STATE AFTER TOGGLE ===\n";
    if ($checkinRecord) {
        echo "✅ SUCCESS: Row successfully saved in database!\n";
        echo "Row Details:\n";
        foreach ($checkinRecord as $key => $val) {
            echo "  - {$key}: " . (is_null($val) ? 'NULL' : $val) . "\n";
        }
    } else {
        echo "❌ FAILURE: Row was not found in the database.\n";
    }
    echo "\n";

    // 7. Toggle off check-in (clicking "visited" again)
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ]);
    
    echo "=== STEP 4: SEND SECOND TOGGLE 'visited' REQUEST (UNTOGGLE) ===\n";
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "HTTP Status: {$httpCode}\n";
    echo "Response Payload: {$response}\n\n";

    // 8. Verify database state after untoggle
    $stmt = $pdo->prepare("SELECT status FROM checkins WHERE user_id = ? AND destination_id = ?");
    $stmt->execute([$user['id'], $testDestId]);
    $finalStatus = $stmt->fetchColumn();
    echo "=== STEP 5: FINAL DB STATE ===\n";
    echo "Status in database: " . ($finalStatus ?: "NULL (Row successfully deleted/toggled off)") . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
