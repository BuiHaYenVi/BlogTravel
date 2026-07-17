<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Notification;
use App\Middleware\AuthMiddleware;
use App\Utils\Response;
use App\Config\Database;
use Exception;

class NotificationController extends BaseController {
    private $notificationModel;

    public function __construct() {
        $this->notificationModel = new Notification();
    }

    public function index() {
        $user = AuthMiddleware::require();
        $userId = $user['user_id'] ?? $user['id'];
        $notifications = $this->notificationModel->getByUserId($userId);
        $unreadCount = $this->notificationModel->getUnreadCount($userId);
        
        return $this->success('Lấy danh sách thông báo thành công', [
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
            'debug_user_id' => $userId
        ]);
    }

    public function debugAll() {
        $sql = "SELECT n.*, u.username as recipient, a.username as actor 
                FROM notifications n 
                LEFT JOIN users u ON n.actor_id = u.id
                LEFT JOIN users a ON n.user_id = a.id
                ORDER BY n.created_at DESC LIMIT 50";
        $data = (new Notification())->query($sql);
        return $this->success('Debug: Toàn bộ thông báo hệ thống', $data);
    }

    public function markAsRead($id) {
        $user = AuthMiddleware::require();
        $userId = $user['user_id'] ?? $user['id'];
        $this->notificationModel->markAsRead($id, $userId);
        return $this->success('Đã đánh dấu thông báo là đã đọc');
    }

    public function markAllRead() {
        $user = AuthMiddleware::require();
        $userId = $user['user_id'] ?? $user['id'];
        $this->notificationModel->markAllAsRead($userId);
        return $this->success('Đã đánh dấu tất cả là đã đọc');
    }

    /**
     * GET /api/notifications/all
     * Lấy TẤT CẢ thông báo (phân trang)
     */
    public function getAll() {
        $user = AuthMiddleware::require();
        $userId = $user['user_id'] ?? $user['id'];
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? min(50, max(1, (int)$_GET['limit'])) : 20;
        $offset = ($page - 1) * $limit;

        $notifications = $this->notificationModel->getByUserId($userId, $limit, $offset);
        $unreadCount = $this->notificationModel->getUnreadCount($userId);
        $totalCount = $this->notificationModel->getTotalCount($userId);

        return $this->success('Tất cả thông báo', [
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
            'pagination' => [
                'total' => (int)$totalCount,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => ceil($totalCount / $limit)
            ]
        ]);
    }

    /**
     * DELETE /api/notifications/{id}
     * Xóa một thông báo
     */
    public function destroy($id) {
        $user = AuthMiddleware::require();
        $userId = $user['user_id'] ?? $user['id'];
        $this->notificationModel->delete($id, $userId);
        return $this->success('Đã xóa thông báo');
    }

    /**
     * GET /api/notifications/fix-database
     * Cập nhật cấu trúc bảng notifications
     */
    public function fixDatabase() {
        try {
            $db = Database::getInstance()->getConnection();
            $output = "--- CẬP NHẬT BẢNG NOTIFICATIONS ---\n";

            // Thêm cột custom_message nếu chưa có
            $db->exec("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS custom_message TEXT DEFAULT NULL");
            $output .= "✅ Đã kiểm tra cột custom_message\n";

            // Thêm cột is_approved vào bảng posts
            $db->exec("ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE");
            $output .= "✅ Đã kiểm tra cột is_approved trong bảng posts\n";

            // Tạo index cho tốc độ query
            try {
                $db->exec("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)");
                $db->exec("CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)");
                $db->exec("CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read)");
                $output .= "✅ Đã kiểm tra các index\n";
            } catch (Exception $e) {
                $output .= "⚠️ Index: " . $e->getMessage() . "\n";
            }

            return $this->success('Cập nhật bảng notifications thành công', $output);
        } catch (Exception $e) {
            return $this->error('Lỗi fix database: ' . $e->getMessage(), 500);
        }
    }
}
