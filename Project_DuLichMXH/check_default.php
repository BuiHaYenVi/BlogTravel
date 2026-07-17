<?php
try {
    $dsn = "pgsql:host=127.0.0.1;port=5432;dbname=dulichmxh";
    $pdo = new PDO($dsn, "postgres", "2026");
    $stmt = $pdo->query("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'stories'");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
