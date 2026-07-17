<?php
namespace App\Utils;

class Response {
    public static function json($data, $code = 200) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');

        // Debug mode: Nếu có lỗi 500, log thêm chi tiết
        if ($code === 500 && isset($data['message'])) {
            error_log("SERVER ERROR 500: " . $data['message']);
        }

        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
    public static function success($msg, $data = null) {
        self::json([
            'success' => true, 
            'message' => $msg, 
            'data' => $data
        ], 200);
    }

    public static function error($msg, $code = 400, $errors = null) {
        self::json([
            'success' => false, 
            'message' => $msg, 
            'errors' => $errors
        ], $code);
    }
}
?>