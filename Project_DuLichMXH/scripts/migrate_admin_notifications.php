<?php
require 'vendor/autoload.php';

use App\Config\Database;
use App\Utils\Env;

try {
    $db = Database::getInstance()->getConnection();
    $sql = "CREATE TABLE IF NOT EXISTS admin_notifications (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $db->exec($sql);
    echo "Table 'admin_notifications' created successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
