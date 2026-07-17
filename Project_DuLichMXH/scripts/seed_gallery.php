<?php
require_once __DIR__ . '/app/config/database.php';

$provincesImages = [
    'da-nang' => [
        'https://images.unsplash.com/photo-1559592442-9e54238a2917',
        'https://images.unsplash.com/photo-1555546271-2911fcfea81f',
        'https://images.unsplash.com/photo-1582236353342-999335e97669'
    ],
    'ha-noi' => [
        'https://images.unsplash.com/photo-1509030464150-15f65034f074',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
        'https://images.unsplash.com/photo-1566996533031-6435c656363d'
    ],
    'ho-chi-minh' => [
        'https://images.unsplash.com/photo-1528605105345-5344ea20e269',
        'https://images.unsplash.com/photo-1544033527-b192daee1f5b',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb'
    ],
    'lam-dong' => [
        'https://images.unsplash.com/photo-1559197331-516-4d8458bb5052',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        'https://images.unsplash.com/photo-1528127269322-539801943592'
    ],
    'thua-thien-hue' => [
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4',
        'https://images.unsplash.com/photo-1559592442-9e54238a2917',
        'https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9'
    ],
    'an-giang' => [
        'https://images.unsplash.com/photo-1599818815155-2e6b72a6b47c',
        'https://images.unsplash.com/photo-1596402184320-417d717867cd',
        'https://images.unsplash.com/photo-1589308078059-be1415eab4c3'
    ]
];

try {
    $db = Database::getInstance()->getConnection();
    echo "Bắt đầu cập nhật thư viện ảnh (gallery) cho các tỉnh thành...\n";

    foreach ($provincesImages as $slug => $images) {
        $galleryJson = json_encode($images);
        $sql = "UPDATE locations SET gallery = :gallery WHERE slug = :slug AND type = 'province'";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            'gallery' => $galleryJson,
            'slug' => $slug
        ]);
        
        if ($stmt->rowCount() > 0) {
            echo "[+] Đã cập nhật gallery cho: $slug\n";
        }
    }

    // Với các tỉnh khác chưa có ảnh cụ thể, ta có thể dùng ảnh Unsplash theo keyword tên tỉnh
    $sqlFetch = "SELECT id, name, slug FROM locations WHERE gallery IS NULL AND type = 'province'";
    $provinces = $db->query($sqlFetch)->fetchAll();
    
    foreach ($provinces as $p) {
        $keywords = urlencode($p['name'] . ' Vietnam travel');
        $randomImages = [
            "https://images.unsplash.com/photo-1506702315536-dd8b83e2dcf9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&w=800&q=80"
        ];
        $galleryJson = json_encode($randomImages);
        
        $db->prepare("UPDATE locations SET gallery = :gallery WHERE id = :id")
           ->execute(['gallery' => $galleryJson, 'id' => $p['id']]);
        echo "[.] Đã gán ảnh mẫu cho: " . $p['name'] . "\n";
    }

    echo "\nHoàn tất cập nhật gallery!\n";

} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
}
?>
