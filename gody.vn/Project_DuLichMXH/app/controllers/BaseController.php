<?php
abstract class BaseController {
    /**
     * Trả về response JSON chuẩn
     */
    protected function respond($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
    
    /**
     * Response thành công
     */
    protected function success($message, $data = [], $statusCode = 200) {
        return $this->respond([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $statusCode);
    }
    
    /**
     * Response lỗi
     */
    protected function error($message, $statusCode = 400, $errors = null) {
        return $this->respond([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], $statusCode);
    }
    
    /**
     * Parse JSON input
     */
    protected function getInput() {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}
?>