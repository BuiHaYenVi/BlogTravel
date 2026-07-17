<?php
require_once __DIR__ . '/app/config/database.php';
try {
    $db = Database::getInstance()->getConnection();
    
    echo "--- CHECKING TABLES ---\n";
    $tables = ['posts', 'likes', 'post_media', 'users', 'groups'];
    foreach ($tables as $table) {
        $stmt = $db->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table')");
        $exists = $stmt->fetchColumn();
        echo "Table '$table': " . ($exists ? "EXISTS" : "MISSING") . "\n";
        
        if ($exists) {
            $stmt = $db->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '$table'");
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo "  Columns: ";
            foreach ($columns as $col) {
                echo $col['column_name'] . "(" . $col['data_type'] . "), ";
            }
            echo "\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
