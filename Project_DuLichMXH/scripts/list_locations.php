<?php
try {
    $pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=dulichmxh', 'postgres', '2026');
    $stmt = $pdo->query("SELECT id, name, slug FROM locations WHERE type = 'province' ORDER BY id");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
