<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/Config/Database.php';
require_once __DIR__ . '/../app/Utils/Env.php';

// Bootstrap Environment variables manually from .env if needed
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $_ENV[trim($parts[0])] = trim($parts[1]);
            putenv(trim($line));
        }
    }
}

use App\Config\Database;

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    echo "1. Đang chạy SQL DDL để thiết lập bảng trung gian...\n";
    $sqlDdl = file_get_contents(__DIR__ . '/004_normalize_interests_and_tags.sql');
    $conn->exec($sqlDdl);
    echo "✅ Đã tạo các bảng user_interests và trip_tags thành công.\n\n";
    
    // Xóa dữ liệu cũ nếu chạy lại để tránh trùng lặp
    $conn->exec("TRUNCATE TABLE user_interests RESTART IDENTITY CASCADE;");
    $conn->exec("TRUNCATE TABLE trip_tags RESTART IDENTITY CASCADE;");
    
    // --- DI CHUYỂN USER INTERESTS ---
    echo "2. Đang đọc dữ liệu sở thích của người dùng...\n";
    $users = $db->fetchAll("SELECT id, interests FROM users WHERE status != 'deleted'");
    $userCount = 0;
    
    foreach ($users as $user) {
        $userId = $user['id'];
        $interestsStr = $user['interests'] ?? '';
        if (empty(trim($interestsStr))) continue;
        
        $tags = array_filter(array_map('trim', explode(',', str_replace(', ', ',', $interestsStr))));
        
        foreach ($tags as $tagName) {
            if (empty($tagName)) continue;
            
            // Tìm hoặc tạo tag sở thích
            $slug = slugify($tagName);
            $tagRow = $db->fetchAll("SELECT id FROM tags WHERE name = :name LIMIT 1", ['name' => $tagName]);
            
            if (!empty($tagRow)) {
                $tagId = $tagRow[0]['id'];
            } else {
                $tagId = $db->insert(
                    "INSERT INTO tags (name, slug, type, created_at) VALUES (:name, :slug, 'interest', NOW())",
                    ['name' => $tagName, 'slug' => $slug],
                    'tags_id_seq'
                );
            }
            
            // Insert vào user_interests
            try {
                $db->execute(
                    "INSERT INTO user_interests (user_id, tag_id) VALUES (:user_id, :tag_id) ON CONFLICT DO NOTHING",
                    ['user_id' => $userId, 'tag_id' => $tagId]
                );
                $userCount++;
            } catch (Exception $ex) {
                // Bỏ qua nếu lỗi trùng lặp khóa chính
            }
        }
    }
    echo "✅ Đã di chuyển thành công $userCount sở thích cho người dùng.\n\n";
    
    // --- DI CHUYỂN TRIP TAGS ---
    echo "3. Đang đọc dữ liệu thẻ chuyến đi...\n";
    $trips = $db->fetchAll("SELECT id, category_tag FROM trips");
    $tripCount = 0;
    
    foreach ($trips as $trip) {
        $tripId = $trip['id'];
        $tagsStr = $trip['category_tag'] ?? '';
        if (empty(trim($tagsStr))) continue;
        
        $tags = array_filter(array_map('trim', explode(',', str_replace(', ', ',', $tagsStr))));
        
        foreach ($tags as $tagName) {
            if (empty($tagName)) continue;
            
            // Tìm hoặc tạo tag
            $slug = slugify($tagName);
            $tagRow = $db->fetchAll("SELECT id FROM tags WHERE name = :name LIMIT 1", ['name' => $tagName]);
            
            if (!empty($tagRow)) {
                $tagId = $tagRow[0]['id'];
            } else {
                // Xác định loại dựa trên danh sách sở thích hay hashtag
                $type = 'interest'; // Mặc định chuyển sang interest để đồng bộ hóa
                $tagId = $db->insert(
                    "INSERT INTO tags (name, slug, type, created_at) VALUES (:name, :slug, :type, NOW())",
                    ['name' => $tagName, 'slug' => $slug, 'type' => $type],
                    'tags_id_seq'
                );
            }
            
            // Insert vào trip_tags
            try {
                $db->execute(
                    "INSERT INTO trip_tags (trip_id, tag_id) VALUES (:trip_id, :tag_id) ON CONFLICT DO NOTHING",
                    ['trip_id' => $tripId, 'tag_id' => $tagId]
                );
                $tripCount++;
            } catch (Exception $ex) {
                // Bỏ qua
            }
        }
    }
    echo "✅ Đã di chuyển thành công $tripCount thẻ chuyến đi.\n\n";
    echo "🎉 Quá trình di chuyển dữ liệu hoàn tất xuất sắc!\n";
    
} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
    exit(1);
}

function slugify($string) {
    $slug = mb_strtolower(trim($string), 'UTF-8');
    
    $slug = preg_replace('/[àáạảãâầấậẩẫăằắặẳẵ]/u', 'a', $slug);
    $slug = preg_replace('/[èéẹẻẽêềếệểễ]/u', 'e', $slug);
    $slug = preg_replace('/[ìíịỉĩ]/u', 'i', $slug);
    $slug = preg_replace('/[òóọỏõôồốộổỗơờớợởỡ]/u', 'o', $slug);
    $slug = preg_replace('/[ùúụủũưừứựửữ]/u', 'u', $slug);
    $slug = preg_replace('/[ỳýỵỷỹ]/u', 'y', $slug);
    $slug = preg_replace('/đ/u', 'd', $slug);
    
    $slug = preg_replace('/[^\p{L}\p{N}\-]/u', '-', $slug);
    $slug = preg_replace('/-+/', '-', $slug);
    
    return trim($slug, '-');
}
