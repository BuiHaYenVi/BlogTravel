<?php
namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Story;
use App\Middleware\AuthMiddleware;
use App\Utils\MediaUpload;
use App\Utils\StoryStorageManager;
use Exception;

class StoryController extends BaseController {
    private $storyModel;

    public function __construct() {
        $this->storyModel = new Story();
    }

    /**
     * POST /api/stories
     * Đăng story mới (hỗ trợ ảnh tĩnh/video ngắn)
     */
    public function create() {
        try {
            // Xác thực token người dùng
            $currentUser = AuthMiddleware::verifyToken();
            $userId = $currentUser['user_id'];

            // Kiểm tra hạn mức dung lượng lưu trữ 3GB (Quota Guard)
            $maxFolderSize = 3.0 * 1024 * 1024 * 1024; // 3GB
            $warningThreshold = 2.8 * 1024 * 1024 * 1024; // 2.8GB
            
            $currentSize = StoryStorageManager::getStorageSize();
            if ($currentSize > $warningThreshold) {
                // Kích hoạt dọn dẹp khẩn cấp tệp hết hạn
                StoryStorageManager::cleanupExpiredFiles();
                $currentSize = StoryStorageManager::getStorageSize();
            }
            
            if ($currentSize > $maxFolderSize) {
                return $this->error('Dung lượng bộ nhớ lưu trữ Story tạm thời đã đầy (đạt hạn mức 3GB). Vui lòng thử lại sau.', 400);
            }

            if (!isset($_FILES['media'])) {
                return $this->error('Vui lòng chọn hình ảnh hoặc video ngắn cho tin của bạn.', 400);
            }

            // Tải tệp lên thư mục public/uploads/stories thông qua Helper bảo mật
            $uploadResult = MediaUpload::upload($_FILES['media'], 'stories');

            // Caption tùy chọn
            $caption = isset($_POST['caption']) ? trim($_POST['caption']) : null;
            if ($caption === '') {
                $caption = null;
            }

            $storyData = [
                'user_id' => $userId,
                'media_url' => $uploadResult['url'],
                'media_type' => $uploadResult['type'],
                'caption' => $caption
            ];

            $storyId = $this->storyModel->createStory($storyData);
            if ($storyId) {
                return $this->success('Đăng tin ngắn thành công!', [
                    'story_id' => (string)$storyId,
                    'media_url' => $uploadResult['url'],
                    'media_type' => $uploadResult['type'],
                    'caption' => $caption
                ], 201);
            }

            return $this->error('Đăng tin thất bại trong cơ sở dữ liệu.', 500);

        } catch (Exception $e) {
            return $this->error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/stories/feed
     * Lấy danh sách tin ngắn 24h còn hoạt động (của chính mình và followings)
     */
    public function feed() {
        try {
            // Xác thực token người dùng
            $currentUser = AuthMiddleware::verifyToken();
            $userId = $currentUser['user_id'];

            $feed = $this->storyModel->getActiveFeed($userId);
            return $this->success('Tải danh sách tin ngắn thành công', $feed);

        } catch (Exception $e) {
            return $this->error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/users/{id}/stories
     * Lấy danh sách tin ngắn của một người dùng cụ thể
     */
    public function getUserStories($userId) {
        try {
            $currentUserId = 0;
            $currentUser = AuthMiddleware::verifyToken(false);
            if ($currentUser) {
                $currentUserId = $currentUser['user_id'];
            }
            
            $stories = $this->storyModel->getUserStories((int)$userId, $currentUserId);
            return $this->success('Tải tin ngắn người dùng thành công', $stories);
        } catch (Exception $e) {
            return $this->error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/stories/{id}/like
     * Thả tim / Bỏ thả tim cho tin ngắn
     */
    public function toggleLike($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $userId = $currentUser['user_id'];

            $res = $this->storyModel->toggleLike((int)$id, $userId);
            return $this->success('Thực hiện tương tác thành công', $res);
        } catch (Exception $e) {
            return $this->error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/stories/archive
     * Lấy danh sách tin ngắn lưu trữ của bản thân
     */
    public function archive() {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $userId = $currentUser['user_id'];

            $archive = $this->storyModel->getArchive($userId);
            return $this->success('Tải danh sách lưu trữ thành công', $archive);
        } catch (Exception $e) {
            return $this->error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/stories/{id}
     * Xóa tin ngắn
     */
    public function delete($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $userId = $currentUser['user_id'];

            $story = $this->storyModel->findById((int)$id);
            if (!$story) {
                return $this->error('Không tìm thấy tin ngắn này hoặc tin đã bị xóa.', 404);
            }

            if ((int)$story['user_id'] !== $userId) {
                return $this->error('Bạn không có quyền xóa tin ngắn này.', 403);
            }

            if ($this->storyModel->deleteStory((int)$id)) {
                return $this->success('Xóa tin ngắn thành công!');
            }
            return $this->error('Không thể xóa tin ngắn.', 500);
        } catch (Exception $e) {
            return $this->error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
}
