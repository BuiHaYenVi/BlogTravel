<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Follow;
use App\Models\Notification;
use App\Models\User;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use Exception;
use Throwable;

class FollowController extends BaseController {
    private $followModel;
    
    public function __construct() {
        $this->followModel = new Follow();
    }
    
    /**
     * POST /api/follow/{id}
     * Toggle Theo dõi người dùng (Có Debug Notification)
     */
    public function follow($targetUserId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $followerId = $currentUser['user_id'] ?? $currentUser['id'] ?? null;
            $targetUserId = (int)$targetUserId;

            if (!$followerId) {
                return $this->error('Không tìm thấy thông tin người dùng từ token', 401);
            }

            if ($followerId === $targetUserId) {
                return $this->error('Không thể tự tương tác với chính mình', 400);
            }
            
            $isFollowing = $this->followModel->isFollowing($followerId, $targetUserId);
            $action = '';
            $notifDebug = null;

            if ($isFollowing) {
                $this->followModel->unfollow($followerId, $targetUserId);
                $action = 'unfollowed';
                $message = 'Đã hủy theo dõi thành công';
            } else {
                $this->followModel->follow($followerId, $targetUserId);
                $action = 'followed';
                $message = 'Đã theo dõi người dùng này';

                // ✅ Gửi thông báo và hứng lỗi debug
                $notifDebug = $this->sendFollowNotificationWithDebug($followerId, $targetUserId);
            }
            
            $responseData = [
                'is_following' => ($action === 'followed'),
                'action' => $action
            ];

            // Nếu có lỗi ở phần notification, đính kèm vào response để debug ở Network tab
            if ($notifDebug !== true && $notifDebug !== null) {
                $responseData['debug_notification_error'] = $notifDebug;
            }

            return $this->success($message, $responseData);

        } catch (Exception $e) {
            error_log("FollowController@follow Error: " . $e->getMessage());
            return $this->error('Có lỗi xảy ra: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Helper: Gửi thông báo và trả về lỗi nếu có để Debug
     */
    private function sendFollowNotificationWithDebug($followerId, $targetUserId) {
        try {
            // 1. Kiểm tra & Import Dependencies
            // PSR-4 handles this

            $notificationModel = new Notification();
            $userModel = new User();
            
            $actor = $userModel->findById($followerId);
            if (!$actor) return "Actor (User $followerId) not found in DB";
            
            $actorName = $actor['full_name'] ?: $actor['username'];

            // 2. Tạo Notification trong DB (Bắt lỗi SQL chi tiết)
            $notifDataToCreate = [
                'user_id' => $targetUserId,
                'actor_id' => $followerId,
                'type' => 'follow',
                'target_id' => $targetUserId, // Trong follow, target_id chính là người được follow
                'target_type' => 'user',
                'content' => "{$actorName} đã bắt đầu theo dõi bạn", // Dùng cả content và custom_message cho chắc
                'custom_message' => "<b>{$actorName}</b> đã bắt đầu theo dõi bạn",
                'redirect_url' => "/profile/{$followerId}"
            ];

            try {
                error_log("🔔 [DEBUG] Attempting INSERT Notification: " . json_encode($notifDataToCreate));
                
                // Truyền trực tiếp mảng vào để Model xử lý
                $notifId = $notificationModel->create($notifDataToCreate);

                if (!$notifId) {
                    // Nếu PostgreSQL trả về 0 do thiếu sequence name, ta có thể cần check lại Model
                    error_log("⚠️ [DEBUG] Notification created but ID is 0. Checking if record exists...");
                    $check = $notificationModel->first("user_id = :uid AND actor_id = :aid AND type = 'follow' ORDER BY created_at DESC", [
                        'uid' => $targetUserId,
                        'aid' => $followerId
                    ]);
                    $notifId = $check ? $check['id'] : null;
                }

                if (!$notifId) {
                    throw new Exception("Không thể lấy được ID sau khi INSERT notification.");
                }

                error_log("✅ [DEBUG] Notification Success. ID: $notifId");
            } catch (Exception $sqlEx) {
                $errorMsg = "Lỗi SQL Insert Notification: " . $sqlEx->getMessage();
                error_log("❌ " . $errorMsg);
                return $errorMsg; // Trả về lỗi để hiện ở debug_notification_error
            }

            // 3. Gửi Socket
            if (!function_exists('sync_notification_to_socket')) {
                return "Function sync_notification_to_socket is undefined";
            }

            $notifData = $notificationModel->first("id = :id", ['id' => $notifId]);
            if (!$notifData) return "Notification created but cannot fetch it back (ID: $notifId)";

            $notifData['actor_name'] = $actorName;
            $notifData['actor_avatar'] = ($actor['avatar'] && function_exists('asset_url')) 
                                        ? asset_url($actor['avatar']) 
                                        : null;
            
            $socketResult = sync_notification_to_socket($targetUserId, $notifData);
            
            if (!$socketResult) {
                return "Socket Server rejected or timed out (sync_notification_to_socket returned false)";
            }

            return true; // Thành công rực rỡ

        } catch (Throwable $e) {
            $msg = $e->getMessage() . " in " . $e->getFile() . " line " . $e->getLine();
            error_log("🔔 [DEBUG NOTIF] " . $msg);
            return $msg;
        }
    }
    
    public function unfollow($targetUserId) {
        return $this->follow($targetUserId);
    }
    
    public function followers($userId) {
        try {
            $followers = $this->followModel->getFollowers((int)$userId);
            return $this->success('Danh sách người theo dõi', ['followers' => $followers, 'total' => count($followers)]);
        } catch (Exception $e) {
            return $this->error('Có lỗi xảy ra', 500);
        }
    }
    
    public function following($userId) {
        try {
            $following = $this->followModel->getFollowing((int)$userId);
            return $this->success('Danh sách đang theo dõi', ['following' => $following, 'total' => count($following)]);
        } catch (Exception $e) {
            return $this->error('Có lỗi xảy ra', 500);
        }
    }

    public function mutual() {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            
            // Lấy user_id từ query parameter nếu có (để xem bạn bè của người khác)
            // Nếu không có, mặc định lấy ID của user hiện tại đang đăng nhập
            $userId = $_GET['user_id'] ?? $_GET['userId'] ?? null;
            if (!$userId) {
                $userId = $currentUser['user_id'] ?? $currentUser['id'] ?? null;
            }

            if (!$userId) {
                return $this->error('Không xác định được người dùng', 401);
            }

            $friends = $this->followModel->getMutualFollows($userId);
            
            // ✅ Chuẩn hóa URL Avatar tuyệt đối
            $baseUrl = "http://localhost:90/Project_DuLichMXH/public/";
            foreach ($friends as &$friend) {
                if (!empty($friend['avatar'])) {
                    // Nếu đã là link http thì giữ nguyên, nếu không thì nối path
                    if (strpos($friend['avatar'], 'http') !== 0) {
                        // Kiểm tra xem đã có 'uploads/avatars/' chưa
                        $path = $friend['avatar'];
                        if (strpos($path, 'uploads/') === false) {
                            $path = 'uploads/avatars/' . $path;
                        }
                        $friend['avatar'] = $baseUrl . ltrim($path, '/');
                    }
                } else {
                    $friend['avatar'] = $baseUrl . 'uploads/avatars/default.png';
                }
            }

            return $this->success('Danh sách bạn bè', [
                'friends' => $friends, 
                'total' => count($friends)
            ]);
        } catch (Throwable $e) {
            $errorMsg = $e->getMessage() . ' in ' . $e->getFile() . ' line ' . $e->getLine();
            error_log("❌ [Mutual Follow Error] " . $errorMsg);
            
            // Trả về lỗi debug để Frontend dễ xử lý
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách bạn bè',
                'debug_mutual_error' => $errorMsg
            ]);
            exit;
        }
    }
}
