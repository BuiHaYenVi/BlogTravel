<?php
namespace App\Utils;

use App\Config\Database;
use Exception;

class StoryStorageManager {

    /**
     * Tính toán tổng dung lượng của thư mục lưu trữ Story (đơn vị: Bytes)
     */
    public static function getStorageSize(): int {
        $dir = __DIR__ . '/../../public/uploads/stories';
        return self::getFolderSize($dir);
    }

    /**
     * Hàm đệ quy tính dung lượng thư mục
     */
    private static function getFolderSize(string $dir): int {
        $size = 0;
        if (!is_dir($dir)) {
            return 0;
        }
        
        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            $path = $dir . '/' . $file;
            if (is_link($path)) {
                continue;
            }
            if (is_dir($path)) {
                $size += self::getFolderSize($path);
            } else {
                $size += filesize($path);
            }
        }
        return $size;
    }

    /**
     * Dọn dẹp các tệp tin của story đã hết hạn hoặc bị xóa mềm khỏi ổ đĩa
     * 
     * @return int Số lượng tệp đã xóa thành công
     */
    public static function cleanupExpiredFiles(): int {
        try {
            $db = Database::getInstance();
            
            // Tìm tất cả các story đã hết hạn hoặc bị xóa/ẩn mà tệp tin chưa được dọn dẹp
            $sql = "SELECT id, media_url 
                    FROM stories 
                    WHERE (expires_at < NOW() OR is_active = FALSE OR is_deleted = TRUE)
                      AND (file_cleaned = FALSE OR file_cleaned IS NULL)";
                      
            $expiredStories = $db->fetchAll($sql);
            
            if (empty($expiredStories)) {
                return 0;
            }
            
            $deletedCount = 0;
            
            foreach ($expiredStories as $story) {
                $mediaUrl = $story['media_url'];
                if (empty($mediaUrl)) {
                    continue;
                }
                
                // Trích xuất đường dẫn tệp tin từ URL
                $parsedPath = parse_url($mediaUrl, PHP_URL_PATH);
                $pos = strpos($parsedPath, '/uploads/');
                
                if ($pos !== false) {
                    $relativePath = substr($parsedPath, $pos + 1); // vd: uploads/stories/media_xxx.mp4
                    $localPath = __DIR__ . '/../../public/' . $relativePath;
                    
                    if (file_exists($localPath)) {
                        if (@unlink($localPath)) {
                            $deletedCount++;
                        }
                    } else {
                        // Nếu file vật lý không tồn tại thì ta vẫn coi là đã dọn dẹp
                        $deletedCount++;
                    }
                } else {
                    // Nếu URL không theo định dạng chuẩn, bỏ qua để tránh xóa nhầm
                    $deletedCount++;
                }
                
                // Cập nhật trạng thái file_cleaned = TRUE để không quét lại lần sau
                $db->execute("UPDATE stories SET file_cleaned = TRUE WHERE id = :id", ['id' => $story['id']]);
            }
            
            return $deletedCount;
            
        } catch (Exception $e) {
            error_log("StoryStorageManager@cleanupExpiredFiles Error: " . $e->getMessage());
            return 0;
        }
    }
}
