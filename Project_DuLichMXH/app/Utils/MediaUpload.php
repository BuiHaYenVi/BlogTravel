<?php
namespace App\Utils;

use Exception;

class MediaUpload {
    protected static $allowedMimes = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'video/mp4'  => 'mp4',
        'video/webm' => 'webm',
        'video/quicktime' => 'mov'
    ];

    /**
     * Upload file bảo mật, hỗ trợ cả ảnh và video.
     * 
     * @param array $file File lấy từ $_FILES['name']
     * @param string $subDir Thư mục con trong public/uploads/ (vd: 'stories', 'avatars')
     * @param int $maxSize Kích thước tối đa cho phép (mặc định 20MB)
     * @return array Trả về mảng chứa 'url' tuyệt đối và 'type' ('image' hoặc 'video')
     * @throws Exception
     */
    public static function upload(array $file, string $subDir = 'stories', int $maxSize = 20 * 1024 * 1024): array {
        if (!isset($file['error']) || is_array($file['error'])) {
            throw new Exception("Tham số file không hợp lệ.");
        }

        switch ($file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_NO_FILE:
                throw new Exception("Không có file nào được tải lên.");
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                throw new Exception("Kích thước file vượt quá giới hạn cấu hình của máy chủ.");
            default:
                throw new Exception("Lỗi không xác định khi tải file.");
        }

        if ($file['size'] > $maxSize) {
            throw new Exception("Kích thước tệp vượt quá giới hạn cho phép (" . ($maxSize / 1024 / 1024) . "MB).");
        }

        // Kiểm tra MIME type thực tế của file bằng finfo
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!array_key_exists($mime, self::$allowedMimes)) {
            throw new Exception("Định dạng tệp không được hỗ trợ (chỉ nhận JPG, PNG, WEBP, MP4, WEBM).");
        }

        // Xác định loại media ('image' hoặc 'video')
        $mediaType = strpos($mime, 'video/') === 0 ? 'video' : 'image';
        
        $ext = self::$allowedMimes[$mime];
        $filename = 'media_' . uniqid() . '_' . time() . '.' . $ext;
        
        // Đường dẫn tuyệt đối để ghi file vật lý trên server
        $uploadDir = __DIR__ . '/../../public/uploads/' . $subDir . '/';

        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                throw new Exception("Không thể khởi tạo thư mục tải lên trên máy chủ.");
            }
        }

        if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
            $relativeUrl = 'uploads/' . $subDir . '/' . $filename;
            return [
                'url' => asset_url($relativeUrl),
                'type' => $mediaType
            ];
        }

        throw new Exception("Không thể lưu tệp tin vào thư mục đích.");
    }
}
