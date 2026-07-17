<?php
try {
    $pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=dulichmxh', 'postgres', '2026');
    
    echo "--- Kiểm tra Blogs theo Location ---\n";
    $stmt = $pdo->query("SELECT id, name FROM locations WHERE type = 'province' LIMIT 10");
    $provinces = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($provinces as $p) {
        $blogStmt = $pdo->prepare("SELECT COUNT(*) FROM posts WHERE location_id = :id AND post_type = 'blog'");
        $blogStmt->execute(['id' => $p['id']]);
        $count = $blogStmt->fetchColumn();
        echo "Province: {$p['name']} (ID: {$p['id']}) - Blogs: $count\n";
        
        if ($count > 0) {
            $blogs = $pdo->prepare("SELECT id, title, location_id FROM posts WHERE location_id = :id AND post_type = 'blog' LIMIT 3");
            $blogs->execute(['id' => $p['id']]);
            print_r($blogs->fetchAll(PDO::FETCH_ASSOC));
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
