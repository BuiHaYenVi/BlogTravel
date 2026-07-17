<?php
try {
    $pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=dulichmxh', 'postgres', '2026');
    $sql = "UPDATE locations SET name = 'Bà Rịa - Vũng Tàu', slug = 'ba-ria-vung-tau' WHERE id = 11 OR slug LIKE '%ba-ria%–%vung-tau%'";
    $count = $pdo->exec($sql);
    echo "Đã cập nhật $count bản ghi thành công!\n";
    
    // Kiểm tra lại
    $stmt = $pdo->query("SELECT id, name, slug FROM locations WHERE id = 11");
    print_r($stmt->fetch(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
