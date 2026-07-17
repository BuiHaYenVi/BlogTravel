<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    echo "Fixing 'checkins' table schema...\n";

    // 1. Check if destination_id exists, if not, rename location_id to destination_id or add it
    $cols = $conn->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'checkins'")->fetchAll(PDO::FETCH_COLUMN);

    if (in_array('location_id', $cols) && !in_array('destination_id', $cols)) {
        echo "Renaming 'location_id' to 'destination_id'...\n";
        $conn->exec("ALTER TABLE checkins RENAME COLUMN location_id TO destination_id");
    } elseif (!in_array('destination_id', $cols)) {
        echo "Adding 'destination_id' column...\n";
        $conn->exec("ALTER TABLE checkins ADD COLUMN destination_id INTEGER");
    }

    // 2. Check if status exists
    if (!in_array('status', $cols)) {
        echo "Adding 'status' column...\n";
        $conn->exec("ALTER TABLE checkins ADD COLUMN status VARCHAR(20) DEFAULT 'visited'");
    }

    // 3. Add unique constraint if not exists
    try {
        echo "Adding UNIQUE constraint (user_id, destination_id)...\n";
        $conn->exec("ALTER TABLE checkins ADD CONSTRAINT unique_user_destination UNIQUE (user_id, destination_id)");
    } catch (Exception $e) {
        echo "Constraint might already exist or data conflicts: " . $e->getMessage() . "\n";
    }

    echo "Schema fix completed.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>