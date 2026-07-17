<?php
require_once __DIR__ . '/../utils/JWTHandler.php';
require_once __DIR__ . '/../utils/Response.php';

class AuthMiddleware {
    /**
     * Kiểm tra token có hợp lệ không
     * @return array User data nếu valid
     */
    public static function verifyToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        // Kiểm tra có token không
        if (empty($authHeader)) {
            Response::error('Missing authorization header', 401);
            exit; // ✅ QUAN TRỌNG: Dừng script sau khi trả error
        }

        // Extract token từ "Bearer <token>"
        if (preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
        } else {
            Response::error('Invalid token format', 401);
            exit; // ✅ QUAN TRỌNG
        }

        // Validate token
        $result = JWTHandler::validateToken($token);
        
        if (!$result['valid']) {
            if (strpos($result['message'], 'expired') !== false) {
                Response::error('Token has expired. Please login again.', 401);
            } else {
                Response::error('Invalid token: ' . $result['message'], 401);
            }
            exit; // ✅ QUAN TRỌNG
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