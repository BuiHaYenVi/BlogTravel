<?php
try {
    $pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=dulichmxh', 'postgres', '2026');
    
    echo "--- Tìm kiếm chính xác ---\n";
    $stmt = $pdo->prepare("SELECT id, name, slug, status, region FROM locations WHERE name ILIKE '%Bà Rịa%' OR name ILIKE '%Vũng Tàu%'");
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($results);
    
    if (empty($results)) {
        echo "Không tìm thấy kết quả nào liên quan đến Bà Rịa - Vũng Tàu.\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
