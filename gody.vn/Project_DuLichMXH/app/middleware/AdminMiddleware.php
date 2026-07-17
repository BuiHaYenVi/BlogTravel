<?php
require_once __DIR__ . '/AuthMiddleware.php';
require_once __DIR__ . '/../utils/Response.php'; // ✅ SỬA LỖI: Chỉ cần ../utils/Response.php

class AdminMiddleware {
    /**
     * Kiểm tra quyền Admin/Mod
     * @param array|null $currentUser Payload từ token
     */
    public static function check($currentUser = null) {
        // 1. Xác thực token nếu chưa có thông tin user
        if (!$currentUser) {
            try {
                $currentUser = AuthMiddleware::verifyToken();
            } catch (Exception $e) {
                Response::error('Unauthorized: Bạn cần đăng nhập', 401);
                exit;
            }
        }

        $userId = $currentUser['user_id'] ?? $currentUser['id'] ?? 0;
        if (!$userId) {
            Response::error('Unauthorized: Phiên đăng nhập không hợp lệ', 401);
            exit;
        }

        // 2. Kết nối DB để kiểm tra Role
        $db = \Database::getInstance()->getConnection();
        
        // Query lấy role_slug của user
        $stmt = $db->prepare("
            SELECT r.slug FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            WHERE u.id = ? AND u.status = 'active'
        ");
        $stmt->execute([$userId]);
        $role = $stmt->fetch(PDO::FETCH_ASSOC);

        // 3. Danh sách role được phép truy cập Admin
        $allowedRoles = ['super-admin', 'admin', 'moderator'];
        
        // 4. Kiểm tra quyền
        if (!in_array($role['slug'] ?? '', $allowedRoles)) {
            Response::error('Forbidden: Bạn không có quyền truy cập khu vực này', 403);
            exit;
        }
        
        return $currentUser; // Trả về thông tin user nếu thành công
    }
}