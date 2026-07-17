<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\User;
use App\Middleware\AuthMiddleware;
use App\Utils\Response;
use Exception;

class CompanionController extends BaseController {
    private $userModel;
    
    public function __construct() {
        $this->userModel = new User();
    }
    
    /**
     * GET /api/companions/suggestions
     * Lấy danh sách gợi ý bạn đồng hành
     */
    public function suggestions() {
        try {
            // Xác thực user (bắt buộc vì cần dựa trên sở thích cá nhân)
            $currentUser = AuthMiddleware::verifyToken();
            $userId = $currentUser['user_id'];
            
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $filter = isset($_GET['filter']) ? $_GET['filter'] : null;
            $search = isset($_GET['search']) ? $_GET['search'] : null;
            
            $suggestions = $this->userModel->getSuggestedCompanions($userId, $limit, $filter, $search);
            
            return $this->success('Danh sách gợi ý bạn đồng hành', $suggestions);
            
        } catch (Exception $e) {
            error_log("CompanionController@suggestions Error: " . $e->getMessage());
            return $this->error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
}
