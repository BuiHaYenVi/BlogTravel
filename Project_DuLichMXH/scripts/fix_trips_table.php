<?php
require_once __DIR__ . '/app/config/database.php';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    $sql = "ALTER TABLE trips 
            ADD COLUMN IF NOT EXISTS destination_id INTEGER, 
            ADD COLUMN IF NOT EXISTS end_date DATE, 
            ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2) DEFAULT 0, 
            ADD COLUMN IF NOT EXISTS itinerary JSONB,
            RENAME COLUMN departure_date TO start_date;
            ";
    
    // Lưu ý: Nếu departure_date đã đổi tên rồi thì lệnh trên sẽ lỗi. Ta check trước.
    $check = $conn->query("SELECT column_name FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'departure_date'");
    if ($check->fetch()) {
        $conn->exec("ALTER TABLE trips RENAME COLUMN departure_date TO start_date");
    }

    $conn->exec("ALTER TABLE trips 
            ADD COLUMN IF NOT EXISTS destination_id INTEGER, 
            ADD COLUMN IF NOT EXISTS end_date DATE, 
            ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2) DEFAULT 0, 
            ADD COLUMN IF NOT EXISTS itinerary JSONB;");

    echo "✅ Đã cập nhật cấu trúc bảng trips thành công.\n";

} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
}
