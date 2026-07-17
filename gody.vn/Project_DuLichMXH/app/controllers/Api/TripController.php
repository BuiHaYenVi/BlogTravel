<?php
// ✅ SỬA ĐÚNG ĐƯỜNG DẪN (lùi 2 cấp từ Api -> controllers -> app -> models/config)

// 1. Load Database
require_once __DIR__ . '/../../config/database.php';

// 2. Load Model Trip
require_once __DIR__ . '/../../models/Trip.php';

require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

class TripController {
    private $tripModel;
    private $db;
    
    public function __construct() {
        // Khởi tạo Model và DB
        $this->tripModel = new Trip();
        $this->db = \Database::getInstance();
    }

    // 🔐 PROTECTED: Tạo chuyến đi
    public function create() {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $input = json_decode(file_get_contents('php://input'), true);

            // Validate đầu vào tối thiểu
            if (empty($input['title'])) {
                return Response::error('Tiêu đề chuyến đi không được để trống', 400);
            }

            if (empty($input['destination_id'])) {
                return Response::error('Vui lòng chọn địa điểm điểm đến', 400);
            }

            // ✅ Kiểm tra destination_id có tồn tại không để tránh lỗi Foreign Key
            $locationCheck = $this->db->fetchAll("SELECT id FROM locations WHERE id = ?", [$input['destination_id']]);
            if (empty($locationCheck)) {
                return Response::error("Địa điểm (ID: {$input['destination_id']}) không hợp lệ hoặc không tồn tại trong bảng locations", 400);
            }

            // Gán dữ liệu mặc định cho các trường có thể thiếu từ Frontend
            $input['user_id'] = $currentUser['user_id'] ?? $currentUser['id'] ?? 0;
            
            if ($input['user_id'] <= 0) {
                return Response::error('Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại', 401);
            }

            $input['status'] = $input['status'] ?? 'preparing';
            $input['budget'] = $input['budget'] ?? 0;
            $input['description'] = $input['description'] ?? '';
            $input['max_participants'] = $input['max_participants'] ?? 10;
            $input['itinerary'] = isset($input['itinerary']) ? (is_string($input['itinerary']) ? $input['itinerary'] : json_encode($input['itinerary'])) : null;
            $input['category_tag'] = !empty($input['tags']) ? (is_array($input['tags']) ? implode(',', $input['tags']) : $input['tags']) : null;

            // Loại bỏ các field không thuộc bảng trips nếu có (như 'tags')
            $tripData = $input;
            unset($tripData['tags']);

            // Gọi Model tạo Trip
            $result = $this->tripModel->create($tripData);

            if (!$result || !isset($result['id'])) {
                return Response::error('Không thể tạo chuyến đi: Database không trả về ID', 500);
            }

            // Thêm owner làm participant đầu tiên
            $this->db->execute(
                "INSERT INTO trip_participants (trip_id, user_id, role, status, created_at) 
                 VALUES (?, ?, 'owner', 'accepted', NOW())",
                [$result['id'], $input['user_id']]
            );

            return Response::success('Tạo chuyến đi thành công', ['trip_id' => $result['id']], 201);
        } catch (PDOException $e) {
            error_log("TripController@create DB Error: " . $e->getMessage());
            return Response::error('Lỗi Database: ' . $e->getMessage(), 500);
        } catch (Exception $e) {
            error_log("TripController@create Error: " . $e->getMessage());
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    // ✅ PUBLIC: Danh sách chuyến đi
    public function index() {
        try {
            $status = $_GET['status'] ?? 'open';
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
            
            // Lấy ID user nếu đã đăng nhập (không bắt buộc)
            $userId = null;
            try {
                $currentUser = AuthMiddleware::verifyToken();
                $userId = $currentUser['user_id'] ?? $currentUser['id'] ?? null;
            } catch (Exception $e) {
                // Chưa đăng nhập cũng không sao
            }
            
            $trips = $this->tripModel->getAll($status, $limit, $userId);
            return Response::success('Danh sách chuyến đi', $trips);
        } catch (Exception $e) {
            error_log("TripController@index Error: " . $e->getMessage());
            return Response::error('Có lỗi xảy ra: ' . $e->getMessage(), 500);
        }
    }

    // 🔐 PROTECTED: Gửi yêu cầu tham gia
    public function joinRequest($tripId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $userId = $currentUser['user_id'] ?? $currentUser['id'] ?? 0;
            $input = json_decode(file_get_contents('php://input'), true);

            $success = $this->tripModel->joinRequest(
                $tripId,
                $userId,
                $input['note'] ?? null
            );
            
            if (!$success) {
                return Response::error('Bạn đã tham gia hoặc gửi yêu cầu cho chuyến đi này', 400);
            }
            
            return Response::success('Đã gửi yêu cầu tham gia chuyến đi');
        } catch (Exception $e) {
            error_log("TripController@joinRequest Error: " . $e->getMessage());
            return Response::error('Có lỗi xảy ra: ' . $e->getMessage(), 500);
        }
    }

    // 🔐 PROTECTED: Chấp nhận participant
    public function acceptParticipant($tripId, $participantId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $ownerId = $currentUser['user_id'] ?? $currentUser['id'] ?? 0;
            
            $success = $this->tripModel->acceptParticipant($tripId, $participantId, $ownerId);
            
            if (!$success) {
                return Response::error('Bạn không có quyền chấp nhận người tham gia', 403);
            }
            
            return Response::success('Đã chấp nhận người tham gia');
        } catch (Exception $e) {
            error_log("TripController@acceptParticipant Error: " . $e->getMessage());
            return Response::error('Có lỗi xảy ra: ' . $e->getMessage(), 500);
        }
    }

    // 🔐 PROTECTED: Từ chối participant
    public function rejectParticipant($tripId, $participantId) {
        try {
            $currentUser = AuthMiddleware::verifyToken();
            $ownerId = $currentUser['user_id'] ?? $currentUser['id'] ?? 0;
            
            $success = $this->tripModel->rejectParticipant($tripId, $participantId, $ownerId);
            
            if (!$success) {
                return Response::error('Bạn không có quyền từ chối người tham gia', 403);
            }
            
            return Response::success('Đã từ chối người tham gia');
        } catch (Exception $e) {
            error_log("TripController@rejectParticipant Error: " . $e->getMessage());
            return Response::error('Có lỗi xảy ra: ' . $e->getMessage(), 500);
        }
    }
}