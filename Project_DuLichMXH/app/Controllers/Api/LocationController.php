<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Location;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use Exception;

class LocationController extends BaseController {
    private $locationModel;
    
    public function __construct() {
        $this->locationModel = new Location();
    }
    
    /**
     * POST /api/locations
     * Tạo địa điểm mới (Chỉ admin/mod)
     */
    public function store() {
        try {
            // ✅ Verify auth (có thể thêm check role sau)
            AuthMiddleware::verifyToken();
            
            $input = $this->getInput();
            
            // ✅ Validate required fields
            if (empty($input['name']) || empty($input['slug']) || empty($input['type'])) {
                return $this->error('Thiếu name, slug hoặc type', 400);
            }
            
            // ✅ Check slug exists
            if ($this->locationModel->slugExists($input['slug'])) {
                return $this->error('Slug đã tồn tại', 409);
            }
            
            // ✅ Create location
            $locationId = $this->locationModel->create($input);
            
            return $this->success('Tạo địa điểm thành công', ['location_id' => $locationId], 201);
            
        } catch (Exception $e) {
            error_log("LocationController@store Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }

    /**
     * GET /api/locations
     * Danh sách địa điểm (Public)
     */
    public function index() {
        try {
            $locations = $this->locationModel->getAll();
            
            return $this->success('Danh sách địa điểm', $locations);
            
        } catch (Exception $e) {
            error_log("LocationController@index Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }

    /**
     * GET /api/locations/{id_or_slug}
     * Chi tiết địa điểm (Public)
     */
    public function show($idOrSlug) {
        try {
            // Kiểm tra xem là ID (số) hay Slug (chuỗi)
            if (is_numeric($idOrSlug)) {
                $location = $this->locationModel->findById((int)$idOrSlug);
            } else {
                $location = $this->locationModel->findBySlug($idOrSlug);
            }
            
            if (!$location) {
                return $this->error('Địa điểm không tồn tại', 404);
            }
            
            return $this->success('Chi tiết địa điểm', $location);
            
        } catch (Exception $e) {
            error_log("LocationController@show Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }

    /**
     * POST /api/locations/{id}/checkin
     * Check-in tại địa điểm (Protected)
     */
    public function checkin($locationId) {
    try {
        $currentUser = AuthMiddleware::verifyToken();
        
        // ✅ FIX: Hỗ trợ cả 'id' và 'user_id'
        $userId = (int)($currentUser['user_id'] ?? $currentUser['id'] ?? 0);
        
        // ✅ Validate userId
        if ($userId === 0) {
            return $this->error('Phiên đăng nhập không hợp lệ', 401);
        }
        
        $locationId = (int)$locationId;
        $input = $this->getInput();
        
        $checkinId = $this->locationModel->checkin($userId, $locationId, $input['note'] ?? null);
        
        return $this->success('Check-in thành công', ['checkin_id' => $checkinId], 201);
        
    } catch (Exception $e) {
        error_log("LocationController@checkin Error: " . $e->getMessage());
        return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
    }
}

    /**
     * POST /api/locations/{id}/review
     * Đánh giá địa điểm (Protected)
     */
    public function review($locationId) {
    try {
        $currentUser = AuthMiddleware::verifyToken();
        
        // ✅ FIX: Hỗ trợ cả 'id' và 'user_id'
        $userId = (int)($currentUser['user_id'] ?? $currentUser['id'] ?? 0);
        
        // ✅ Validate userId
        if ($userId === 0) {
            return $this->error('Phiên đăng nhập không hợp lệ', 401);
        }
        
        $locationId = (int)$locationId;
        $input = $this->getInput();
        
        // ✅ Validate rating
        if (empty($input['rating']) || $input['rating'] < 1 || $input['rating'] > 5) {
            return $this->error('Rating phải từ 1 đến 5', 400);
        }
        
        // ✅ Create review
        $reviewData = [
            'title' => $input['title'] ?? null,
            'content' => $input['content'] ?? null,
            'visit_date' => $input['visit_date'] ?? null
        ];
        
        $reviewId = $this->locationModel->review($userId, $locationId, (int)$input['rating'], $reviewData);
        
        return $this->success('Đánh giá thành công', ['review_id' => $reviewId], 201);
        
    } catch (Exception $e) {
        error_log("LocationController@review Error: " . $e->getMessage());
        return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
    }
}
    
    /**
     * Alias cho review() - giữ tương thích route cũ
     */
    public function writeReview($locationId) {
        return $this->review($locationId);
    }
}
