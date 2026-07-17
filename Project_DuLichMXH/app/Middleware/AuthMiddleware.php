<?php
namespace App\Middleware;

use App\Utils\JWTHandler;
use App\Utils\Response;

class AuthMiddleware {
    /**
     * Kiểm tra token có hợp lệ không
     * @param bool $throwError Nếu true, sẽ trả về Response::error và exit nếu không hợp lệ
     * @return array|null User data nếu valid, null nếu không valid và throwError = false
     */
    public static function verifyToken($throwError = true) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        // Fallback cho Apache/Nginx
        if (empty($authHeader) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (empty($authHeader) && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        
        // Kiểm tra có token không
        if (empty($authHeader)) {
            if (!$throwError) return null;
            Response::error('Missing authorization header', 401);
            exit; 
        }

        // Extract token từ "Bearer <token>"
        if (preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
        } else {
            if (!$throwError) return null;
            Response::error('Invalid token format', 401);
            exit;
        }

        // Validate token
        $result = JWTHandler::validateToken($token);
        
        if (!$result['valid']) {
            if (!$throwError) return null;
            if (strpos($result['message'], 'expired') !== false) {
                Response::error('Token has expired. Please login again.', 401);
            } else {
                Response::error('Invalid token: ' . $result['message'], 401);
            }
            exit;
        }

        $userData = (array)$result['data'];
        $userId = $userData['user_id'] ?? $userData['id'] ?? null;

        if ($userId) {
            // ✅ KIỂM TRA TRẠNG THÁI USER TRONG DATABASE
            try {
                $db = \App\Config\Database::getInstance()->getConnection();
                $stmt = $db->prepare("SELECT status FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch(\PDO::FETCH_ASSOC);

                if (!$user || $user['status'] !== 'active') {
                    if (!$throwError) return null;
                    Response::error('Tài khoản của bạn đã bị khóa hoặc không tồn tại', 401);
                    exit;
                }
            } catch (\Exception $e) {
                // Nếu lỗi DB, vẫn cho qua hoặc log lại tùy chính sách, ở đây tạm thời log
                error_log("AuthMiddleware DB Check Error: " . $e->getMessage());
            }
        }

        // Kiểm tra token sắp hết hạn (< 1 ngày) → trả về warning header
        if (isset($result['exp']) && $result['exp'] - time() < 86400) {
            header('X-Token-Expiring-Soon: true');
        }

        return $result['data'];
    }
    
    /**
     * Require authentication - alias cho verifyToken() để dễ đọc
     * @return array User data
     */
    public static function require() {
        return self::verifyToken();
    }

    /**
     * Kiểm tra role (optional - cho admin)
     */
    public static function requireRole($allowedRoles = []) {
        $user = self::verifyToken();
        
        if (!in_array($user['role_id'], $allowedRoles)) {
            Response::error('Insufficient permissions', 403);
            exit; // ✅ QUAN TRỌNG
        }
        
        return $user;
    }
}
?>