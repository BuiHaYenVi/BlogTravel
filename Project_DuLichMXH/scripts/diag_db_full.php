<?php
try {
    $pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=dulichmxh', 'postgres', '2026');
    $stmt = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    foreach($stmt->fetchAll(PDO::FETCH_COLUMN) as $t) {
        echo $t . "\n";
        $cols = $pdo->query("SELECT column_name FROM information_schema.columns WHERE table_name = '$t'");
        echo "  Columns: " . implode(", ", $cols->fetchAll(PDO::FETCH_COLUMN)) . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
