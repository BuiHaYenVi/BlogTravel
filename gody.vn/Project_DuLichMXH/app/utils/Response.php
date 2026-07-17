<?php
class Response {
    public static function json($data, $code = 200) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
        
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit; // ⚠️ QUAN TRỌNG: Ngăn PHP in thêm "1" hay lỗi khác
    }

    public static function success($msg, $data = null) {
        self::json(['status' => 'success', 'message' => $msg, 'data' => $data]);
    }

    public static function error($msg, $code = 400, $errors = null) {
        self::json(['status' => 'error', 'message' => $msg, 'errors' => $errors], $code);
    }
}