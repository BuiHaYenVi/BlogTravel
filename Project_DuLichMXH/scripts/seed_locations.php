<?php
require_once __DIR__ . '/app/config/database.php';

function slugify($text) {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    if (empty($text)) return 'n-a';
    return $text;
}

// Hàm chuyển đổi tiếng Việt có dấu thành không dấu cho slug
function vn_to_str($str) {
    $unicode = array(
        'a'=>'á|à|ả|ã|ạ|ă|ắ|ặ|ằ|ẳ|ẵ|â|ấ|ầ|ẩ|ẫ|ậ',
        'd'=>'đ',
        'e'=>'é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ',
        'i'=>'í|ì|ỉ|ĩ|ị',
        'o'=>'ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ',
        'u'=>'ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự',
        'y'=>'ý|ỳ|ỷ|ỹ|ị',
        'A'=>'Á|À|Ả|Ã|Ạ|Ă|Ắ|Ặ|Ằ|Ẳ|Ẵ|Â|Ấ|Ầ|Ẩ|Ẫ|Ậ',
        'D'=>'Đ',
        'E'=>'É|È|Ẻ|Ẽ|Ẹ|Ê|Ế|Ề|Ể|Ễ|Ệ',
        'I'=>'Í|Ì|Ỉ|Ĩ|Ị',
        'O'=>'Ó|Ò|Ỏ|Õ|Ọ|Ô|Ố|Ồ|Ổ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ở|Ỡ|Ợ',
        'U'=>'Ú|Ù|Ủ|Ũ|Ụ|Ư|Ứ|Ừ|Ử|Ữ|Ự',
        'Y'=>'Ý|Ì|Ỉ|Ĩ|Ị',
    );
    foreach($unicode as $nonUnicode=>$uni){
        $str = preg_replace("/($uni)/i", $nonUnicode, $str);
    }
    // Thay thế tất cả ký tự không phải chữ cái hoặc số bằng dấu gạch ngang
    $str = preg_replace('/[^a-zA-Z0-9]/', '-', $str);
    // Thay thế nhiều dấu gạch ngang bằng một dấu
    $str = preg_replace('/-+/', '-', $str);
    // Xóa dấu gạch ngang ở đầu và cuối
    $str = trim($str, '-');
    return strtolower($str);
}

try {
    $db = Database::getInstance()->getConnection();
    $jsonData = file_get_contents(__DIR__ . '/vietnam_travel_db.json');
    $data = json_decode($jsonData, true);

    if (!$data) {
        die("Không thể đọc dữ liệu JSON.\n");
    }

    echo "Bắt đầu import " . count($data) . " tỉnh thành...\n";

    foreach ($data as $item) {
        $name = $item['tinh_thanh'];
        $details = $item['data'];
        $slug = vn_to_str($name);

        // Kiểm tra xem tỉnh đã tồn tại chưa
        $stmt = $db->prepare("SELECT id FROM locations WHERE slug = :slug AND type = 'province'");
        $stmt->execute(['slug' => $slug]);
        $province = $stmt->fetch();

        if ($province) {
            $provinceId = $province['id'];
            echo "[-] Đã tồn tại: $name (ID: $provinceId). Đang cập nhật travel_tips...\n";
            // Cập nhật travel_tips cho tỉnh đã có
            $stmt = $db->prepare("UPDATE locations SET travel_tips = :tips WHERE id = :id");
            $stmt->execute([
                'tips' => json_encode($details['kinh_nghiem']),
                'id' => $provinceId
            ]);
        } else {
            // Thêm mới tỉnh
            $stmt = $db->prepare("INSERT INTO locations (name, slug, type, description, short_desc, travel_tips, status, created_at) 
                                 VALUES (:name, :slug, 'province', :description, :short_desc, :tips, 'active', NOW()) 
                                 RETURNING id");
            $stmt->execute([
                'name' => $name,
                'slug' => $slug,
                'description' => $details['gioi_thieu'],
                'short_desc' => mb_substr($details['gioi_thieu'], 0, 150) . '...',
                'tips' => json_encode($details['kinh_nghiem'])
            ]);
            $provinceId = $stmt->fetchColumn();
            echo "[+] Đã thêm: $name (ID: $provinceId)\n";
        }

        // Thêm các điểm tham quan (spots)
        foreach ($details['diem_du_lich'] as $spot) {
            $spotName = $spot['ten'];
            $spotSlug = vn_to_str($spotName) . '-' . $provinceId; // Tránh trùng slug

            // Kiểm tra điểm tham quan tồn tại chưa
            $stmt = $db->prepare("SELECT id FROM locations WHERE slug = :slug AND parent_id = :parent_id");
            $stmt->execute(['slug' => $spotSlug, 'parent_id' => $provinceId]);
            if (!$stmt->fetch()) {
                $stmt = $db->prepare("INSERT INTO locations (name, slug, type, parent_id, description, status, created_at) 
                                     VALUES (:name, :slug, 'spot', :parent_id, :description, 'active', NOW())");
                $stmt->execute([
                    'name' => $spotName,
                    'slug' => $spotSlug,
                    'parent_id' => $provinceId,
                    'description' => $spot['mo_ta'] . " - " . $spot['diem_noi_bat']
                ]);
                echo "    > Đã thêm điểm: $spotName\n";
            }
        }
    }

    echo "\nHoàn tất import dữ liệu!\n";

} catch (Exception $e) {
    echo "Lỗi: " . $e->getMessage() . "\n";
}
?>
