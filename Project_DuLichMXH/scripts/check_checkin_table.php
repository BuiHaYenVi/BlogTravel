<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    // Check if table exists
    $sql = "SELECT EXiSTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'checkins'
    )";
    
    $stmt = $conn->query($sql);
    $exists = $stmt->fetchColumn();

    if (!$exists) {
        echo "Table 'checkins' does not exist. Creating it...\n";
        $createSql = "
            CREATE TABLE checkins (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                destination_id INTEGER NOT NULL,
                status VARCHAR(20) NOT NULL, -- 'visited', 'planning'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, destination_id)
            );
            
            -- Create index for faster lookups
            CREATE INDEX idx_checkins_user_dest ON checkins(user_id, destination_id);
        ";
        $conn->exec($createSql);
        echo "Table 'checkins' created successfully.\n";
    } else {
        echo "Table 'checkins' already exists.\n";
        
        // Optional: Check if columns are correct
        $cols = $conn->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'checkins'")->fetchAll(PDO::FETCH_COLUMN);
        echo "Current columns: " . implode(", ", $cols) . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>