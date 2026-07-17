<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    // Xóa bảng cũ nếu có lỗi cấu trúc để tạo lại bản chuẩn
    $conn->exec("DROP TABLE IF EXISTS trips CASCADE;");

    $conn->exec("CREATE TABLE trips (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        departure_date DATE,
        category_tag VARCHAR(50),
        max_members INTEGER DEFAULT 2,
        current_members INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'recruiting',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );");

    echo "✅ Đã tạo bảng trips thành công.\n";

    $userRes = $conn->query("SELECT id FROM users LIMIT 1");
    $user = $userRes->fetch();
    
    if (!$user) {
        die("❌ Lỗi: Không tìm thấy user nào trong database để làm chủ chuyến đi.\n");
    }

    $userId = $user['id'];

    $trips = [
        [
            'user_id' => $userId,
            'title' => 'Săn mây Đà Lạt cuối tuần',
            'description' => 'Tìm 2 bạn đồng hành cùng đi săn mây và cafe chill tại Đà Lạt.',
            'location' => 'Đà Lạt, Lâm Đồng',
            'departure_date' => '2026-05-20',
            'category_tag' => '#Phượt',
            'max_members' => 4,
            'current_members' => 2
        ],
        [
            'user_id' => $userId,
            'title' => 'Camping Hồ Trị An',
            'description' => 'Cần thêm thành viên cho nhóm camping nướng BBQ cuối tuần này.',
            'location' => 'Hồ Trị An, Đồng Nai',
            'departure_date' => '2026-05-23',
            'category_tag' => '#Camping',
            'max_members' => 6,
            'current_members' => 3
        ],
        [
            'user_id' => $userId,
            'title' => 'Khám phá Hà Giang 4N3Đ',
            'description' => 'Lên kế hoạch đi Hà Giang, hiện tại đã có 2 xe. Cần thêm 1-2 bạn nữa.',
            'location' => 'Hà Giang',
            'departure_date' => '2026-06-01',
            'category_tag' => '#Khám phá',
            'max_members' => 4,
            'current_members' => 2
        ],
        [
            'user_id' => $userId,
            'title' => 'Chill tại Phú Quốc',
            'description' => 'Mình định đi Phú Quốc nghỉ dưỡng, tìm bạn nữ đi cùng cho vui.',
            'location' => 'Phú Quốc, Kiên Giang',
            'departure_date' => '2026-06-15',
            'category_tag' => '#Nghỉ dưỡng',
            'max_members' => 2,
            'current_members' => 1
        ]
    ];

    $stmt = $conn->prepare("INSERT INTO trips (user_id, title, description, location, departure_date, category_tag, max_members, current_members) 
                            VALUES (:user_id, :title, :description, :location, :departure_date, :category_tag, :max_members, :current_members)");

    foreach ($trips as $trip) {
        $stmt->execute($trip);
    }

    echo "✅ Đã thêm dữ liệu mẫu cho chuyến đi.\n";

} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
}
