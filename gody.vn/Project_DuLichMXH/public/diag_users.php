<?php
require_once __DIR__ . '/app/config/database.php';
header('Content-Type: text/html; charset=utf-8');

try {
    $db = Database::getInstance()->getConnection();
    echo "<h1>Chẩn đoán Database - Bảng Users</h1>";

    // 1. Kiểm tra cấu trúc các cột
    echo "<h3>1. Cấu trúc bảng:</h3>";
    $query = $db->query("
        SELECT column_name, data_type, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        AND column_name IN ('full_name', 'bio', 'location', 'interests', 'hometown')
    ");
    echo "<table border='1' cellpadding='10'>";
    echo "<tr><th>Cột</th><th>Kiểu dữ liệu</th><th>Độ dài tối đa</th></tr>";
    while ($row = $query->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr><td>{$row['column_name']}</td><td>{$row['data_type']}</td><td>{$row['character_maximum_length']}</td></tr>";
    }
    echo "</table>";

    // 2. Thử thực hiện một lệnh UPDATE mẫu để kiểm tra lỗi SQL
    echo "<h3>2. Thử nghiệm UPDATE (giả lập):</h3>";
    $testId = $db->query("SELECT id FROM users LIMIT 1")->fetchColumn();
    if ($testId) {
        $testBio = "Test Bio " . time();
        $testInterests = "Travel, Photography";
        try {
            $stmt = $db->prepare("UPDATE users SET bio = :bio, interests = :interests WHERE id = :id");
            $stmt->execute([':bio' => $testBio, ':interests' => $testInterests, ':id' => $testId]);
            echo "✅ UPDATE thử nghiệm thành công cho ID: $testId<br>";
            
            $verify = $db->prepare("SELECT bio, interests FROM users WHERE id = :id");
            $verify->execute([':id' => $testId]);
            $result = $verify->fetch(PDO::FETCH_ASSOC);
            echo "Dữ liệu sau khi verify: Bio='{$result['bio']}', Interests='{$result['interests']}'<br>";
        } catch (Exception $e) {
            echo "❌ Lỗi khi UPDATE thử nghiệm: " . $e->getMessage() . "<br>";
        }
    } else {
        echo "ℹ️ Không tìm thấy user nào để test.<br>";
    }

} catch (Exception $e) {
    echo "<h3 style='color:red'>❌ Lỗi hệ thống: " . $e->getMessage() . "</h3>";
}
?>