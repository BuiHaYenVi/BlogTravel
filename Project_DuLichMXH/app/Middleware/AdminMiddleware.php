<?php
namespace App\Middleware;

use App\Utils\Response;
use App\Config\Database;
use PDO;
use Exception;

class AdminMiddleware {
    /**
     * Kiểm tra quyền Admin/Mod
     * @param string|null $requiredPermission Mã quyền bắt buộc (vd: 'system.rbac')
     */
    public static function check($requiredPermission = null) {
        // 1. Xác thực token
        try {
            $currentUser = AuthMiddleware::verifyToken();
        } catch (Exception $e) {
            Response::error('Unauthorized: Bạn cần đăng nhập', 401);
            exit;
        }

        $userId = $currentUser['user_id'] ?? $currentUser['id'] ?? 0;
        if (!$userId) {
            Response::error('Unauthorized: Phiên đăng nhập không hợp lệ', 401);
            exit;
        }

        // 2. Kết nối DB để kiểm tra Role và Permissions
        $db = Database::getInstance()->getConnection();
        
        // Query lấy role_slug và danh sách permissions
        $stmt = $db->prepare("
            SELECT r.slug as role_slug, p.slug as perm_slug
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id 
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            WHERE u.id = ? AND u.status = 'active'
        ");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($rows)) {
            Response::error('Forbidden: Tài khoản không có quyền truy cập', 403);
            exit;
        }

        $roleSlug = $rows[0]['role_slug'];
        $userPermissions = array_filter(array_column($rows, 'perm_slug'));

        // 3. Danh sách role được phép vào khu vực Admin cơ bản
        $allowedAdminRoles = ['super-admin', 'admin', 'moderator'];
        
        if (!in_array($roleSlug, $allowedAdminRoles)) {
            Response::error('Forbidden: Bạn không có quyền truy cập khu vực này', 403);
            exit;
        }
        
        // 4. Kiểm tra quyền cụ thể (Granular Check)
        // Super admin mặc định có tất cả quyền
        if ($requiredPermission && $roleSlug !== 'super-admin') {
            if (!in_array($requiredPermission, $userPermissions)) {
                Response::error("Forbidden: Bạn không có quyền thực hiện hành động này ($requiredPermission)", 403);
                exit;
            }
        }
        
        return $currentUser; 
    }
}