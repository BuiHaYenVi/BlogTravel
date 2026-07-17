<?php
require_once __DIR__ . '/../../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../../utils/Response.php';
// ✅ SỬA ĐÚNG: Chỉ lùi 2 cấp từ Admin/ → app/ → config/database.php
require_once __DIR__ . '/../../config/database.php'; 

abstract class BaseAdminController {
    protected $db;
    
    public function __construct() {
        // Kiểm tra quyền Admin ngay khi khởi tạo Controller
        AdminMiddleware::check();
        
        // Khởi tạo kết nối Database
        $this->db = \Database::getInstance()->getConnection();
    }
}