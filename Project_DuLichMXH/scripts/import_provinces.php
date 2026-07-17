<?php
/**
 * Script tự động import dữ liệu 63 tỉnh thành từ JSON vào Database
 * Phiên bản sửa lỗi Slug và hỗ trợ Tiếng Việt tốt hơn
 */
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/Config/Database.php';

header('Content-Type: text/plain; charset=utf-8');

function slugify($str) {
    $str = trim(mb_strtolower($str));
    $str = preg_replace('/(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ)/', 'a', $str);
    $str = preg_replace('/(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ)/', 'e', $str);
    $str = preg_replace('/(ì|í|ị|ỉ|ĩ)/', 'i', $str);
    $str = preg_replace('/(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ)/', 'o', $str);
    $str = preg_replace('/(ù|í|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ)/', 'u', $str);
    $str = preg_replace('/(ỳ|ý|ỵ|ỷ|ỹ)/', 'y', $str);
    $str = preg_replace('/(đ)/', 'd', $str);
    $str = preg_replace('/[^a-z0-9-\s]/', '', $str);
    $str = preg_replace('/([\s]+)/', '-', $str);
    return $str;
}

function getRegion($provinceName) {
    $regions = [
        'Miền Bắc' => ['Lào Cai', 'Yên Bái', 'Điện Biên', 'Hòa Bình', 'Lai Châu', 'Sơn La', 'Hà Giang', 'Cao Bằng', 'Bắc Kạn', 'Lạng Sơn', 'Tuyên Quang', 'Thái Nguyên', 'Phú Thọ', 'Bắc Giang', 'Quảng Ninh', 'Bắc Ninh', 'Hà Nam', 'Hà Nội', 'Hải Dương', 'Hải Phòng', 'Hưng Yên', 'Nam Định', 'Ninh Bình', 'Thái Bình', 'Vĩnh Phúc'],
        'Miền Trung' => ['Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên Huế', 'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận'],
        'Tây Nguyên' => ['Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng'],
        'Miền Nam' => ['Bình Phước', 'Tây Ninh', 'Bình Dương', 'Đồng Nai', 'Bà Rịa', 'Hồ Chí Minh'],
        'Miền Tây' => ['Long An', 'Tiền Giang', 'Bến Tre', 'Trà Vinh', 'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Kiên Giang', 'Cần Thơ', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau']
    ];

    foreach ($regions as $region => $provinces) {
        foreach ($provinces as $p) {
            if (mb_stripos($provinceName, $p) !== false) return $region;
        }
    }
    return 'Khác';
}

try {
    $db = \App\Config\Database::getInstance()->getConnection();
    $jsonPath = __DIR__ . '/../../gody.vn/src/services/mock/vietnam_travel_db.json';
    
    if (!file_exists($jsonPath)) {
        die("❌ Không tìm thấy file JSON tại: $jsonPath\n");
    }

    $jsonData = json_decode(file_get_contents($jsonPath), true);
    if (!$jsonData) {
        die("❌ Lỗi giải mã JSON.\n");
    }

    echo "--- BẮT ĐẦU IMPORT 63 TỈNH THÀNH (V2) ---\n";
    
    $successCount = 0;
    $skipCount = 0;

    $targetNames = [
        'Hà Nội', 'Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Thừa Thiên Huế', 
        'An Giang', 'Bắc Ninh', 'Cao Bằng', 'Cà Mau', 'Đắk Lắk', 'Đồng Nai', 'Đồng Tháp', 
        'Điện Biên', 'Gia Lai', 'Hà Tĩnh', 'Hưng Yên', 'Khánh Hòa', 'Lai Châu', 'Lạng Sơn', 
        'Lào Cai', 'Lâm Đồng', 'Nghệ An', 'Ninh Bình', 'Phú Thọ', 'Quảng Ninh', 'Quảng Ngãi', 
        'Quảng Trị', 'Sơn La', 'Tây Ninh', 'Thái Nguyên', 'Thanh Hóa', 'Tuyên Quang', 'Vĩnh Long',
        'TP. Hồ Chí Minh', 'TP. Huế' // keep legacy names for match
    ];

    foreach ($jsonData as $item) {
        $name = $item['tinh_thanh'];
        $data = $item['data'];
        $slug = slugify($name);
        $region = getRegion($name);
        
        if (!in_array($name, $targetNames)) {
            echo "ℹ️ Bỏ qua (ngoài danh sách 34): $name\n";
            $skipCount++;
            continue;
        }
        
        // Kiểm tra xem đã tồn tại chưa
        $stmt = $db->prepare("SELECT id FROM locations WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->fetch()) {
            echo "ℹ️ Bỏ qua: $name (Đã tồn tại slug: $slug)\n";
            $skipCount++;
            continue;
        }

        // Chuẩn bị dữ liệu travel_tips
        $travelTips = json_encode([
            'di_chuyen' => $data['kinh_nghiem']['di_chuyen'] ?? '',
            'an_uong' => $data['kinh_nghiem']['an_uong'] ?? '',
            'luu_tru' => $data['kinh_nghiem']['luu_tru'] ?? '',
            'luu_y' => $data['kinh_nghiem']['luu_y'] ?? ''
        ], JSON_UNESCAPED_UNICODE);

        $sql = "INSERT INTO locations (name, slug, type, region, description, short_desc, travel_tips, status, created_at) 
                VALUES (?, ?, 'province', ?, ?, ?, ?, 'active', NOW())";
        
        $stmt = $db->prepare($sql);
        try {
            $res = $stmt->execute([
                $name,
                $slug,
                $region,
                $data['gioi_thieu'],
                mb_substr($data['gioi_thieu'], 0, 200) . '...',
                $travelTips
            ]);

            if ($res) {
                echo "✅ Đã thêm: $name\n";
                $successCount++;
                
                $provinceId = $db->lastInsertId();
                
                foreach ($data['diem_du_lich'] as $spot) {
                    $spotName = $spot['ten'];
                    $spotSlug = slugify($spotName) . '-' . $provinceId;
                    
                    $sqlSpot = "INSERT INTO locations (parent_id, name, slug, type, description, short_desc, status, created_at) 
                                VALUES (?, ?, ?, 'spot', ?, ?, 'active', NOW())";
                    $stmtSpot = $db->prepare($sqlSpot);
                    try {
                        $stmtSpot->execute([
                            $provinceId,
                            $spotName,
                            $spotSlug,
                            $spot['mo_ta'] . "\n\nĐiểm nổi bật: " . $spot['diem_noi_bat'],
                            $spot['diem_noi_bat']
                        ]);
                    } catch (Exception $e) {
                        echo "   ⚠️ Lỗi chèn Spot ($spotName): " . $e->getMessage() . "\n";
                    }
                }
            }
        } catch (Exception $e) {
            echo "❌ Lỗi chèn Tỉnh ($name): " . $e->getMessage() . "\n";
        }
    }

    echo "\n--- HOÀN TẤT ---\n";
    echo "Thành công: $successCount\n";
    echo "Bỏ qua: $skipCount\n";

} catch (Exception $e) {
    echo "❌ LỖI HỆ THỐNG: " . $e->getMessage() . "\n";
}
