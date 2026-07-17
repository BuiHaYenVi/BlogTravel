<?php
require_once __DIR__ . '/app/config/database.php';
try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->query("SELECT * FROM groups LIMIT 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Columns: " . implode(', ', array_keys($row)) . "\n";
    
    $stmt = $db->prepare("SELECT * FROM groups WHERE id = ?");
    $stmt->execute([39]);
    $group = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($group) {
        echo "Group 39 found. creator_id: " . ($group['creator_id'] ?? 'N/A') . ", owner_id: " . ($group['owner_id'] ?? 'N/A') . "\n";
    } else {
        echo "Group 39 not found.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
