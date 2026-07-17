<?php
try {
    $pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=dulichmxh', 'postgres', '2026');
    $stmt = $pdo->query("SELECT id, title, status, post_type, location_id FROM posts WHERE location_id IS NOT NULL");
    $blogs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($blogs) . " posts with location_id\n";
    print_r($blogs);

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
