<?php
require_once __DIR__ . '/../BaseController.php';
require_once __DIR__ . '/../../models/Follow.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

class FollowController extends BaseController {
    private $followModel;
    
    public function __construct() {
        $this->followModel = new Follow();
    }
    
    /**
     * POST /api/follow/{id}
     * Theo dõi người dùng
     */
    public function follow($targetUserId) {
        try {
            // ✅ Validate auth
            $currentUser = AuthMiddleware::verifyToken();
            $followerId = (int)($currentUser['user_id'] ?? $currentUser['id'] ?? 0);
            $targetUserId = (int)$targetUserId;
            if ($followerId === 0) {
    return $this->error('Invalid user ID in token', 401);
}
            // ✅ Validate: không tự follow chính mình
            if ($followerId === $targetUserId) {
                return $this->error('Không thể tự theo dõi chính mình', 400);
            }
            
            // ✅ Call Model
            $this->followModel->follow($followerId, $targetUserId);
            
            return $this->success('Đã theo dõi thành công');
            
        } catch (Exception $e) {
            if ($e->getMessage() === 'Already following') {
                return $this->error('Bạn đã theo dõi người này rồi', 409);
            }
            error_log("FollowController@follow Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }
    
    /**
     * DELETE /api/follow/{id}
     * Bỏ theo dõi người dùng
     */
    public function unfollow($targetUserId) {
        try {
            // ✅ Validate auth
            $currentUser = AuthMiddleware::verifyToken();
            $followerId = (int)($currentUser['user_id'] ?? $currentUser['id'] ?? 0);
            $targetUserId = (int)$targetUserId;
            if ($followerId === 0) {
    return $this->error('Invalid user ID in token', 401);
}
            // ✅ Call Model
            $this->followModel->unfollow($followerId, $targetUserId);
            
            return $this->success('Đã hủy theo dõi thành công');
            
        } catch (Exception $e) {
            error_log("FollowController@unfollow Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }
    
    /**
     * GET /api/users/{id}/followers
     * Xem danh sách người theo dõi (Followers) - PUBLIC
     */
    public function followers($userId) {
        try {
            $userId = (int)$userId;
            
            // ✅ Call Model
            $followers = $this->followModel->getFollowers($userId);
            
            return $this->success('Danh sách người theo dõi', [
                'followers' => $followers,
                'total' => count($followers)
            ]);
            
        } catch (Exception $e) {
            error_log("FollowController@followers Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }
    
    /**
     * GET /api/users/{id}/following
     * Xem danh sách đang theo dõi (Following) - PUBLIC
     */
    public function following($userId) {
        try {
            $userId = (int)$userId;
            
            // ✅ Call Model
            $following = $this->followModel->getFollowing($userId);
            
            return $this->success('Danh sách đang theo dõi', [
                'following' => $following,
                'total' => count($following)
            ]);
            
        } catch (Exception $e) {
            error_log("FollowController@following Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra, vui lòng thử lại sau', 500);
        }
    }
}
?>