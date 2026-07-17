<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "Updating notifications table...\n";
    
    // 1. Set default value for is_read
    $db->exec("ALTER TABLE notifications ALTER COLUMN is_read SET DEFAULT FALSE");
    echo "✅ Set DEFAULT FALSE for is_read\n";
    
    // 2. Update existing NULLs to FALSE
    $db->exec("UPDATE notifications SET is_read = FALSE WHERE is_read IS NULL");
    echo "✅ Updated existing NULLs to FALSE\n";
    
    // 3. Ensure target_type has a default if not provided
    $db->exec("ALTER TABLE notifications ALTER COLUMN target_type SET DEFAULT 'general'");
    echo "✅ Set DEFAULT 'general' for target_type\n";
    
    echo "--- DONE ---\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
