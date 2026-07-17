<?php
try {
    $dsn = "pgsql:host=127.0.0.1;port=5432;dbname=dulichmxh";
    $pdo = new PDO($dsn, "postgres", "2026");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "--- TABLES IN DATABASE ---\n";
    $stmt = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    print_r($tables);
    
    $tablesToCheck = ['users', 'posts', 'stories'];
    foreach ($tablesToCheck as $table) {
        echo "\n--- TABLE COLUMNS FOR $table ---\n";
        $stmt = $pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '$table' AND table_schema='public'");
        print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
