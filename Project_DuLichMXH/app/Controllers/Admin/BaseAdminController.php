<?php

namespace App\Controllers\Admin;

use App\Controllers\BaseController;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use App\Middleware\AdminMiddleware;
use App\Config\Database;
use Exception;
use Throwable;

abstract class BaseAdminController extends BaseController {
    protected $db;
    
    public function __construct() {
        // Kiểm tra quyền Admin ngay khi khởi tạo Controller
        AdminMiddleware::check();
        
        // Khởi tạo kết nối Database
        $this->db = Database::getInstance()->getConnection();
    }
}
