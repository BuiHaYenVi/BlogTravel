<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\Trip;
use App\Models\Notification;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;
use Exception;
use App\Config\Database;

class TripController extends BaseController {
    private $tripModel;
    private $notificationModel;

    public function __construct() {
        $this->tripModel = new Trip();
        $this->notificationModel = new Notification();
    }

    public function index() {
        try {
            $filters = [
                'category_tag' => $_GET['tag'] ?? null,
                'location' => $_GET['location'] ?? null,
                'status' => $_GET['status'] ?? null
            ];
            
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            
            // Lấy ID người dùng hiện tại nếu đã đăng nhập (không bắt buộc)
            $currentUserId = null;
            try {
                $currentUser = AuthMiddleware::verifyToken(false);
                $currentUserId = $currentUser ? $currentUser['user_id'] : null;
            } catch (Exception $e) {}

            $trips = $this->tripModel->getAvailableTrips($filters, $limit, $currentUserId);
            
            return $this->success('Danh sách chuyến đi', $trips);
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function getMyTrips() {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $trips = $this->tripModel->getUserTrips($currentUser['user_id']);
            return $this->success('Chuyến đi của tôi', $trips);
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function getTags() {
        try {
            $tags = $this->tripModel->getAllTags();
            return $this->success('Danh sách tags', $tags);
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function create() {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $data = $this->getInput();

            if (empty($data['title'])) {
                return $this->error('Tiêu đề không được để trống', 400);
            }

            $tripData = [
                'user_id' => $currentUser['user_id'],
                'title' => $data['title'],
                'location' => $data['location'] ?? '',
                'description' => $data['description'] ?? '',
                'destination_id' => $data['destination_id'] ?? null,
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'budget' => $data['budget'] ?? 0,
                'max_members' => $data['max_participants'] ?? 2,
                'current_members' => 1,
                'status' => 'preparing',
                'category_tag' => !empty($data['tags']) ? implode(',', $data['tags']) : null,
                'itinerary' => isset($data['itinerary']) ? json_encode($data['itinerary']) : null
            ];

            $tripId = $this->tripModel->create($tripData);

            if ($tripId) {
                return $this->success('Tạo chuyến đi thành công', ['trip_id' => $tripId], 201);
            } else {
                return $this->error('Không thể tạo chuyến đi', 500);
            }
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function show($id) {
        try {
            $trip = $this->tripModel->findById($id);
            if (!$trip) {
                return $this->error('Không tìm thấy chuyến đi', 404);
            }
            
            $trip['participants'] = $this->tripModel->getParticipants($id, 'accepted');

            $trip['user_status'] = null;
            try {
                $currentUser = AuthMiddleware::verifyToken(false);
                if ($currentUser) {
                    $userReq = $this->tripModel->getParticipants($id);
                    foreach ($userReq as $r) {
                        if ((int)$r['user_id'] === (int)$currentUser['user_id']) {
                            $trip['user_status'] = $r['status'];
                            break;
                        }
                    }
                }
            } catch (Exception $e) {}
            
            return $this->success('Chi tiết chuyến đi', $trip);
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function joinRequest($tripId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $data = $this->getInput();
            
            $trip = $this->tripModel->findById($tripId);
            if (!$trip) return $this->error('Chuyến đi không tồn tại', 404);
            
            if ((int)$trip['user_id'] === (int)$currentUser['user_id']) {
                return $this->error('Bạn không thể đăng ký tham gia chuyến đi của chính mình', 400);
            }

            $result = $this->tripModel->addParticipant($tripId, $currentUser['user_id'], $data['note'] ?? '');
            
            if ($result) {
                try {
                    $this->notificationModel->create([
                        'user_id' => $trip['user_id'],
                        'actor_id' => $currentUser['user_id'],
                        'type' => 'trip_request',
                        'target_id' => (int)$tripId,
                        'target_type' => 'trip',
                        'custom_message' => "{$currentUser['username']} muốn tham gia chuyến đi '{$trip['title']}' của bạn."
                    ]);
                } catch (Exception $ne) {}
                
                return $this->success('Đã gửi yêu cầu tham gia');
            } else {
                return $this->error('Bạn đã gửi yêu cầu rồi hoặc có lỗi xảy ra', 400);
            }
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function getJoinRequests($tripId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $trip = $this->tripModel->findById($tripId);
            
            if (!$trip || (int)$trip['user_id'] !== (int)$currentUser['user_id']) {
                return $this->error('Bạn không có quyền xem yêu cầu này', 403);
            }

            $requests = $this->tripModel->getParticipants($tripId, 'pending');
            return $this->success('Danh sách yêu cầu', $requests);
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function acceptParticipant($tripId, $participantUserId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $trip = $this->tripModel->findById($tripId);
            
            if (!$trip || (int)$trip['user_id'] !== (int)$currentUser['user_id']) {
                return $this->error('Bạn không có quyền thực hiện hành động này', 403);
            }

            if ((int)$trip['current_participants'] >= (int)$trip['max_participants']) {
                return $this->error('Chuyến đi đã đủ thành viên', 400);
            }

            $result = $this->tripModel->updateParticipantStatus($tripId, $participantUserId, 'accepted');
            
            if ($result) {
                try {
                    $this->notificationModel->create([
                        'user_id' => (int)$participantUserId,
                        'actor_id' => $currentUser['user_id'],
                        'type' => 'trip_accepted',
                        'target_id' => (int)$tripId,
                        'target_type' => 'trip',
                        'custom_message' => "Yêu cầu tham gia chuyến đi '{$trip['title']}' của bạn đã được chấp nhận!"
                    ]);
                } catch (Exception $ne) {}
                
                return $this->success('Đã chấp nhận thành viên');
            } else {
                return $this->error('Thao tác thất bại trên Database', 500);
            }
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function rejectParticipant($tripId, $participantUserId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $trip = $this->tripModel->findById($tripId);
            
            if (!$trip || (int)$trip['user_id'] !== (int)$currentUser['user_id']) {
                return $this->error('Bạn không có quyền thực hiện hành động này', 403);
            }

            $result = $this->tripModel->updateParticipantStatus($tripId, $participantUserId, 'rejected');
            
            if ($result) {
                return $this->success('Đã từ chối thành viên');
            } else {
                return $this->error('Thao tác thất bại trên Database', 500);
            }
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function leave($tripId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $trip = $this->tripModel->findById($tripId);
            
            if (!$trip) return $this->error('Chuyến đi không tồn tại', 404);
            if ((int)$trip['user_id'] === (int)$currentUser['user_id']) {
                return $this->error('Chủ chuyến đi không thể rời đoàn', 400);
            }

            $result = $this->tripModel->removeParticipant($tripId, $currentUser['user_id']);
            
            if ($result) {
                try {
                    $this->notificationModel->create([
                        'user_id' => (int)$trip['user_id'],
                        'actor_id' => $currentUser['user_id'],
                        'type' => 'trip_leave',
                        'target_id' => (int)$tripId,
                        'target_type' => 'trip',
                        'custom_message' => "{$currentUser['username']} đã rời khỏi chuyến đi '{$trip['title']}'."
                    ]);
                } catch (Exception $ne) {}
                
                return $this->success('Đã rời chuyến đi');
            } else {
                return $this->error('Thao tác thất bại', 500);
            }
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function removeMember($tripId, $participantUserId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $trip = $this->tripModel->findById($tripId);
            
            if (!$trip || (int)$trip['user_id'] !== (int)$currentUser['user_id']) {
                return $this->error('Bạn không có quyền thực hiện hành động này', 403);
            }

            $result = $this->tripModel->removeParticipant($tripId, $participantUserId);
            
            if ($result) {
                try {
                    $this->notificationModel->create([
                        'user_id' => (int)$participantUserId,
                        'actor_id' => $currentUser['user_id'],
                        'type' => 'trip_removed',
                        'target_id' => (int)$tripId,
                        'target_type' => 'trip',
                        'custom_message' => "Bạn đã bị loại khỏi chuyến đi '{$trip['title']}'."
                    ]);
                } catch (Exception $ne) {}
                
                return $this->success('Đã loại thành viên');
            } else {
                return $this->error('Thao tác thất bại', 500);
            }
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function getTripDayById($dayId) {
        try {
            $sql = "SELECT * FROM trip_days WHERE id = :id";
            $res = Database::getInstance()->fetchAll($sql, ['id' => $dayId]);
            $day = $res[0] ?? null;

            if (!$day) {
                return $this->error('Không tìm thấy ngày lịch trình', 404);
            }

            // Decode activities
            $activities = is_string($day['activities']) ? json_decode($day['activities'], true) : $day['activities'];
            if (!is_array($activities)) $activities = [];

            // Sort by start_time
            usort($activities, function($a, $b) {
                return strcmp($a['start_time'] ?? '00:00', $b['start_time'] ?? '00:00');
            });

            $day['activities'] = $activities;
            return $this->success('Chi tiết ngày lịch trình', $day);
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function destroy($tripId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $trip = $this->tripModel->findById($tripId);
            
            if (!$trip || (int)$trip['user_id'] !== (int)$currentUser['user_id']) {
                return $this->error('Bạn không có quyền thực hiện hành động này', 403);
            }

            $participants = $this->tripModel->getParticipants($tripId, 'accepted');

            $result = $this->tripModel->deleteTrip($tripId);
            
            if ($result) {
                foreach ($participants as $p) {
                    try {
                        if ((int)$p['user_id'] !== (int)$currentUser['user_id']) {
                            $this->notificationModel->create([
                                'user_id' => (int)$p['user_id'],
                                'actor_id' => $currentUser['user_id'],
                                'type' => 'trip_disbanded',
                                'target_id' => 0, 
                                'target_type' => 'trip',
                                'custom_message' => "Chuyến đi '{$trip['title']}' đã được chủ chuyến đi giải tán."
                            ]);
                        }
                    } catch (Exception $ne) {}
                }
                
                return $this->success('Đã giải tán chuyến đi');
            } else {
                return $this->error('Thao tác thất bại', 500);
            }
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function toggleActivity($tripId, $activityId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $trip = $this->tripModel->findById($tripId);
            
            if (!$trip || (int)$trip['user_id'] !== (int)$currentUser['user_id']) {
                return $this->error('Bạn không có quyền thực hiện hành động này', 403);
            }

            $data = $this->getInput();
            $isCompleted = (bool)($data['completed'] ?? false);

            $result = $this->tripModel->updateActivityStatus($tripId, $activityId, $isCompleted);
            
            if ($result) {
                return $this->success('Cập nhật trạng thái hoạt động thành công');
            } else {
                return $this->error('Không thể cập nhật trạng thái', 500);
            }
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/trips/{id}
     * Cập nhật thông tin chi tiết chuyến đi (Chỉ Trưởng đoàn)
     */
    public function update($id) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $trip = $this->tripModel->findById($id);
            
            if (!$trip) {
                return $this->error('Chuyến đi không tồn tại', 404);
            }
            
            if ((int)$trip['user_id'] !== (int)$currentUser['user_id']) {
                return $this->error('Bạn không có quyền chỉnh sửa chuyến đi này', 403);
            }

            $data = $this->getInput();

            if (empty($data['title'])) {
                return $this->error('Tiêu đề không được để trống', 400);
            }

            $tripData = [
                'title' => $data['title'],
                'location' => $data['location'] ?? '',
                'description' => $data['description'] ?? '',
                'destination_id' => $data['destination_id'] ?? null,
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'budget' => $data['budget'] ?? 0,
                'max_members' => $data['max_participants'] ?? 2,
                'category_tag' => !empty($data['tags']) ? implode(',', $data['tags']) : null,
                'itinerary' => isset($data['itinerary']) ? json_encode($data['itinerary']) : null,
                'status' => $data['status'] ?? $trip['status']
            ];

            if ($this->tripModel->updateTrip($id, $tripData)) {
                return $this->success('Cập nhật chuyến đi thành công');
            } else {
                return $this->error('Không thể cập nhật chuyến đi', 500);
            }
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function inviteParticipant($tripId, $invitedUserId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $trip = $this->tripModel->findById($tripId);
            
            if (!$trip) {
                return $this->error('Chuyến đi không tồn tại', 404);
            }
            
            if ((int)$trip['user_id'] !== (int)$currentUser['user_id']) {
                return $this->error('Bạn không có quyền mời thành viên cho chuyến đi này', 403);
            }

            if ($trip['status'] !== 'preparing') {
                return $this->error('Chỉ có thể mời thành viên khi chuyến đi đang ở trạng thái chuẩn bị', 400);
            }

            if ((int)$trip['current_participants'] >= (int)$trip['max_participants']) {
                return $this->error('Chuyến đi đã đạt số lượng thành viên tối đa', 400);
            }

            $invitedUserId = (int)$invitedUserId;
            
            if ($invitedUserId === (int)$trip['user_id']) {
                return $this->error('Trưởng đoàn không thể tự mời chính mình', 400);
            }

            $status = $this->tripModel->checkParticipantStatus($tripId, $invitedUserId);
            if ($status === 'accepted') {
                return $this->error('Người này đã là thành viên của chuyến đi', 400);
            }
            if ($status === 'invited') {
                return $this->error('Bạn đã gửi lời mời cho người này rồi', 400);
            }
            if ($status === 'pending') {
                $this->tripModel->updateParticipantStatus($tripId, $invitedUserId, 'accepted');
                
                try {
                    $this->notificationModel->create([
                        'user_id' => $invitedUserId,
                        'actor_id' => $currentUser['user_id'],
                        'type' => 'trip_accepted',
                        'target_id' => (int)$tripId,
                        'target_type' => 'trip',
                        'custom_message' => "Yêu cầu tham gia chuyến đi '{$trip['title']}' của bạn đã được chấp nhận!"
                    ]);
                } catch (Exception $ne) {}
                
                return $this->success('Lời mời trùng với yêu cầu tham gia. Đã phê duyệt yêu cầu thành công!');
            }

            if ($this->tripModel->addInvitation($tripId, $invitedUserId)) {
                try {
                    $userModel = new \App\Models\User();
                    $actor = $userModel->findById($currentUser['user_id']);
                    $ownerName = $actor ? ($actor['full_name'] ?: $actor['username']) : $currentUser['username'];
                    $this->notificationModel->create([
                        'user_id' => $invitedUserId,
                        'actor_id' => $currentUser['user_id'],
                        'type' => 'trip_invite',
                        'target_id' => (int)$tripId,
                        'target_type' => 'trip',
                        'custom_message' => "<b>{$ownerName}</b> đã mời bạn tham gia chuyến đi '<b>{$trip['title']}</b>'."
                    ]);
                } catch (Exception $ne) {}

                return $this->success('Mời bạn bè thành công');
            } else {
                return $this->error('Không thể thực hiện lời mời', 500);
            }
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function acceptInvitation($tripId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $currentUserId = $currentUser['user_id'] ?? $currentUser['id'] ?? null;
            
            $trip = $this->tripModel->findById($tripId);
            if (!$trip) {
                return $this->error('Chuyến đi không tồn tại', 404);
            }

            if ((int)$trip['current_participants'] >= (int)$trip['max_participants']) {
                return $this->error('Chuyến đi đã đạt số lượng thành viên tối đa', 400);
            }

            $status = $this->tripModel->checkParticipantStatus($tripId, $currentUserId);
            if ($status !== 'invited') {
                return $this->error('Bạn không có lời mời nào cho chuyến đi này', 400);
            }

            if ($this->tripModel->acceptInvitation($tripId, $currentUserId)) {
                try {
                    $userModel = new \App\Models\User();
                    $actor = $userModel->findById($currentUserId);
                    $invitedName = $actor ? ($actor['full_name'] ?: $actor['username']) : $currentUser['username'];
                    $this->notificationModel->create([
                        'user_id' => (int)$trip['user_id'],
                        'actor_id' => $currentUserId,
                        'type' => 'trip_accepted',
                        'target_id' => (int)$tripId,
                        'target_type' => 'trip',
                        'custom_message' => "<b>{$invitedName}</b> đã đồng ý tham gia chuyến đi '<b>{$trip['title']}</b>' của bạn."
                    ]);
                } catch (Exception $ne) {}

                return $this->success('Đồng ý tham gia chuyến đi thành công!');
            } else {
                return $this->error('Thao tác thất bại', 500);
            }
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }

    public function rejectInvitation($tripId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $currentUserId = $currentUser['user_id'] ?? $currentUser['id'] ?? null;
            
            $trip = $this->tripModel->findById($tripId);
            if (!$trip) {
                return $this->error('Chuyến đi không tồn tại', 404);
            }

            $status = $this->tripModel->checkParticipantStatus($tripId, $currentUserId);
            if ($status !== 'invited') {
                return $this->error('Bạn không có lời mời nào cho chuyến đi này', 400);
            }

            if ($this->tripModel->rejectInvitation($tripId, $currentUserId)) {
                try {
                    $userModel = new \App\Models\User();
                    $actor = $userModel->findById($currentUserId);
                    $invitedName = $actor ? ($actor['full_name'] ?: $actor['username']) : $currentUser['username'];
                    $this->notificationModel->create([
                        'user_id' => (int)$trip['user_id'],
                        'actor_id' => $currentUserId,
                        'type' => 'trip_update',
                        'target_id' => (int)$tripId,
                        'target_type' => 'trip',
                        'custom_message' => "<b>{$invitedName}</b> đã từ chối lời mời tham gia chuyến đi '<b>{$trip['title']}</b>' của bạn."
                    ]);
                } catch (Exception $ne) {}

                return $this->success('Đã từ chối lời mời tham gia chuyến đi.');
            } else {
                return $this->error('Thao tác thất bại', 500);
            }
        } catch (Exception $e) {
            return $this->error('Lỗi server: ' . $e->getMessage(), 500);
        }
    }
}
