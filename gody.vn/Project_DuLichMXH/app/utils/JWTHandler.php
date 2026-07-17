<?php
require_once __DIR__ . '/../../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWTHandler {
    // Sử dụng một chìa khóa cố định để tránh bị lệch giữa các file config
    private static $secretKey = 'PROJECT_DULICH_MXH_SECURE_TOKEN_KEY_2026';
    private static $algorithm = 'HS256';

    /**
     * Tạo JWT token
     * Chấp nhận 2 tham số để tương thích với AuthController cũ
     */
    public static function generateToken($userData, $config = null) {
        $issuedAt = time();
        $expirationTime = $issuedAt + 604800; // Mặc định 7 ngày

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'iss' => 'dulichmxh-api',
            'data' => [
                'user_id'  => $userData['id'] ?? $userData['user_id'],
                'username' => $userData['username'],
                'role_id'  => $userData['role_id']
            ]
        ];

        return JWT::encode($payload, self::$secretKey, self::$algorithm);
    }

    /**
     * Giải mã và validate JWT token
     */
    public static function validateToken($jwt) {
        try {
            $decoded = JWT::decode($jwt, new Key(self::$secretKey, self::$algorithm));
            return [
                'valid' => true,
                'data' => (array) $decoded->data,
                'exp' => $decoded->exp
            ];
        } catch (Exception $e) {
            return [
                'valid' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public static function getUserFromToken($jwt) {
        $result = self::validateToken($jwt);
        return $result['valid'] ? $result['data'] : null;
    }
}
?>