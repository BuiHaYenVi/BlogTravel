<?php
require_once __DIR__ . '/app/config/database.php';

$regions = [
    'Miền Bắc' => [
        'Lào Cai', 'Yên Bái', 'Điện Biên', 'Hòa Bình', 'Lai Châu', 'Sơn La',
        'Hà Giang', 'Cao Bằng', 'Bắc Kạn', 'Lạng Sơn', 'Tuyên Quang', 'Thái Nguyên', 'Phú Thọ',
        'Bắc Giang', 'Quảng Ninh', 'Bắc Ninh', 'Hà Nam', 'Hà Nội', 'Hải Dương', 'Hải Phòng',
        'Hưng Yên', 'Nam Định', 'Ninh Bình', 'Thái Bình', 'Vĩnh Phúc'
    ],
    'Miền Trung' => [
        'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế',
        'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận'
    ],
    'Tây Nguyên' => [
        'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng'
    ],
    'Miền Nam' => [
        'Bình Phước', 'Tây Ninh', 'Bình Dương', 'Đồng Nai', 'Bà Rịa – Vũng Tàu', 'TP. Hồ Chí Minh'
    ],
    'Miền Tây' => [
        'Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh', 'Vĩnh Long', 'Đồng Tháp',
        'An Giang', 'Kiên Giang', 'Cần Thơ', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau'
    ]
];

try {
    $db = Database::getInstance()->getConnection();
    echo "Bắt đầu cập nhật vùng miền cho các tỉnh thành...\n";

    $totalUpdated = 0;
    foreach ($regions as $regionName => $provinces) {
        foreach ($provinces as $province) {
            // Cập nhật vùng miền dựa trên tên tỉnh (ILIKE để không phân biệt hoa thường và xử lý khoảng trắng)
            $sql = "UPDATE locations SET region = :region WHERE (name ILIKE :name OR name ILIKE :name2) AND type = 'province'";
            
            // Một số tên tỉnh có thể có biến thể (ví dụ: TP. Hồ Chí Minh vs Hồ Chí Minh)
            $nameParam = $province;
            $name2Param = str_replace(['TP. ', 'Tỉnh '], '', $province);

            $stmt = $db->prepare($sql);
            $stmt->execute([
                'region' => $regionName,
                'name' => $nameParam,
                'name2' => $name2Param
            ]);
            
            $count = $stmt->rowCount();
            if ($count > 0) {
                echo "[+] $province -> $regionName ($count dòng)\n";
                $totalUpdated += $count;
            }
        }
    }

    echo "\nHoàn tất! Tổng cộng đã cập nhật $totalUpdated tỉnh thành.\n";
    echo "Lưu ý: Các điểm tham quan (spot) thuộc tỉnh nào sẽ cần được cập nhật region theo parent_id nếu cần thiết.\n";

    // Cập nhật region cho các điểm tham quan dựa trên region của tỉnh cha
    $sqlSpots = "UPDATE locations child 
                 SET region = parent.region 
                 FROM locations parent 
                 WHERE child.parent_id = parent.id AND child.type = 'spot'";
    $countSpots = $db->exec($sqlSpots);
    echo "[*] Đã đồng bộ vùng miền cho $countSpots điểm tham quan theo tỉnh thành.\n";

} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
}
?>
