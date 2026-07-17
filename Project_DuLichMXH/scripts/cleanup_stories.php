<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../app/Config/Database.php';
require_once __DIR__ . '/../app/Utils/Env.php';

// Bootstrap Environment variables manually from .env
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

use App\Utils\StoryStorageManager;

try {
    echo "--- BẮT ĐẦU DỌN DẸP FILE STORIES HẾT HẠN ---\n";
    $initialSize = StoryStorageManager::getStorageSize();
    echo "Dung lượng thư mục trước dọn dẹp: " . round($initialSize / 1024 / 1024, 2) . " MB\n";
    
    $deletedCount = StoryStorageManager::cleanupExpiredFiles();
    echo "Đã dọn dẹp xong: $deletedCount tệp tin hết hạn/xóa mềm.\n";
    
    $finalSize = StoryStorageManager::getStorageSize();
    echo "Dung lượng thư mục sau dọn dẹp: " . round($finalSize / 1024 / 1024, 2) . " MB\n";
    echo "Giải phóng được: " . round(($initialSize - $finalSize) / 1024 / 1024, 2) . " MB\n";
    echo "✅ Hoàn thành xuất sắc!\n";
} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage() . "\n";
    exit(1);
}
