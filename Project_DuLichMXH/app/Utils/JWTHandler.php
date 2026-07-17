<?php
namespace App\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JWTHandler {
    private static $algorithm = 'HS256';

    private static function getSecretKey() {
        return Env::get('JWT_SECRET', 'PROJECT_DULICH_MXH_SECURE_TOKEN_KEY_2026');
    }

    public static function generateToken($userData, $config = null) {
        $issuedAt = time();
        $expirationTime = $issuedAt + 604800; // 7 ngày

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

        return JWT::encode($payload, self::getSecretKey(), self::$algorithm);
    }

    public static function validateToken($jwt) {
        try {
            $decoded = JWT::decode($jwt, new Key(self::getSecretKey(), self::$algorithm));
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
}
?>